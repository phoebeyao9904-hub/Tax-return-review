export type FederalPdfLine = {
  lineId:string;
  formNumber:string;
  sectionName:string;
  lineNumber:string;
  description:string;
  inputType:string;
};

export type FederalPdfTextItem = { text:string; x:number };
export type FederalPdfTextRow = { rowId:string; text:string; y:number; pageWidth:number; items:FederalPdfTextItem[] };
export type FederalPdfPage = { pageNumber:number; text:string; rows:FederalPdfTextRow[] };

export type FederalPdfCandidate = {
  candidateId:string;
  lineId:string;
  formNumber:string;
  sectionName:string;
  lineNumber:string;
  description:string;
  pageNumber:number;
  rowId:string;
  rawText:string;
  extractedValue:number;
  confidence:number;
  confidenceLabel:"High"|"Medium"|"Low";
  selected:boolean;
};

export type FederalPdfImportMapping = Pick<FederalPdfCandidate,"lineId"|"formNumber"|"sectionName"|"lineNumber"|"description"|"pageNumber"|"rawText"|"extractedValue"|"confidence"|"confidenceLabel"> & {
  previousAmount:number|null;
  overwritten:boolean;
};

export type FederalPdfImportAudit = {
  id:string;
  fileName:string;
  fileSize:number;
  fileHash:string;
  pageCount:number;
  textPageCount:number;
  detectedForms:string[];
  matchedCount:number;
  importedCount:number;
  skippedCount:number;
  importedAt:string;
  mappings:FederalPdfImportMapping[];
};

export type FederalPdfImportState = { history:FederalPdfImportAudit[] };
export const createDefaultFederalPdfImportState = ():FederalPdfImportState => ({history:[]});
export const normalizeFederalPdfImportState = (value?:Partial<FederalPdfImportState>):FederalPdfImportState => ({history:Array.isArray(value?.history)?value!.history!:[]});

const STOP_WORDS = new Set(["a","an","and","as","at","attach","balance","column","enter","for","form","from","if","in","include","including","line","loss","of","on","or","other","part","schedule","see","subtract","the","to","total","with"]);
const normalize = (value:string) => value.toLowerCase().replace(/[^a-z0-9%]+/g," ").replace(/\s+/g," ").trim();
const terms = (value:string) => normalize(value).split(" ").filter(word=>word.length>2&&!STOP_WORDS.has(word)).slice(0,12);
const escapeRegExp = (value:string) => value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

export function parsePdfAmount(value:string):number|null {
  const text=value.trim();
  if(!text||!/\d/.test(text)) return null;
  const percent=text.endsWith("%");
  const negative=/^\s*\(/.test(text)||/^\s*-/.test(text);
  const parsed=Number(text.replace(/[$,%()\s]/g,"").replace(/^\+/,""));
  if(!Number.isFinite(parsed)) return null;
  const signed=negative?-Math.abs(parsed):parsed;
  return percent?signed/100:signed;
}

function amountFromRow(row:FederalPdfTextRow,lineNumber:string) {
  const numeric=row.items.map((item,index)=>({item,index,value:parsePdfAmount(item.text)})).filter(entry=>entry.value!==null&&normalize(entry.item.text)!==normalize(lineNumber));
  if(!numeric.length) return null;
  const right=numeric.filter(entry=>entry.item.x>=row.pageWidth*.48);
  return (right.length?right:numeric).sort((a,b)=>b.item.x-a.item.x)[0];
}

function lineNumberMatch(row:FederalPdfTextRow,lineNumber:string) {
  const target=normalize(lineNumber);
  if(!target) return false;
  if(row.items.slice(0,5).some(item=>normalize(item.text)===target)) return true;
  return new RegExp(`(^|\\s)${escapeRegExp(target)}(?=\\s|$)`,`i`).test(normalize(row.text).slice(0,55));
}

function pageRelevance(page:FederalPdfPage,line:FederalPdfLine) {
  const pageText=normalize(page.text);
  const form=normalize(line.formNumber);
  const section=terms(line.sectionName);
  let score=0;
  if(form&&pageText.includes(form)) score+=.14;
  const sectionHits=section.filter(term=>pageText.includes(term)).length;
  if(section.length&&sectionHits/section.length>=.5) score+=.06;
  return score;
}

export function matchFederalPdf(pages:FederalPdfPage[],lines:FederalPdfLine[]) {
  const eligible=lines.filter(line=>["currency","calculated","percentage"].includes(line.inputType));
  const scored:{line:FederalPdfLine;row:FederalPdfTextRow;page:FederalPdfPage;value:number;score:number}[]=[];
  for(const line of eligible) {
    const descriptionTerms=terms(line.description);
    for(const page of pages) for(const row of page.rows) {
      if(!lineNumberMatch(row,line.lineNumber)) continue;
      const amount=amountFromRow(row,line.lineNumber);
      if(!amount) continue;
      const rowText=normalize(row.text);
      const hitCount=descriptionTerms.filter(term=>rowText.includes(term)).length;
      const overlap=descriptionTerms.length?hitCount/descriptionTerms.length:0;
      if(descriptionTerms.length&&hitCount===0) continue;
      const score=Math.min(1,.48+Math.min(.3,overlap*.36)+pageRelevance(page,line)+(amount.item.x>=row.pageWidth*.48?.08:.02));
      scored.push({line,row,page,value:amount.value!,score});
    }
  }
  const assignedLines=new Set<string>();
  const assignedRows=new Set<string>();
  const candidates:FederalPdfCandidate[]=[];
  for(const match of scored.sort((a,b)=>b.score-a.score)) {
    if(assignedLines.has(match.line.lineId)||assignedRows.has(match.row.rowId)||match.score<.58) continue;
    assignedLines.add(match.line.lineId); assignedRows.add(match.row.rowId);
    const confidenceLabel=match.score>=.82?"High":match.score>=.68?"Medium":"Low";
    candidates.push({candidateId:`${match.line.lineId}:${match.row.rowId}`,lineId:match.line.lineId,formNumber:match.line.formNumber,sectionName:match.line.sectionName,lineNumber:match.line.lineNumber,description:match.line.description,pageNumber:match.page.pageNumber,rowId:match.row.rowId,rawText:match.row.text,extractedValue:match.value,confidence:Math.round(match.score*100),confidenceLabel,selected:confidenceLabel==="High"});
  }
  const formNumbers=[...new Set(lines.map(line=>line.formNumber))];
  const detectedForms=formNumbers.filter(form=>pages.some(page=>normalize(page.text).includes(normalize(form))));
  return {candidates:candidates.sort((a,b)=>a.pageNumber-b.pageNumber||a.lineId.localeCompare(b.lineId)),eligibleLineCount:eligible.length,textPageCount:pages.filter(page=>page.text.trim()).length,detectedForms};
}
