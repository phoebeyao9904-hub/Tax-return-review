import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root=fileURLToPath(new URL("..",import.meta.url));
const vite=await createServer({appType:"custom",configFile:false,root,resolve:{alias:{"@":root}},server:{middlewareMode:true,hmr:false}});
after(async()=>vite.close());
const parser=await vite.ssrLoadModule("/data/federal-pdf-import.ts");

test("PDF amount parsing preserves negatives, decimals, and percentages",()=>{
  assert.equal(parser.parsePdfAmount("(1,234,567)"),-1234567);
  assert.equal(parser.parsePdfAmount("$42,100.25"),42100.25);
  assert.equal(parser.parsePdfAmount("21%"),.21);
  assert.equal(parser.parsePdfAmount("Line 1a"),null);
});

test("Federal PDF matcher links page evidence to a configured CPA amount line",()=>{
  const line={lineId:"FED-1120-2025-P1-L1A",formNumber:"1120",sectionName:"U.S. Corporation Income Tax Return",lineNumber:"1a",description:"Gross receipts or sales",inputType:"currency"};
  const row={rowId:"1:4",text:"1a Gross receipts or sales 2,500,000",y:620,pageWidth:612,items:[{text:"1a",x:35},{text:"Gross receipts or sales",x:70},{text:"2,500,000",x:515}]};
  const result=parser.matchFederalPdf([{pageNumber:1,text:"Form 1120 U.S. Corporation Income Tax Return\n"+row.text,rows:[row]}],[line]);
  assert.equal(result.candidates.length,1);
  assert.equal(result.candidates[0].lineId,line.lineId);
  assert.equal(result.candidates[0].extractedValue,2500000);
  assert.equal(result.candidates[0].confidenceLabel,"High");
  assert.deepEqual(result.detectedForms,["1120"]);
});

test("matcher rejects a same-number row when the description has no overlap",()=>{
  const line={lineId:"FED-1120-2025-P1-L5",formNumber:"1120",sectionName:"U.S. Corporation Income Tax Return",lineNumber:"5",description:"Interest",inputType:"currency"};
  const unrelated={rowId:"1:8",text:"5 Compensation of officers 900,000",y:500,pageWidth:612,items:[{text:"5",x:35},{text:"Compensation of officers",x:70},{text:"900,000",x:515}]};
  const result=parser.matchFederalPdf([{pageNumber:1,text:"Form 1120\n"+unrelated.text,rows:[unrelated]}],[line]);
  assert.equal(result.candidates.length,0);
});
