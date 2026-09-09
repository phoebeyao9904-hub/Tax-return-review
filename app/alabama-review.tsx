"use client";

import { useState } from "react";
import { AlertTriangle, Check, ExternalLink, FileQuestion, Landmark, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  ALABAMA_CROSS_CHECKS, ALABAMA_LAST_VERIFIED, ALABAMA_PACKAGE_RULES, ALABAMA_SOURCES,
  evaluate20C, evaluateCpt, normalizeAlabamaReviewState, packageStatus,
  type AlabamaFacts, type AlabamaReviewState, type PackagePresence, type TriState,
} from "@/data/alabama-review/2025";

type RecordLike = { cpaAmount?: number | null; internalAmount?: number | null };
type AssessmentLike = { stateSales:number|null; totalSales:number|null; stateProperty:number|null; totalProperty:number|null; statePayroll:number|null; totalPayroll:number|null };
type QuestionPayload = { lineId:string; topic:string; question:string; background:string; priority:"low"|"medium"|"high" };

const triOptions = <><NativeSelectOption value="unknown">Unknown / not reviewed</NativeSelectOption><NativeSelectOption value="yes">Yes</NativeSelectOption><NativeSelectOption value="no">No</NativeSelectOption></>;
const num = (value:string) => value.trim() === "" ? null : Number(value.replace(/,/g,""));
const money = (value:number|null) => value === null ? "—" : new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
const pct = (value:number|null) => value === null ? "—" : `${(value*100).toFixed(4)}%`;

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="al-field"><span>{label}</span>{children}</label>; }
function TriField({label,value,onChange}:{label:string;value:TriState;onChange:(value:TriState)=>void}) { return <Field label={label}><NativeSelect value={value} onChange={event=>onChange(event.target.value as TriState)}>{triOptions}</NativeSelect></Field>; }

