"use client";

import { useRef, useState } from "react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { AlertTriangle, Check, FileSearch, FileText, LockKeyhole, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { matchFederalPdf, type FederalPdfCandidate, type FederalPdfImportAudit, type FederalPdfImportState, type FederalPdfLine, type FederalPdfPage, type FederalPdfTextItem } from "@/data/federal-pdf-import";

type Draft = { fileName:string; fileSize:number; fileHash:string; pageCount:number; textPageCount:number; detectedForms:string[]; eligibleLineCount:number; candidates:FederalPdfCandidate[] };
type Filter = "all"|"selected"|"conflicts"|"low";

const money=(value:number|null)=>value===null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(value);

async function digest(file:ArrayBuffer) {
  const bytes=await crypto.subtle.digest("SHA-256",file);
  return [...new Uint8Array(bytes)].map(value=>value.toString(16).padStart(2,"0")).join("");
}

async function extractPdf(file:File,onProgress:(value:number)=>void) {
  const data=await file.arrayBuffer();
  const [{getDocument,GlobalWorkerOptions},fileHash]=await Promise.all([import("pdfjs-dist"),digest(data.slice(0))]);
  GlobalWorkerOptions.workerSrc=pdfWorkerUrl;
  const document=await getDocument({data:new Uint8Array(data)}).promise;
  const pages:FederalPdfPage[]=[];
  for(let pageNumber=1;pageNumber<=document.numPages;pageNumber++) {
    const page=await document.getPage(pageNumber);
    const viewport=page.getViewport({scale:1});
    const content=await page.getTextContent();
    const positioned=content.items.flatMap(item=>"str" in item&&"transform" in item&&item.str.trim()?[{text:item.str.trim(),x:item.transform[4],y:item.transform[5]}]:[]).sort((a,b)=>Math.abs(b.y-a.y)>2.5?b.y-a.y:a.x-b.x);
    const grouped:{y:number;items:{text:string;x:number}[]}[]=[];
    for(const item of positioned) {
      const row=grouped.find(entry=>Math.abs(entry.y-item.y)<=2.5);
      if(row) row.items.push({text:item.text,x:item.x}); else grouped.push({y:item.y,items:[{text:item.text,x:item.x}]});
    }
    const rows=grouped.sort((a,b)=>b.y-a.y).map((row,index)=>{const items:FederalPdfTextItem[]=row.items.sort((a,b)=>a.x-b.x);return {rowId:`${pageNumber}:${index}`,text:items.map(item=>item.text).join(" "),y:row.y,pageWidth:viewport.width,items};});
    pages.push({pageNumber,text:rows.map(row=>row.text).join("\n"),rows});
    onProgress(Math.round(pageNumber/document.numPages*100));
  }
  return {pages,fileHash,pageCount:document.numPages};
}

