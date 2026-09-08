"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ExternalLink, FileQuestion, FileText, Link2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  CROSS_CHECK_RULES_2025, FACT_CHECKLIST_2025, FEDERAL_FORM_RULES_2025, INFORMATION_CHECK_RULES_2025,
  evaluateExpectedForm, type CompletenessReviewStatus, type FederalCompletenessState, type FederalFacts,
  type FederalFormRule, type TriState
} from "@/data/federal-completeness/2025";

type AmountRecord = { cpaAmount: number | null; internalAmount: number | null };
type Props = {
  taxYear: number;
  company: string;
  state: FederalCompletenessState;
  records: Record<string, AmountRecord>;
  onChange: (state: FederalCompletenessState) => void;
  onOpenLine: (lineId: string) => void;
  onAddQuestion: (rule: FederalFormRule, issue: string, question: string, priority: "low" | "medium" | "high") => void;
};

const reviewLabels: Record<CompletenessReviewStatus, string> = {
  not_reviewed:"Not Reviewed", reviewed_no_issue:"Reviewed – No Issue", reviewed_explained:"Reviewed – Difference Explained",
  question_tax_firm:"Question for Tax Firm", potential_error:"Potential Error", not_applicable:"N/A"
};
const riskRank = { high:3, medium:2, low:1 } as const;
const money = (value: number | null) => value === null ? "—" : new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(value);
const parseAmount = (value: string) => value.trim() === "" ? null : Number(value.replace(/,/g, ""));
const sumAmounts = (records: Record<string, AmountRecord>, ids: string[], side: "cpaAmount" | "internalAmount" = "cpaAmount") => {
  const values = ids.map(id => records[id]?.[side] ?? null);
  return !values.length || values.every(value => value === null) ? null : values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
};
const ruleByForm = (formNumber: string) => FEDERAL_FORM_RULES_2025.find(rule => rule.formNumber === formNumber);

export function federalCompletenessMetrics(state: FederalCompletenessState, records: Record<string, AmountRecord>) {
  const rows = FEDERAL_FORM_RULES_2025.map(rule => ({ rule, expected:evaluateExpectedForm(rule, state.facts), received:Boolean(state.receivedForms[rule.id]) }));
  const checks = CROSS_CHECK_RULES_2025.map(rule => {
    const source = sumAmounts(records, rule.sourceLineIds); const target = sumAmounts(records, rule.targetLineIds);
    const reconciling = state.crossCheckReviews[rule.id]?.reconcilingAmount ?? 0;
    const difference = source === null || target === null ? null : source - reconciling - target;
    return { rule, source, target, difference };
  });
  const infoDifferences = INFORMATION_CHECK_RULES_2025.filter(rule => {
    const item = state.informationReviews[rule.id]; const reported = item?.returnAmountOverride ?? sumAmounts(records, rule.targetLineIds);
    return item?.bookAmount !== null && item?.bookAmount !== undefined && reported !== null && Math.abs(item.bookAmount - reported) >= 1;
  }).length;
  const missing = rows.filter(row => row.expected.result === "expected" && !row.received);
  const unexpected = rows.filter(row => row.expected.result === "not_expected" && row.received);
  const crossDifferences = checks.filter(check => check.difference !== null && Math.abs(check.difference) >= 1);
  const openReviewItems = missing.length + unexpected.length + crossDifferences.length + infoDifferences;
  return { expected:rows.filter(row => row.expected.result === "expected").length, potential:rows.filter(row => row.expected.result === "potential").length, received:rows.filter(row => row.received).length, missing:missing.length, unexpected:unexpected.length, crossDifferences:crossDifferences.length, infoDifferences, openReviewItems, highRisk:missing.filter(row => row.rule.risk === "high").length + crossDifferences.filter(row => row.rule.risk === "high").length };
}