export function AlabamaReview({taxYear,company,state,records,assessment,onChange,onAssessmentChange,onOpenForm,onOpenLine,onAddQuestion}:{
  taxYear:number; company:string; state:AlabamaReviewState; records:Record<string,RecordLike>; assessment:AssessmentLike;
  onChange:(state:AlabamaReviewState)=>void; onAssessmentChange:(patch:Partial<AssessmentLike>)=>void;
  onOpenForm:(form:"20C"|"CPT")=>void; onOpenLine:(lineId:string)=>void; onAddQuestion:(payload:QuestionPayload)=>void;
}) {
  const normalized=normalizeAlabamaReviewState(state);
  const [view,setView]=useState<"requirements"|"completeness"|"crosschecks"|"sources">("requirements");
  const facts=normalized.facts;
  const result20C=evaluate20C(facts);
  const resultCpt=evaluateCpt(facts);
  const updateFacts=(patch:Partial<AlabamaFacts>)=>onChange({...normalized,facts:{...facts,...patch}});
  const updatePresence=(id:string,presence:PackagePresence)=>onChange({...normalized,packagePresence:{...normalized.packagePresence,[id]:presence}});
  const rules=ALABAMA_PACKAGE_RULES.map(rule=>{const filing=rule.system === "20C" ? result20C.result : resultCpt.result;const presence=normalized.packagePresence[rule.id]??"unknown";return {...rule,presence,status:packageStatus(rule,facts,filing,presence)};});
  const metrics={missing:rules.filter(r=>r.status==="Missing").length,review:rules.filter(r=>r.status==="Requires Review"||r.status==="Conditional").length,required:rules.filter(r=>r.status==="Required").length};
  const amount=(id:string)=>records[id]?.cpaAmount ?? records[id]?.internalAmount ?? null;
  const checks=ALABAMA_CROSS_CHECKS.map(rule=>{const expected=rule.expected(amount);const reported=amount(rule.reportedId);const difference=expected===null||reported===null?null:expected-reported;const status=difference===null?"Warning":Math.abs(difference)<1?"Pass":"Fail";return {...rule,expected,reported,difference,status,note:normalized.crossCheckNotes[rule.id]??""};});
  const alSales=assessment.stateSales ?? facts.alabamaSales;
  const everywhereSales=assessment.totalSales ?? facts.everywhereSales;
  const underlyingFactor=alSales===null||everywhereSales===null||everywhereSales===0?null:alSales/everywhereSales;
  const d1Al=amount("AL-20C-2025-SD1-L8A");
  const d1Everywhere=amount("AL-20C-2025-SD1-L8B");
  const d1Factor=amount("AL-20C-2025-SD1-L9");
  const cptNetWorth=amount("AL-CPT-2025-P2A-L5");
  const cptAdjusted=amount("AL-CPT-2025-P2B-L8");
  const cptAlabama=amount("AL-CPT-2025-P2B-L10");
  const cptTax=amount("AL-CPT-2025-P2B-L20") ?? facts.cptCalculatedTax;
  const suggestedQuestions:{lineId:string;topic:string;question:string;reason:string}[]=[];
  if(!normalized.apportionment.alabamaSalesSource.trim()) suggestedQuestions.push({lineId:"AL-20C-2025-SD1-L8A",topic:"Alabama Schedule D-1 source",question:"Please confirm the source used to determine Alabama sales reported on Schedule D-1.",reason:"Alabama sales source has not been documented."});
  if(!normalized.apportionment.assignmentMethodology.trim()) suggestedQuestions.push({lineId:"AL-20C-2025-SD1-L8A",topic:"Alabama sales sourcing",question:"Please provide the Alabama sales sourcing methodology.",reason:"Customer/state assignment methodology is not documented."});
  if(facts.cptCalculatedTax!==null&&facts.cptCalculatedTax<=100&&normalized.packagePresence.cpt==="present") suggestedQuestions.push({lineId:"AL-CPT-2025-P2B-L20",topic:"CPT $100 exemption",question:"Please explain why Form CPT was filed where calculated Business Privilege Tax appears to be $100 or less.",reason:"TY2025 Form CPT instructs taxpayers at $100 or less not to submit the return."});
  if(facts.alabamaNol==="yes"&&normalized.packagePresence["schedule-b"]!=="present") suggestedQuestions.push({lineId:"AL-20C-2025-P1-L13",topic:"Alabama NOL support",question:"Please provide support for the Alabama NOL utilized.",reason:"An Alabama NOL is indicated but the embedded Schedule B has not been confirmed as inspected."});
  if(facts.relatedMemberExpense==="yes"&&normalized.packagePresence["schedule-ab"]!=="present") suggestedQuestions.push({lineId:"AL-20C-2025-SA-L6",topic:"Schedule AB adjustment",question:"Please explain the related-member adjustment reported on Schedule AB.",reason:"Related-member expense is indicated without confirmed Schedule AB support."});

  return <section className="al-engine">
    <div className="al-engine-head"><div><span className="jurisdiction">ALABAMA · TY{taxYear} DYNAMIC REVIEW</span><h2>Filing requirements, forms and cross-checks</h2><p>{company||"Entity not set"} · Corporate Income Tax and Business Privilege Tax are assessed independently using Alabama Department of Revenue sources.</p></div><div className="al-head-actions"><Button variant="outline" onClick={()=>onOpenForm("20C")}><Scale/>Open Form 20C</Button><Button variant="outline" onClick={()=>onOpenForm("CPT")}><Landmark/>Open Form CPT</Button></div></div>
    <div className="al-tabs" role="tablist">{[["requirements","Filing requirements"],["completeness",`Form completeness · ${metrics.missing} missing`],["crosschecks",`Cross-checks · ${checks.filter(c=>c.status==="Fail").length} fail`],["sources","Guidance & sources"]].map(([key,label])=><button key={key} className={view===key?"active":""} onClick={()=>setView(key as typeof view)}>{label}</button>)}</div>

    {view==="requirements"&&<>
      <div className="al-conclusions"><ConclusionCard title="Corporate Income Tax · Form 20C" result={result20C}/><ConclusionCard title="Business Privilege Tax · Form CPT" result={resultCpt}/></div>
      <div className="al-questionnaire">
        <section><h3>Entity and filing profile</h3><div className="al-form-grid">
          <Field label="Entity type"><NativeSelect value={facts.entityType} onChange={e=>updateFacts({entityType:e.target.value as AlabamaFacts["entityType"]})}><NativeSelectOption value="unknown">Select entity type</NativeSelectOption><NativeSelectOption value="c_corporation">C corporation</NativeSelectOption><NativeSelectOption value="llc_c_corp">LLE taxed as C corporation</NativeSelectOption><NativeSelectOption value="s_corporation">S corporation</NativeSelectOption><NativeSelectOption value="financial_institution">Financial institution</NativeSelectOption><NativeSelectOption value="insurance_company">Insurance company</NativeSelectOption><NativeSelectOption value="reit">REIT</NativeSelectOption><NativeSelectOption value="business_trust">Business trust</NativeSelectOption><NativeSelectOption value="other">Other / uncertain</NativeSelectOption></NativeSelect></Field>
          <Field label="Federal return type"><NativeSelect value={facts.federalReturnType} onChange={e=>updateFacts({federalReturnType:e.target.value as AlabamaFacts["federalReturnType"]})}><NativeSelectOption value="unknown">Select federal return</NativeSelectOption>{["1120","1120_f","1120_reit","1120_l_pc","1120_s","1065","other"].map(v=><NativeSelectOption key={v} value={v}>{v.replaceAll("_","-").toUpperCase()}</NativeSelectOption>)}</NativeSelect></Field>
          <Field label="Return status"><NativeSelect value={facts.returnStatus} onChange={e=>updateFacts({returnStatus:e.target.value as AlabamaFacts["returnStatus"]})}>{["regular","initial","final","amended"].map(v=><NativeSelectOption key={v} value={v}>{v[0].toUpperCase()+v.slice(1)} return</NativeSelectOption>)}</NativeSelect></Field>
          <TriField label="Alabama registration / qualified to do business" value={facts.registeredQualified} onChange={v=>updateFacts({registeredQualified:v})}/>
          <TriField label="Federal consolidated filing" value={facts.federalConsolidated} onChange={v=>updateFacts({federalConsolidated:v})}/>
          <TriField label="Alabama consolidated filing" value={facts.alabamaConsolidated} onChange={v=>updateFacts({alabamaConsolidated:v})}/>
          <TriField label="Multistate operations" value={facts.multistate} onChange={v=>updateFacts({multistate:v})}/>
          <TriField label="P.L. 86-272 claimed / applicable" value={facts.pl86272} onChange={v=>updateFacts({pl86272:v})}/>
        </div></section>
        <section><h3>Alabama activity and factor presence</h3><div className="al-form-grid">
          <Field label="Alabama sales"><Input value={facts.alabamaSales??""} inputMode="decimal" onChange={e=>{const value=num(e.target.value);updateFacts({alabamaSales:value});onAssessmentChange({stateSales:value});}}/></Field>
          <Field label="Everywhere sales"><Input value={facts.everywhereSales??""} inputMode="decimal" onChange={e=>{const value=num(e.target.value);updateFacts({everywhereSales:value});onAssessmentChange({totalSales:value});}}/></Field>
          <Field label="Alabama property"><Input value={facts.alabamaProperty??""} inputMode="decimal" onChange={e=>{const value=num(e.target.value);updateFacts({alabamaProperty:value});onAssessmentChange({stateProperty:value});}}/></Field>
          <Field label="Everywhere property"><Input value={facts.everywhereProperty??""} inputMode="decimal" onChange={e=>{const value=num(e.target.value);updateFacts({everywhereProperty:value});onAssessmentChange({totalProperty:value});}}/></Field>
          <Field label="Alabama payroll"><Input value={facts.alabamaPayroll??""} inputMode="decimal" onChange={e=>{const value=num(e.target.value);updateFacts({alabamaPayroll:value});onAssessmentChange({statePayroll:value});}}/></Field>
          <Field label="Everywhere payroll"><Input value={facts.everywherePayroll??""} inputMode="decimal" onChange={e=>{const value=num(e.target.value);updateFacts({everywherePayroll:value});onAssessmentChange({totalPayroll:value});}}/></Field>
          <TriField label="Alabama employees / representatives" value={facts.employeesRepresentatives} onChange={v=>updateFacts({employeesRepresentatives:v})}/>
          <TriField label="Alabama inventory" value={facts.inventory} onChange={v=>updateFacts({inventory:v})}/>
          <TriField label="Alabama office / warehouse" value={facts.officeWarehouse} onChange={v=>updateFacts({officeWarehouse:v})}/>
          <TriField label="Alabama-source income" value={facts.alabamaSourceIncome} onChange={v=>updateFacts({alabamaSourceIncome:v})}/>
        </div><p className="al-rule-note">TY2025 factor-presence reference: $675,000 sales, $68,000 property, $68,000 payroll, or 25% of the applicable total factor. The engine does not infer the 25% test unless everywhere totals are available.</p></section>
        <section><h3>Schedule and e-file triggers</h3><div className="al-form-grid">
          <TriField label="Nonbusiness income / loss exists" value={facts.nonbusinessIncome} onChange={v=>updateFacts({nonbusinessIncome:v})}/><TriField label="Alabama NOL carryforward / use" value={facts.alabamaNol} onChange={v=>updateFacts({alabamaNol:v})}/>
          <TriField label="Related-member interest / intangible expense" value={facts.relatedMemberExpense} onChange={v=>updateFacts({relatedMemberExpense:v})}/><TriField label="Alabama tax credit claimed" value={facts.alabamaCredits} onChange={v=>updateFacts({alabamaCredits:v})}/>
          <TriField label="Composite payment / Electing PTE credit" value={facts.compositePteCredit} onChange={v=>updateFacts({compositePteCredit:v})}/><TriField label="Estimated tax underpayment" value={facts.estimatedUnderpayment} onChange={v=>updateFacts({estimatedUnderpayment:v})}/>
          <TriField label="Allowed alternative Form 2220AL method used" value={facts.alternative2220Method} onChange={v=>updateFacts({alternative2220Method:v})}/><TriField label="Schedule of Adjustments to FTI indicated" value={facts.ftiAdjustmentSchedule} onChange={v=>updateFacts({ftiAdjustmentSchedule:v})}/>
          <TriField label="Form 20C electronic filing" value={facts.electronicFiling20C} onChange={v=>updateFacts({electronicFiling20C:v})}/><TriField label="Form CPT electronic filing" value={facts.electronicFilingCpt} onChange={v=>updateFacts({electronicFilingCpt:v})}/>
          <TriField label="Financial Institution Group" value={facts.financialInstitutionGroup} onChange={v=>updateFacts({financialInstitutionGroup:v})}/><TriField label="Federal Schedule L required" value={facts.federalScheduleLRequired} onChange={v=>updateFacts({federalScheduleLRequired:v})}/>
          <Field label="Calculated CPT privilege tax"><Input value={facts.cptCalculatedTax??""} inputMode="decimal" onChange={e=>updateFacts({cptCalculatedTax:num(e.target.value)})}/></Field>
          <Field label="CPT payment method"><NativeSelect value={facts.cptPaymentMethod} onChange={e=>updateFacts({cptPaymentMethod:e.target.value as AlabamaFacts["cptPaymentMethod"]})}><NativeSelectOption value="unknown">Unknown</NativeSelectOption><NativeSelectOption value="none">No payment</NativeSelectOption><NativeSelectOption value="electronic">Electronic</NativeSelectOption><NativeSelectOption value="check">Check / non-electronic</NativeSelectOption></NativeSelect></Field>
        </div></section>
      </div>
    </>}

    {view==="completeness"&&<div className="al-table-wrap"><table><thead><tr><th>System</th><th>Form / schedule</th><th>Package evidence</th><th>Dynamic status</th><th>Rule and source</th></tr></thead><tbody>{rules.map(rule=><tr key={rule.id}><td><strong>{rule.system}</strong></td><td><strong>{rule.form}</strong><small>{rule.name}{rule.embedded?" · embedded schedule":""}</small></td><td><NativeSelect value={rule.presence} onChange={e=>updatePresence(rule.id,e.target.value as PackagePresence)}><NativeSelectOption value="unknown">Not checked</NativeSelectOption><NativeSelectOption value="present">Present / embedded inspected</NativeSelectOption><NativeSelectOption value="absent">Absent after review</NativeSelectOption></NativeSelect></td><td><i className={rule.status==="Missing"?"status-red":rule.status==="Required"?"status-green":rule.status==="Not Applicable"?"status-neutral":"status-orange"}>{rule.status}</i></td><td><span>{rule.reason}</span><small>TY2025 · Alabama Department of Revenue · {rule.ruleStatus} · verified {ALABAMA_LAST_VERIFIED} · <a href={rule.source} target="_blank" rel="noreferrer">official source</a></small></td></tr>)}</tbody></table></div>}

    {view==="crosschecks"&&<>
      <section className="al-panel"><div className="al-section-title"><div><span className="jurisdiction">FORM 20C</span><h3>Line-level cross-check engine</h3></div><small>Expected uses the linked filed-return amount where available; blank evidence is a Warning, not a fabricated zero.</small></div><div className="al-table-wrap"><table><thead><tr><th>Check</th><th>Expected</th><th>Reported</th><th>Difference</th><th>Result</th><th>Source / reviewer note</th></tr></thead><tbody>{checks.map(check=><tr key={check.id}><td><button className="al-line-link" onClick={()=>onOpenLine(check.reportedId)}>{check.label}</button></td><td>{money(check.expected)}</td><td>{money(check.reported)}</td><td>{money(check.difference)}</td><td><i className={check.status==="Pass"?"status-green":check.status==="Fail"?"status-red":"status-orange"}>{check.status}</i></td><td><small>{check.source}</small><Textarea value={check.note} onChange={e=>onChange({...normalized,crossCheckNotes:{...normalized.crossCheckNotes,[check.id]:e.target.value}})} placeholder="Reviewer note"/></td></tr>)}</tbody></table></div></section>
      <section className="al-panel"><div className="al-section-title"><div><span className="jurisdiction">ALABAMA APPORTIONMENT</span><h3>Schedule D-1 vs sales-by-state support</h3></div></div><div className="al-compare-grid"><article><span>Underlying Alabama sales</span><strong>{money(alSales)}</strong><small>{normalized.apportionment.alabamaSalesSource||"Source not documented"}</small></article><article><span>Underlying everywhere sales</span><strong>{money(everywhereSales)}</strong><small>{normalized.apportionment.everywhereSalesSource||"Source not documented"}</small></article><article><span>Underlying factor</span><strong>{pct(underlyingFactor)}</strong><small>Alabama ÷ everywhere</small></article><article><span>Schedule D-1 factor</span><strong>{pct(d1Factor)}</strong><small>{underlyingFactor===null||d1Factor===null?"Waiting for amounts":Math.abs(underlyingFactor-d1Factor)<.000001?"Matched":"Difference requires review"}</small></article></div><div className="al-form-grid"><Field label="Alabama sales source"><Input value={normalized.apportionment.alabamaSalesSource} onChange={e=>onChange({...normalized,apportionment:{...normalized.apportionment,alabamaSalesSource:e.target.value}})} placeholder="Customer sales-by-state report"/></Field><Field label="Everywhere sales source"><Input value={normalized.apportionment.everywhereSalesSource} onChange={e=>onChange({...normalized,apportionment:{...normalized.apportionment,everywhereSalesSource:e.target.value}})} placeholder="Sales ledger / Form 1120 support"/></Field><Field label="Customer/state assignment methodology"><Textarea value={normalized.apportionment.assignmentMethodology} onChange={e=>onChange({...normalized,apportionment:{...normalized.apportionment,assignmentMethodology:e.target.value}})} placeholder="Destination, ship-to, billing, market sourcing…"/></Field><Field label="Exclusions"><Textarea value={normalized.apportionment.exclusions} onChange={e=>onChange({...normalized,apportionment:{...normalized.apportionment,exclusions:e.target.value}})} placeholder="Distortion exclusions and reconciliation"/></Field><Field label="Override / special sourcing treatment"><Textarea value={normalized.apportionment.overrideTreatment} onChange={e=>onChange({...normalized,apportionment:{...normalized.apportionment,overrideTreatment:e.target.value}})} placeholder="Alternative apportionment or special rule support"/></Field></div><div className="al-three-checks"><span>D-1 Alabama sales <strong>{money(d1Al)}</strong></span><span>D-1 everywhere sales <strong>{money(d1Everywhere)}</strong></span><span>Sales support difference <strong>{money(alSales===null||d1Al===null?null:alSales-d1Al)}</strong></span></div></section>
      <section className="al-panel"><div className="al-section-title"><div><span className="jurisdiction">BUSINESS PRIVILEGE TAX</span><h3>Independent CPT calculation path</h3></div></div><div className="al-flow"><span>Balance Sheet</span><span>Net Worth<strong>{money(cptNetWorth)}</strong></span><span>Adjustments / exclusions<strong>{money(cptAdjusted)}</strong></span><span>Alabama taxable net worth<strong>{money(cptAlabama)}</strong></span><span>Privilege tax<strong>{money(cptTax)}</strong></span><span className={cptTax!==null&&cptTax<=100?"attention":""}>$100 exemption test<strong>{cptTax===null?"Pending":cptTax<=100?"Potential full exemption":"CPT filing expected"}</strong></span></div></section>
    </>}

    {view==="sources"&&<>
      <section className="al-panel"><div className="al-section-title"><div><span className="jurisdiction">QUESTIONS FOR TAX FIRM</span><h3>Evidence-driven follow-up</h3></div><small>Only generated where questionnaire or package evidence is insufficient.</small></div>{suggestedQuestions.length?<div className="al-question-list">{suggestedQuestions.map(row=><article key={row.topic}><div><strong>{row.question}</strong><small>{row.reason}</small></div><Button size="sm" onClick={()=>onAddQuestion({lineId:row.lineId,topic:row.topic,question:row.question,background:`Alabama TY2025 dynamic review. ${row.reason}\nSource agency: Alabama Department of Revenue\nLast verified: ${ALABAMA_LAST_VERIFIED}`,priority:"high"})}><FileQuestion/>Add question</Button></article>)}</div>:<div className="al-empty"><Check/>No evidence-driven questions are currently suggested.</div>}</section>
      <section className="al-panel"><div className="al-section-title"><div><span className="jurisdiction">DATA SOURCE GUIDANCE</span><h3>Evidence map for Alabama review</h3></div></div><div className="al-source-grid">{["Trial Balance","Federal Form 1120","Federal workpapers","Book-to-tax reconciliation","Customer sales-by-state report","Fixed asset register","Payroll-by-state report","Inventory-by-location report","AR / customer master","Tax payment history","Prior-year Alabama return","Alabama NOL schedule","State registration information"].map(source=><span key={source}>{source}</span>)}</div><div className="al-lineage"><strong>Book / source document</strong><span>→</span><strong>Federal tax return</strong><span>→</span><strong>Alabama adjustment</strong><span>→</span><strong>Alabama return line</strong></div><p className="al-rule-note">Every configured Alabama line also displays context-specific source guidance inside the existing line review panel.</p></section>
      <section className="al-panel"><div className="al-section-title"><div><span className="jurisdiction">OFFICIAL SOURCE / VERSION CONTROL</span><h3>Alabama TY2025 rule register</h3></div></div><div className="al-source-register">{Object.entries(ALABAMA_SOURCES).map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer"><span>{name.replace(/([A-Z])/g," $1")}</span><small>Alabama Department of Revenue · TY2025 · verified {ALABAMA_LAST_VERIFIED}</small><ExternalLink/></a>)}</div></section>
    </>}
    <div className="al-disclaimer"><AlertTriangle/>Rules marked Requires Confirmation are intentionally not converted into filing conclusions without sufficient official guidance or taxpayer evidence.</div>
  </section>;
}

function ConclusionCard({title,result}:{title:string;result:ReturnType<typeof evaluate20C>}) { return <article className={`al-conclusion ${result.result}`}><span>{title}</span><strong>{result.label}</strong><p>{result.explanation}</p><footer><i>{result.status}</i><a href={result.source} target="_blank" rel="noreferrer">ADOR source <ExternalLink/></a></footer></article>; }