export function FederalPdfImport({lines,currentAmounts,state,onStateChange,onApply}:{
  lines:FederalPdfLine[];
  currentAmounts:Record<string,number|null>;
  state:FederalPdfImportState;
  onStateChange:(state:FederalPdfImportState)=>void;
  onApply:(candidates:FederalPdfCandidate[],audit:FederalPdfImportAudit)=>void;
}) {
  const inputRef=useRef<HTMLInputElement>(null);
  const [open,setOpen]=useState(false);
  const [processing,setProcessing]=useState(false);
  const [progress,setProgress]=useState(0);
  const [message,setMessage]=useState("");
  const [draft,setDraft]=useState<Draft|null>(null);
  const [filter,setFilter]=useState<Filter>("all");
  const [allowOverwrite,setAllowOverwrite]=useState(false);
  const latest=state.history[0];

  async function choosePdf(event:React.ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0]; event.target.value=""; if(!file) return;
    setMessage(""); setDraft(null); setProgress(0); setProcessing(true); setOpen(true);
    try {
      if(file.size>75*1024*1024) throw new Error("The PDF is larger than 75 MB. Split the return package and import it in parts.");
      const extracted=await extractPdf(file,setProgress);
      const result=matchFederalPdf(extracted.pages,lines);
      setDraft({fileName:file.name,fileSize:file.size,fileHash:extracted.fileHash,pageCount:extracted.pageCount,textPageCount:result.textPageCount,detectedForms:result.detectedForms,eligibleLineCount:result.eligibleLineCount,candidates:result.candidates});
      if(result.textPageCount===0) setMessage("No searchable text was found. This appears to be a scanned PDF and requires OCR before amounts can be mapped safely.");
      else if(!result.candidates.length) setMessage("Searchable text was found, but no Federal line amounts met the minimum matching threshold. Review the PDF type or import a tax-software-generated copy.");
    } catch(error) { setMessage(error instanceof Error?error.message:"The PDF could not be read."); }
    finally { setProcessing(false); }
  }

  function setSelected(candidateId:string,selected:boolean) { setDraft(current=>current?{...current,candidates:current.candidates.map(candidate=>candidate.candidateId===candidateId?{...candidate,selected}:candidate)}:current); }
  function selectHighConfidence() { setDraft(current=>current?{...current,candidates:current.candidates.map(candidate=>({...candidate,selected:candidate.confidenceLabel==="High"&&currentAmounts[candidate.lineId]===null}))}:current); setAllowOverwrite(false); }
  const conflicts=draft?.candidates.filter(candidate=>currentAmounts[candidate.lineId]!==null&&Math.abs((currentAmounts[candidate.lineId]??0)-candidate.extractedValue)>=.01)??[];
  const selected=draft?.candidates.filter(candidate=>candidate.selected)??[];
  const selectedConflicts=selected.filter(candidate=>conflicts.some(conflict=>conflict.candidateId===candidate.candidateId));
  const visible=draft?.candidates.filter(candidate=>filter==="all"||filter==="selected"&&candidate.selected||filter==="conflicts"&&conflicts.some(conflict=>conflict.candidateId===candidate.candidateId)||filter==="low"&&candidate.confidenceLabel!=="High")??[];

  function applyImport() {
    if(!draft||!selected.length||selectedConflicts.length&&!allowOverwrite) return;
    const importedAt=new Date().toISOString();
    const audit:FederalPdfImportAudit={id:crypto.randomUUID(),fileName:draft.fileName,fileSize:draft.fileSize,fileHash:draft.fileHash,pageCount:draft.pageCount,textPageCount:draft.textPageCount,detectedForms:draft.detectedForms,matchedCount:draft.candidates.length,importedCount:selected.length,skippedCount:draft.candidates.length-selected.length,importedAt,mappings:selected.map(candidate=>{const previousAmount=currentAmounts[candidate.lineId]??null;return {...candidate,previousAmount,overwritten:previousAmount!==null&&Math.abs(previousAmount-candidate.extractedValue)>=.01};})};
    onApply(selected,audit); onStateChange({history:[audit,...state.history].slice(0,25)}); setDraft(null); setOpen(false); setAllowOverwrite(false);
  }

  return <>
    <section className="federal-pdf-import-card"><div className="pdf-import-icon"><FileSearch/></div><div><span className="jurisdiction">FEDERAL PDF IMPORT</span><h2>Populate CPA Amount from the filed return</h2><p>The PDF is processed on this device. Review matched Form 1120 lines before anything is written.</p>{latest&&<small>Last import: {latest.fileName} · {latest.importedCount} amounts · {new Date(latest.importedAt).toLocaleString()}</small>}</div><Button onClick={()=>setOpen(true)}><Upload/>Import Federal PDF</Button></section>
    <input hidden ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={choosePdf}/>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="federal-pdf-dialog"><DialogHeader><DialogTitle>Import Federal return PDF</DialogTitle><DialogDescription>Extract, match, review, then confirm CPA Amount entries. Existing amounts remain protected unless you explicitly allow replacement.</DialogDescription></DialogHeader>
      {!draft&&!processing&&<div className="pdf-upload-start"><FileText/><h3>Select the tax-software-generated Federal return</h3><p>Searchable PDFs provide the best results. Scanned pages are detected and held for OCR review.</p><div className="pdf-privacy"><LockKeyhole/><span><strong>Local processing</strong><small>The return PDF is not uploaded or retained. Only confirmed amounts and source references are saved in this workspace.</small></span></div><Button onClick={()=>inputRef.current?.click()}><Upload/>Choose PDF</Button>{message&&<div className="pdf-message warning"><AlertTriangle/>{message}</div>}</div>}
      {processing&&<div className="pdf-processing"><FileSearch/><h3>Reading Federal return pages…</h3><Progress value={progress}/><span>{progress}%</span></div>}
      {draft&&!processing&&<div className="pdf-review"><div className="pdf-import-metrics"><article><span>PDF pages</span><strong>{draft.pageCount}</strong><small>{draft.textPageCount} searchable</small></article><article><span>Matched lines</span><strong>{draft.candidates.length}</strong><small>of {draft.eligibleLineCount} configured amount lines</small></article><article><span>Selected</span><strong>{selected.length}</strong><small>ready to import</small></article><article className={conflicts.length?"attention":""}><span>Existing-value conflicts</span><strong>{conflicts.length}</strong><small>replacement is locked</small></article></div>
        {draft.detectedForms.length>0&&<div className="pdf-detected"><strong>Detected forms</strong><span>{draft.detectedForms.join(" · ")}</span></div>}{message&&<div className="pdf-message warning"><AlertTriangle/>{message}</div>}
        {draft.candidates.length>0&&<><div className="pdf-review-tools"><Button variant="outline" size="sm" onClick={selectHighConfidence}><Check/>Select high confidence</Button><NativeSelect value={filter} onChange={event=>setFilter(event.target.value as Filter)}><NativeSelectOption value="all">All matches</NativeSelectOption><NativeSelectOption value="selected">Selected only</NativeSelectOption><NativeSelectOption value="conflicts">Existing-value conflicts</NativeSelectOption><NativeSelectOption value="low">Needs closer review</NativeSelectOption></NativeSelect></div><div className="pdf-match-table"><table><thead><tr><th>Use</th><th>Federal form / line</th><th>PDF evidence</th><th>Extracted amount</th><th>Confidence</th><th>Current CPA amount</th></tr></thead><tbody>{visible.map(candidate=>{const current=currentAmounts[candidate.lineId]??null;const conflict=current!==null&&Math.abs(current-candidate.extractedValue)>=.01;return <tr key={candidate.candidateId} className={conflict?"conflict":""}><td><Checkbox checked={candidate.selected} onCheckedChange={checked=>setSelected(candidate.candidateId,checked===true)}/></td><td><strong>{candidate.formNumber} · Line {candidate.lineNumber}</strong><small>{candidate.sectionName}</small><span>{candidate.description}</span></td><td><strong>PDF page {candidate.pageNumber}</strong><small>{candidate.rawText}</small></td><td>{money(candidate.extractedValue)}</td><td><i className={`pdf-confidence ${candidate.confidenceLabel.toLowerCase()}`}>{candidate.confidence}% · {candidate.confidenceLabel}</i></td><td>{money(current)}{conflict&&<small className="pdf-conflict-label">Will replace if allowed</small>}</td></tr>})}</tbody></table></div></>}
        {selectedConflicts.length>0&&<label className="pdf-overwrite"><Checkbox checked={allowOverwrite} onCheckedChange={checked=>setAllowOverwrite(checked===true)}/><span><strong>Allow replacement of {selectedConflicts.length} existing CPA Amount{selectedConflicts.length===1?"":"s"}</strong><small>The previous amount will remain recorded in the PDF import audit history.</small></span></label>}
      </div>}
      <DialogFooter>{draft&&<Button variant="outline" onClick={()=>inputRef.current?.click()}>Choose another PDF</Button>}<Button disabled={!draft||!selected.length||selectedConflicts.length>0&&!allowOverwrite} onClick={applyImport}>Import {selected.length||"selected"} CPA Amount{selected.length===1?"":"s"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