export function FederalCompleteness({ taxYear, company, state, records, onChange, onOpenLine, onAddQuestion }: Props) {
  const [view, setView] = useState<"completeness" | "package" | "crosscheck" | "issues">("completeness");
  const [showAdditional, setShowAdditional] = useState(false);
  const metrics = useMemo(() => federalCompletenessMetrics(state, records), [state, records]);
  const formRows = FEDERAL_FORM_RULES_2025.map(rule => ({ rule, expected:evaluateExpectedForm(rule, state.facts), received:Boolean(state.receivedForms[rule.id]) }));
  const visibleForms = showAdditional ? formRows : formRows.filter(row => row.rule.category === "core");
  const packageRows = formRows.filter(row => row.expected.result !== "not_expected").sort((a,b) => riskRank[b.rule.risk] - riskRank[a.rule.risk] || a.rule.formNumber.localeCompare(b.rule.formNumber));
  const configuredRuleIds = new Set(["1120","scheduleC","scheduleJ","scheduleK","scheduleL","scheduleM1","scheduleM2","scheduleB","scheduleG","1125A","1125E","4562","5472","8879CORP","8990","8993","scheduleM3"]);
  const packageGroup = (rule: FederalFormRule) => rule.packageGroup ?? (rule.id === "1120" ? "Core return" : ["5471","5472","8858","8865","8992","8993","1118"].includes(rule.id) ? "International" : ["3800","6765"].includes(rule.id) ? "Tax & credits" : ["scheduleD","8949","8283"].includes(rule.id) ? "Income & deductions" : "Core return");
  const packageGroups = ["Core return","Income & deductions","Tax & credits","Ownership & transactions","International","Procedure & separate filings"] as const;
  const crossRows = CROSS_CHECK_RULES_2025.map(rule => {
    const source = sumAmounts(records, rule.sourceLineIds); const target = sumAmounts(records, rule.targetLineIds);
    const review = state.crossCheckReviews[rule.id] ?? { status:"not_reviewed" as const, reconcilingAmount:null, notes:"" };
    const difference = source === null || target === null ? null : source - (review.reconcilingAmount ?? 0) - target;
    const autoStatus = difference === null ? "Not Reviewed" : Math.abs(difference) < 1 ? "Matched" : "Difference";
    return { rule, source, target, review, difference, autoStatus };
  });
  const infoRows = INFORMATION_CHECK_RULES_2025.map(rule => {
    const review = state.informationReviews[rule.id] ?? { bookAmount:null, returnAmountOverride:null, status:"not_reviewed" as const, notes:"" };
    const derived = sumAmounts(records, rule.targetLineIds); const reported = review.returnAmountOverride ?? derived;
    const difference = review.bookAmount === null || reported === null ? null : review.bookAmount - reported;
    return { rule, review, derived, reported, difference };
  });
  const updateFacts = (patch: Partial<FederalFacts>) => onChange({ ...state, facts:{...state.facts,...patch} });
  const updateFormReview = (id: string, patch: Record<string, unknown>) => onChange({ ...state, formReviews:{...state.formReviews,[id]:{...(state.formReviews[id] ?? {status:"not_reviewed",notes:""}),...patch}} });
  const updateCrossReview = (id: string, patch: Record<string, unknown>) => onChange({ ...state, crossCheckReviews:{...state.crossCheckReviews,[id]:{...(state.crossCheckReviews[id] ?? {status:"not_reviewed",reconcilingAmount:null,notes:""}),...patch}} });
  const updateInfoReview = (id: string, patch: Record<string, unknown>) => onChange({ ...state, informationReviews:{...state.informationReviews,[id]:{...(state.informationReviews[id] ?? {bookAmount:null,returnAmountOverride:null,status:"not_reviewed",notes:""}),...patch}} });
  const completenessStatus = (row: typeof formRows[number]) => row.expected.result === "expected" && !row.received ? "Potential Missing Form" : row.expected.result === "not_expected" && row.received ? "Review Required" : row.expected.result === "potential" ? "Potentially Required – Review Needed" : row.received ? "Present" : "Not Expected";
  const questionForForm = (row: typeof formRows[number]) => row.expected.result === "expected" && !row.received
    ? `Please confirm why ${row.rule.formNumber} was not included despite the identified triggering facts: ${row.expected.reason}`
    : `Please confirm the applicability and calculation of ${row.rule.formNumber}. The form is included, but the current completeness checklist has not identified a clear triggering condition.`;
  const issues = [
    ...formRows.filter(row => (row.expected.result === "expected" && !row.received) || (row.expected.result === "not_expected" && row.received)).map(row => ({ id:`form-${row.rule.id}`, form:row.rule.formNumber, issue:completenessStatus(row), detail:row.expected.reason, risk:row.rule.risk, rule:row.rule, question:questionForForm(row) })),
    ...crossRows.filter(row => row.difference !== null && Math.abs(row.difference) >= 1).map(row => ({ id:`cross-${row.rule.id}`, form:row.rule.formNumber, issue:`Cross-check difference ${money(row.difference)}`, detail:`${row.rule.supportingLabel} does not reconcile to ${row.rule.targetLabel}.`, risk:row.rule.risk, rule:ruleByForm(row.rule.formNumber)!, question:`Please explain the reconciliation between ${row.rule.supportingLabel} and ${row.rule.targetLabel}. The current difference is ${money(row.difference)}.` })),
    ...infoRows.filter(row => row.difference !== null && Math.abs(row.difference) >= 1).map(row => ({ id:`info-${row.rule.id}`, form:"Form 5472", issue:`Information return difference ${money(row.difference)}`, detail:`${row.rule.label} does not agree with ${row.rule.targetLabel}.`, risk:row.rule.risk, rule:FEDERAL_FORM_RULES_2025.find(item => item.id === "5472")!, question:`Please explain why ${row.rule.label} per the books does not agree with ${row.rule.targetLabel}. The current difference is ${money(row.difference)}.` }))
  ].sort((a,b) => riskRank[b.risk] - riskRank[a.risk]);

  if (taxYear !== 2025) return <main className="page federal-completeness-page"><div className="state-caution"><AlertTriangle /><span><strong>No federal completeness rule set is approved for tax year {taxYear}.</strong><br />Copying 2025 thresholds or line mappings into another year is intentionally blocked. Add and verify a separate rule database for that year.</span></div></main>;

  return <main className="page federal-completeness-page">
    <div className="page-heading"><div><p className="eyebrow">FEDERAL FORM COMPLETENESS & CROSS-CHECK · {taxYear}</p><h1>联邦申报表完整性及勾稽检查</h1><p>{company} · Determine expected forms independently, compare the tax firm package, and reconcile supporting forms.</p></div></div>
    <div className="federal-warning"><ShieldCheck /><div><strong>申报表完整性应根据企业实际情况独立判断，而不能仅以事务所已提供的申报表为依据。</strong><span>Return completeness should be determined from company facts, not solely from forms included in the tax firm’s return package.</span></div></div>
    <nav className="federal-tabs" aria-label="Federal return review views">
      <button onClick={() => onOpenLine("FED-1120-2025-P1-L1A")}><FileText />Form 1120</button>
      <button onClick={() => onOpenLine("FED-1125A-2025-L1")}><FileText />Supporting Forms</button>
      <button className={view === "completeness" ? "active" : ""} onClick={() => setView("completeness")}><ShieldCheck />Completeness Check</button>
      <button className={view === "package" ? "active" : ""} onClick={() => setView("package")}><FileText />Generated Filing Package</button>
      <button className={view === "crosscheck" ? "active" : ""} onClick={() => setView("crosscheck")}><Link2 />Cross-check</button>
      <button className={view === "issues" ? "active" : ""} onClick={() => setView("issues")}><AlertTriangle />Review Issues {issues.length ? <b>{issues.length}</b> : null}</button>
    </nav>
    <section className="completeness-metrics">
      {[ ["Expected Forms",metrics.expected,`${metrics.potential} potentially required`],["Forms Received",metrics.received,"Marked from actual package"],["Potential Missing",metrics.missing,`${metrics.highRisk} high risk`],["Unexpected Forms",metrics.unexpected,"Applicability review"],["Cross-check Differences",metrics.crossDifferences,`${metrics.infoDifferences} information differences`],["Open Review Issues",metrics.openReviewItems,"Completeness + reconciliation"] ].map(([label,value,note]) => <article key={String(label)} className={Number(value) > 0 && ["Potential Missing","Unexpected Forms","Cross-check Differences","Open Review Issues"].includes(String(label)) ? "attention" : ""}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
    </section>

    {view === "completeness" && <>
      <section className="completeness-section"><div className="panel-head"><div><span className="jurisdiction">EXPECTED FORMS DETERMINATION</span><h2>Company facts / 企业事实</h2><p>Unknown answers produce “Potentially Required – Review Needed,” never an automatic N/A conclusion.</p></div></div>
        {["Core business facts","Ownership & international","Tax, credits & transactions","Procedure & other filings"].map(group => <div className="fact-group" key={group}><h3>{group}</h3><div className="fact-grid">{FACT_CHECKLIST_2025.filter(prompt => prompt.group === group).map(prompt => <label className="fact-card" key={prompt.key}><span><strong>{prompt.label}</strong><small>{prompt.question}</small></span>{prompt.input === "tri" ? <NativeSelect value={String(state.facts[prompt.key])} onChange={event => updateFacts({[prompt.key]:event.target.value as TriState})}><NativeSelectOption value="unknown">Unknown / Review</NativeSelectOption><NativeSelectOption value="yes">Yes</NativeSelectOption><NativeSelectOption value="no">No</NativeSelectOption></NativeSelect> : <Input value={(state.facts[prompt.key] as number | null) ?? ""} onChange={event => updateFacts({[prompt.key]:parseAmount(event.target.value)})} inputMode="decimal" placeholder="$0" />}</label>)}</div></div>)}
      </section>
      <section className="completeness-section"><div className="panel-head"><div><span className="jurisdiction">EXPECTED VS ACTUAL RETURN PACKAGE</span><h2>Form completeness comparison</h2><p>Received status must be based on the tax firm’s actual return package; absence never means not applicable.</p></div><Button variant="outline" onClick={() => setShowAdditional(value => !value)}>{showAdditional ? "Hide additional forms" : "Show additional forms"}</Button></div>
        <div className="table-wrap completeness-table"><table><thead><tr><th>Form</th><th>Trigger / result</th><th>Expected</th><th>Received</th><th>Cross-check</th><th>Risk</th><th>Status / notes</th></tr></thead><tbody>{visibleForms.map(row => { const status = completenessStatus(row); const linked = crossRows.find(check => check.rule.formNumber === row.rule.formNumber); const review = state.formReviews[row.rule.id] ?? {status:"not_reviewed",notes:""}; return <tr key={row.rule.id} className={status === "Potential Missing Form" ? "missing-row" : status === "Review Required" ? "review-row" : ""}><td><strong>{row.rule.formNumber}</strong><small>{row.rule.formName}</small><a href={row.rule.sourceUrl} target="_blank" rel="noreferrer">{row.rule.source} <ExternalLink /></a><em>Tax year 2025 · verified {row.rule.lastVerified}</em></td><td><strong>{row.rule.trigger}</strong><small>{row.expected.reason}</small></td><td><i className={`expected-${row.expected.result}`}>{row.expected.result === "expected" ? "Yes" : row.expected.result === "potential" ? "Potential" : "No"}</i></td><td><label className="received-check"><Checkbox checked={row.received} onCheckedChange={checked => onChange({...state,receivedForms:{...state.receivedForms,[row.rule.id]:checked === true}})} />{row.received ? "Received" : "Not received"}</label></td><td>{linked ? linked.autoStatus : row.rule.tieType}</td><td><i className={`risk-${row.rule.risk}`}>{row.rule.risk}</i></td><td><NativeSelect value={review.status} onChange={event => updateFormReview(row.rule.id,{status:event.target.value as CompletenessReviewStatus})}>{Object.entries(reviewLabels).map(([value,label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect><strong className={`completeness-status ${status.includes("Missing") ? "bad" : status.includes("Review") || status.includes("Potentially") ? "warn" : "good"}`}>{status}</strong><Textarea value={review.notes} onChange={event => updateFormReview(row.rule.id,{notes:event.target.value})} placeholder="Reviewer note" />{(status.includes("Missing") || status === "Review Required") && <Button size="xs" variant="outline" onClick={() => onAddQuestion(row.rule,status,questionForForm(row),row.rule.risk)}><FileQuestion />Add question</Button>}</td></tr>})}</tbody></table></div>
      </section>
    </>}

    {view === "package" && <>
      <section className="generated-package-summary"><div><span>2025 DYNAMIC FEDERAL PACKAGE</span><strong>{metrics.expected} required · {metrics.potential} potential</strong><small>Generated from the company facts above; updates immediately when an answer changes.</small></div><div><span>PACKAGE COMPARISON</span><strong>{metrics.missing} missing · {metrics.received} received</strong><small>“Potential” remains open until the triggering fact is resolved.</small></div></section>
      <div className="state-caution"><AlertTriangle /><span><strong>Scope:</strong> principal Form 1120 schedules, attachments, authorizations, and closely related separate federal filings. Payroll, excise, customs, sales tax, FBAR, and entity-specific elections outside this scope still require a separate compliance calendar.</span></div>
      {packageGroups.map(group => { const rows = packageRows.filter(row => packageGroup(row.rule) === group); if (!rows.length) return null; return <section className="completeness-section package-section" key={group}><div className="panel-head"><div><span className="jurisdiction">{group.toUpperCase()}</span><h2>{group}</h2><p>{rows.filter(row => row.expected.result === "expected").length} required · {rows.filter(row => row.expected.result === "potential").length} awaiting facts</p></div></div><div className="generated-package-list">{rows.map(row => { const status = completenessStatus(row); const configured = configuredRuleIds.has(row.rule.id); return <article key={row.rule.id} className={row.expected.result === "expected" && !row.received ? "package-missing" : row.expected.result === "potential" ? "package-potential" : ""}><div className="package-status"><i className={`expected-${row.expected.result}`}>{row.expected.result === "expected" ? "Required" : "Potential"}</i><i className={`risk-${row.rule.risk}`}>{row.rule.risk}</i></div><div className="package-copy"><strong>{row.rule.formNumber} · {row.rule.formName}</strong><p>{row.expected.reason}</p><small>{row.rule.filingMethod ?? "Attached to Form 1120"} · {row.rule.source}</small></div><label className="received-check"><Checkbox checked={row.received} onCheckedChange={checked => onChange({...state,receivedForms:{...state.receivedForms,[row.rule.id]:checked === true}})} />{row.received ? "Received" : "Not received"}</label><div className="package-actions">{configured ? <Button size="xs" onClick={() => onOpenLine(row.rule.representativeLineId)}>Open fillable form</Button> : <Button size="xs" variant="outline" asChild><a href={row.rule.sourceUrl} target="_blank" rel="noreferrer">Official form <ExternalLink /></a></Button>}{row.expected.result === "expected" && !row.received && <Button size="xs" variant="outline" onClick={() => onAddQuestion(row.rule,status,questionForForm(row),row.rule.risk)}><FileQuestion />Ask tax firm</Button>}</div></article>})}</div></section> })}
    </>}

    {view === "crosscheck" && <>
      <section className="completeness-section"><div className="panel-head"><div><span className="jurisdiction">SUPPORTING FORM → FORM 1120</span><h2>Cross-form reconciliation</h2><p>Amounts below use the CPA return column from each configured form. Indirect ties allow a documented reconciling amount.</p></div></div><div className="table-wrap crosscheck-table"><table><thead><tr><th>Relationship</th><th>Supporting form</th><th>Reconciling amount</th><th>Form 1120</th><th>Difference</th><th>Result</th><th>Review</th></tr></thead><tbody>{crossRows.map(row => <tr key={row.rule.id} className={row.autoStatus === "Difference" ? "missing-row" : ""}><td><strong>{row.rule.formNumber} · {row.rule.label}</strong><small>{row.rule.tieType}</small><a href={row.rule.sourceUrl} target="_blank" rel="noreferrer">Rule source <ExternalLink /></a><em>Tax year 2025 · verified {row.rule.lastVerified}</em></td><td><span>{row.rule.supportingLabel}</span><strong>{money(row.source)}</strong><Button size="xs" variant="ghost" onClick={() => onOpenLine(row.rule.sourceLineIds[0])}>Open line</Button></td><td>{row.rule.allowsReconcilingAmount ? <Input value={row.review.reconcilingAmount ?? ""} onChange={event => updateCrossReview(row.rule.id,{reconcilingAmount:parseAmount(event.target.value)})} placeholder="Claimed elsewhere" /> : "—"}</td><td><span>{row.rule.targetLabel}</span><strong>{money(row.target)}</strong><Button size="xs" variant="ghost" onClick={() => onOpenLine(row.rule.targetLineIds[0])}>Open line</Button></td><td className={row.autoStatus === "Difference" ? "material" : ""}><strong>{money(row.difference)}</strong></td><td><i className={row.autoStatus === "Matched" ? "status-green" : row.autoStatus === "Difference" ? "status-orange" : "status-neutral"}>{row.autoStatus}</i></td><td><NativeSelect value={row.review.status} onChange={event => updateCrossReview(row.rule.id,{status:event.target.value as CompletenessReviewStatus})}>{Object.entries(reviewLabels).map(([value,label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect><Textarea value={row.review.notes} onChange={event => updateCrossReview(row.rule.id,{notes:event.target.value})} placeholder="Explanation / reviewer note" />{row.autoStatus === "Difference" && <Button size="xs" variant="outline" onClick={() => onAddQuestion(ruleByForm(row.rule.formNumber)!,"Cross-check difference",`Please explain the reconciliation between ${row.rule.supportingLabel} and ${row.rule.targetLabel}. The current difference is ${money(row.difference)}.`,row.rule.risk)}><FileQuestion />Add question</Button>}</td></tr>)}</tbody></table></div></section>
      <section className="completeness-section"><div className="panel-head"><div><span className="jurisdiction">INFORMATION RETURN CROSS-CHECK</span><h2>Form 5472 financial-data review</h2><p>A correct Form 1120 taxable income does not resolve a missing or inaccurate Form 5472 disclosure.</p></div></div><div className="table-wrap information-table"><table><thead><tr><th>Related-party category</th><th>Book / TB amount</th><th>Tax return amount</th><th>Difference</th><th>Status</th><th>Notes</th></tr></thead><tbody>{infoRows.map(row => <tr key={row.rule.id} className={row.difference !== null && Math.abs(row.difference) >= 1 ? "missing-row" : ""}><td><strong>{row.rule.label}</strong><small>{row.rule.targetLabel}</small><i className={`risk-${row.rule.risk}`}>{row.rule.risk}</i></td><td><Input value={row.review.bookAmount ?? ""} onChange={event => updateInfoReview(row.rule.id,{bookAmount:parseAmount(event.target.value)})} inputMode="decimal" placeholder="Book / TB" /></td><td><Input value={row.review.returnAmountOverride ?? row.derived ?? ""} onChange={event => updateInfoReview(row.rule.id,{returnAmountOverride:parseAmount(event.target.value)})} inputMode="decimal" placeholder="Form 5472" /><small>{row.derived !== null ? `Linked form amount: ${money(row.derived)}` : "Enter disclosed amount or review attached statement"}</small></td><td className={row.difference !== null && Math.abs(row.difference) >= 1 ? "material" : ""}>{money(row.difference)}</td><td><NativeSelect value={row.review.status} onChange={event => updateInfoReview(row.rule.id,{status:event.target.value as CompletenessReviewStatus})}>{Object.entries(reviewLabels).map(([value,label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect></td><td><Textarea value={row.review.notes} onChange={event => updateInfoReview(row.rule.id,{notes:event.target.value})} placeholder="Source, scope, explanation" />{row.difference !== null && Math.abs(row.difference) >= 1 && <Button size="xs" variant="outline" onClick={() => onAddQuestion(FEDERAL_FORM_RULES_2025.find(item => item.id === "5472")!,"Information return difference",`Please explain why ${row.rule.label} per the books does not agree with ${row.rule.targetLabel}. The current difference is ${money(row.difference)}.`,row.rule.risk)}><FileQuestion />Add question</Button>}</td></tr>)}</tbody></table></div></section>
    </>}

    {view === "issues" && <section className="completeness-section"><div className="panel-head"><div><span className="jurisdiction">FEDERAL REVIEW ISSUES</span><h2>Completeness and reconciliation issues</h2><p>These issues remain independent from Form 1120 taxable-income accuracy.</p></div></div>{issues.length ? <div className="federal-issue-list">{issues.map(issue => <article key={issue.id}><span className={`risk-${issue.risk}`}>{issue.risk} risk</span><div><strong>{issue.form} · {issue.issue}</strong><p>{issue.detail}</p></div><Button variant="outline" onClick={() => onAddQuestion(issue.rule,issue.issue,issue.question,issue.risk)}><FileQuestion />Question for Tax Firm</Button></article>)}</div> : <div className="federal-empty"><Check /><strong>No completeness or reconciliation differences identified</strong><p>Complete all unknown facts and review statuses before concluding the federal package is complete.</p></div>}</section>}
  </main>;
}
