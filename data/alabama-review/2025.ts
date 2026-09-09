export type TriState = "unknown" | "yes" | "no";
export type PackagePresence = "unknown" | "present" | "absent";
export type AlabamaConclusion = "expected" | "review" | "not_expected";
export type AlabamaFormStatus = "Required" | "Conditional" | "Not Applicable" | "Missing" | "Unexpected" | "Requires Review";

export type AlabamaFacts = {
  entityType: "unknown" | "c_corporation" | "s_corporation" | "llc_c_corp" | "financial_institution" | "insurance_company" | "reit" | "business_trust" | "other";
  federalReturnType: "unknown" | "1120" | "1120_f" | "1120_reit" | "1120_l_pc" | "1120_s" | "1065" | "other";
  alabamaSales: number | null;
  everywhereSales: number | null;
  alabamaProperty: number | null;
  everywhereProperty: number | null;
  alabamaPayroll: number | null;
  everywherePayroll: number | null;
  employeesRepresentatives: TriState;
  inventory: TriState;
  officeWarehouse: TriState;
  alabamaSourceIncome: TriState;
  registeredQualified: TriState;
  pl86272: TriState;
  multistate: TriState;
  federalConsolidated: TriState;
  alabamaConsolidated: TriState;
  returnStatus: "regular" | "initial" | "final" | "amended";
  nonbusinessIncome: TriState;
  alabamaNol: TriState;
  relatedMemberExpense: TriState;
  alabamaCredits: TriState;
  compositePteCredit: TriState;
  estimatedUnderpayment: TriState;
  alternative2220Method: TriState;
  ftiAdjustmentSchedule: TriState;
  electronicFiling20C: TriState;
  electronicFilingCpt: TriState;
  financialInstitutionGroup: TriState;
  federalScheduleLRequired: TriState;
  cptCalculatedTax: number | null;
  cptPaymentMethod: "unknown" | "none" | "electronic" | "check";
};

export type AlabamaReviewState = {
  facts: AlabamaFacts;
  packagePresence: Record<string, PackagePresence>;
  crossCheckNotes: Record<string, string>;
  apportionment: {
    alabamaSalesSource: string;
    everywhereSalesSource: string;
    assignmentMethodology: string;
    exclusions: string;
    overrideTreatment: string;
  };
};

export const ALABAMA_SOURCES = {
  form20c: "https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f20c.pdf",
  instructions20c: "https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f20cinstr.pdf",
  form20cc: "https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f20cc.pdf",
  formCpt: "https://www.revenue.alabama.gov/wp-content/uploads/2025/02/25fcpt.pdf",
  bpt: "https://www.revenue.alabama.gov/individual-corporate/alabama-business-privilege-tax-and-corporate-share-tax/",
  efile: "https://www.revenue.alabama.gov/wp-content/uploads/2026/02/2025al4163_fnl.pdf",
  consolidated: "https://www.revenue.alabama.gov/individual-corporate/tips-for-successfully-filing-an-alabama-20cc-and-20c-proforma/",
} as const;

export const ALABAMA_LAST_VERIFIED = "2026-09-09";

export const createDefaultAlabamaReviewState = (): AlabamaReviewState => ({
  facts: {
    entityType: "unknown", federalReturnType: "unknown", alabamaSales: null, everywhereSales: null,
    alabamaProperty: null, everywhereProperty: null, alabamaPayroll: null, everywherePayroll: null,
    employeesRepresentatives: "unknown", inventory: "unknown", officeWarehouse: "unknown",
    alabamaSourceIncome: "unknown", registeredQualified: "unknown", pl86272: "unknown", multistate: "unknown",
    federalConsolidated: "unknown", alabamaConsolidated: "unknown", returnStatus: "regular",
    nonbusinessIncome: "unknown", alabamaNol: "unknown", relatedMemberExpense: "unknown",
    alabamaCredits: "unknown", compositePteCredit: "unknown", estimatedUnderpayment: "unknown",
    alternative2220Method: "unknown", ftiAdjustmentSchedule: "unknown", electronicFiling20C: "unknown",
    electronicFilingCpt: "unknown", financialInstitutionGroup: "unknown", federalScheduleLRequired: "unknown",
    cptCalculatedTax: null, cptPaymentMethod: "unknown",
  },
  packagePresence: {}, crossCheckNotes: {},
  apportionment: { alabamaSalesSource: "", everywhereSalesSource: "", assignmentMethodology: "", exclusions: "", overrideTreatment: "" },
});

export function normalizeAlabamaReviewState(value?: Partial<AlabamaReviewState>): AlabamaReviewState {
  const blank = createDefaultAlabamaReviewState();
  return { ...blank, ...value, facts: { ...blank.facts, ...(value?.facts ?? {}) }, packagePresence: value?.packagePresence ?? {}, crossCheckNotes: value?.crossCheckNotes ?? {}, apportionment: { ...blank.apportionment, ...(value?.apportionment ?? {}) } };
}

const cptEntity = (entity: AlabamaFacts["entityType"]) => ["c_corporation", "llc_c_corp", "financial_institution", "insurance_company", "reit", "business_trust"].includes(entity);
const incomeTaxEntity = (entity: AlabamaFacts["entityType"]) => ["c_corporation", "llc_c_corp", "reit", "business_trust"].includes(entity);
const knownNoActivity = (facts: AlabamaFacts) => facts.alabamaSales === 0 && facts.alabamaProperty === 0 && facts.alabamaPayroll === 0 && [facts.employeesRepresentatives, facts.inventory, facts.officeWarehouse, facts.alabamaSourceIncome, facts.registeredQualified].every(value => value === "no");
const hasPhysicalActivity = (facts: AlabamaFacts) => facts.alabamaProperty !== null && facts.alabamaProperty > 0 || facts.alabamaPayroll !== null && facts.alabamaPayroll > 0 || [facts.employeesRepresentatives, facts.inventory, facts.officeWarehouse].some(value => value === "yes");
const reachesQuarterFactor = (alabama:number|null,everywhere:number|null) => alabama !== null && everywhere !== null && everywhere > 0 && alabama / everywhere >= .25;
const hasThresholdActivity = (facts: AlabamaFacts) => (facts.alabamaSales ?? 0) >= 675000 || (facts.alabamaProperty ?? 0) >= 68000 || (facts.alabamaPayroll ?? 0) >= 68000 || reachesQuarterFactor(facts.alabamaSales,facts.everywhereSales) || reachesQuarterFactor(facts.alabamaProperty,facts.everywhereProperty) || reachesQuarterFactor(facts.alabamaPayroll,facts.everywherePayroll);

export function evaluate20C(facts: AlabamaFacts): { result: AlabamaConclusion; label: string; explanation: string; source: string; status: "Verified" | "Requires Confirmation" } {
  if (["s_corporation"].includes(facts.entityType) || ["1120_s", "1065"].includes(facts.federalReturnType)) return { result: "not_expected", label: "20C Not Expected", explanation: "The selected entity/federal return type is not the C-corporation return population described for Form 20C.", source: ALABAMA_SOURCES.instructions20c, status: "Verified" };
  if (facts.entityType !== "unknown" && !incomeTaxEntity(facts.entityType)) return { result: "review", label: "20C Review Required", explanation: "The selected entity type is outside the standard Form 20C population. Confirm the correct Alabama tax regime before concluding.", source: ALABAMA_SOURCES.instructions20c, status: "Requires Confirmation" };
  if (knownNoActivity(facts)) return { result: "not_expected", label: "20C Not Expected", explanation: "No Alabama activity, source income, or registration has been identified. Retain support for the no-filing conclusion.", source: ALABAMA_SOURCES.instructions20c, status: "Verified" };
  if (facts.registeredQualified === "yes" || facts.alabamaSourceIncome === "yes" || hasPhysicalActivity(facts) || hasThresholdActivity(facts)) return { result: "expected", label: "20C Expected", explanation: facts.pl86272 === "yes" ? "Alabama contacts are present. A claimed P.L. 86-272 exemption is reported through Form 20C and Alabama's Nexus Questionnaire; confirm that activities remain protected." : "The corporation has Alabama business activity, Alabama-source income, qualification, physical presence, or a TY2025 factor-presence threshold indicator.", source: ALABAMA_SOURCES.instructions20c, status: "Verified" };
  return { result: "review", label: "20C Review Required", explanation: "The questionnaire does not yet establish or eliminate Alabama corporate income tax filing nexus. Complete the unknown activity and registration facts.", source: ALABAMA_SOURCES.instructions20c, status: "Requires Confirmation" };
}

export function evaluateCpt(facts: AlabamaFacts): { result: AlabamaConclusion; label: string; explanation: string; source: string; status: "Verified" | "Requires Confirmation" } {
  if (facts.entityType !== "unknown" && !cptEntity(facts.entityType)) return { result: "not_expected", label: "CPT Not Expected", explanation: "The selected entity type is not in the Form CPT filer population; another Alabama privilege tax return may apply.", source: ALABAMA_SOURCES.efile, status: "Verified" };
  if (facts.cptCalculatedTax !== null && facts.cptCalculatedTax <= 100) return { result: "not_expected", label: "CPT Not Expected", explanation: "TY2025 calculated privilege tax is $100 or less. Alabama provides a full exemption and instructs the taxpayer not to submit the return.", source: ALABAMA_SOURCES.formCpt, status: "Verified" };
  if (facts.cptCalculatedTax !== null && facts.cptCalculatedTax > 100 && cptEntity(facts.entityType)) return { result: "expected", label: "CPT Expected", explanation: "The entity is in the CPT filer population and calculated Business Privilege Tax exceeds $100.", source: ALABAMA_SOURCES.formCpt, status: "Verified" };
  if (knownNoActivity(facts) && facts.registeredQualified === "no") return { result: "not_expected", label: "CPT Not Expected", explanation: "No Alabama factor presence, registration, or activity has been identified. Document the factor-presence and registration conclusion.", source: ALABAMA_SOURCES.instructions20c, status: "Verified" };
  return { result: "review", label: "CPT Review Required", explanation: facts.returnStatus === "initial" ? "Initial privilege tax filings use a separate initial-return framework. Confirm whether BPT-IN, rather than the annual CPT workflow, applies." : "Complete the CPT net-worth computation and $100 exemption test independently from the Form 20C conclusion.", source: facts.returnStatus === "initial" ? ALABAMA_SOURCES.bpt : ALABAMA_SOURCES.formCpt, status: "Requires Confirmation" };
}

export type AlabamaPackageRule = { id: string; system: "20C" | "CPT"; form: string; name: string; embedded?: boolean; applicability: (facts: AlabamaFacts, filing: AlabamaConclusion) => "required" | "conditional" | "not_applicable" | "review"; reason: string; source: string; ruleStatus: "Verified" | "Requires Confirmation" };

export const ALABAMA_PACKAGE_RULES: AlabamaPackageRule[] = [
  { id:"20c", system:"20C", form:"Form 20C", name:"Alabama Corporation Income Tax Return", applicability:(_,filing)=>filing === "expected" ? "required" : filing === "not_expected" ? "not_applicable" : "review", reason:"Core Alabama corporate income tax return.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"federal-1120", system:"20C", form:"Federal Form 1120 copy", name:"Complete signed federal return and supporting schedules", applicability:(_,filing)=>filing === "expected" ? "required" : filing === "not_expected" ? "not_applicable" : "review", reason:"A complete appropriate federal return is required for a complete Form 20C filing.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"schedule-a", system:"20C", form:"Schedule A", name:"Alabama reconciliation adjustments", embedded:true, applicability:(_,filing)=>filing === "expected" ? "required" : filing === "not_expected" ? "not_applicable" : "review", reason:"Embedded in Form 20C; inspect within the return rather than requiring a separate package-index item.", source:ALABAMA_SOURCES.form20c, ruleStatus:"Verified" },
  { id:"schedule-b", system:"20C", form:"Schedule B", name:"Alabama NOL", embedded:true, applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.alabamaNol === "yes" ? "required" : f.alabamaNol === "no" ? "not_applicable" : "conditional", reason:"Required to claim an Alabama NOL deduction; inspect the embedded schedule.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"schedule-c", system:"20C", form:"Schedule C", name:"Allocation of nonbusiness income", embedded:true, applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.nonbusinessIncome === "yes" ? "required" : f.nonbusinessIncome === "no" ? "not_applicable" : "conditional", reason:"Used for nonbusiness income, loss, and expense; inspect the embedded schedule.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"schedule-d1", system:"20C", form:"Schedule D-1", name:"Apportionment factor", embedded:true, applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.multistate === "yes" ? "required" : f.multistate === "no" ? "not_applicable" : "conditional", reason:"Expected for a multistate corporation using normal apportionment; special methods require separate review.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"schedule-d2", system:"20C", form:"Schedule D-2", name:"Percentage of sales method", embedded:true, applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.multistate === "yes" && (f.alabamaSales ?? Infinity) <= 100000 && !hasPhysicalActivity(f) ? "review" : "not_applicable", reason:"Available only for the limited sales-only fact pattern stated in the instructions; confirm eligibility before use.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"schedule-e", system:"20C", form:"Schedule E", name:"Federal income tax deduction", embedded:true, applicability:(_,filing)=>filing === "expected" ? "required" : filing === "not_expected" ? "not_applicable" : "review", reason:"Embedded computation supporting Form 20C Line 11a.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"schedule-f", system:"20C", form:"Schedule F", name:"Balance sheet", embedded:true, applicability:(_,filing)=>filing === "expected" ? "required" : filing === "not_expected" ? "not_applicable" : "review", reason:"Embedded balance sheet should agree with books and records.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"schedule-ab", system:"20C", form:"Schedule AB", name:"Related-member add-back", applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.relatedMemberExpense === "yes" ? "required" : f.relatedMemberExpense === "no" ? "not_applicable" : "conditional", reason:"Required when related-member interest or intangible expense is reported and the add-back/exception is evaluated.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"schedule-bc", system:"20C", form:"Schedule BC", name:"Business credits", applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.alabamaCredits === "yes" ? "required" : f.alabamaCredits === "no" ? "not_applicable" : "conditional", reason:"Supports nonrefundable and refundable Alabama credits carried to Form 20C.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"schedule-cpb", system:"20C", form:"Schedule CP-B", name:"Composite payments / Electing PTE credits", applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.compositePteCredit === "yes" ? "required" : f.compositePteCredit === "no" ? "not_applicable" : "conditional", reason:"Required when composite payments or Electing PTE credits are claimed on Line 20c.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"2220al", system:"20C", form:"Form 2220AL", name:"Estimated tax underpayment alternative computation", applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.estimatedUnderpayment === "yes" && f.alternative2220Method === "yes" ? "required" : f.estimatedUnderpayment === "no" || f.alternative2220Method === "no" ? "not_applicable" : "conditional", reason:"Evaluate when underpayment exists and an allowed annualized, seasonal, large-corporation, or PTE-income method is used.", source:ALABAMA_SOURCES.instructions20c, ruleStatus:"Verified" },
  { id:"fti-adjustments", system:"20C", form:"Schedule of Adjustments to FTI", name:"FTI adjustment attachment", applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.ftiAdjustmentSchedule === "yes" ? "required" : f.ftiAdjustmentSchedule === "no" ? "not_applicable" : "conditional", reason:"Form 20C identifies this as a conditional attachment; facts must establish whether it is populated.", source:ALABAMA_SOURCES.form20c, ruleStatus:"Requires Confirmation" },
  { id:"20cc", system:"20C", form:"Form 20C-C / proforma 20C", name:"Alabama consolidated return package", applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.alabamaConsolidated === "yes" ? "required" : f.alabamaConsolidated === "no" ? "not_applicable" : "conditional", reason:"A binding Alabama consolidated election requires Form 20C-C and separately submitted proforma Forms 20C.", source:ALABAMA_SOURCES.consolidated, ruleStatus:"Verified" },
  { id:"8453c", system:"20C", form:"AL8453-C", name:"Corporate e-file declaration", applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.electronicFiling20C === "yes" ? "required" : f.electronicFiling20C === "no" ? "not_applicable" : "conditional", reason:"Must be signed and retained by the ERO for an electronically filed corporate income tax return.", source:ALABAMA_SOURCES.efile, ruleStatus:"Verified" },
  { id:"cpt", system:"CPT", form:"Form CPT", name:"Alabama Business Privilege Tax Return", applicability:(_,filing)=>filing === "expected" ? "required" : filing === "not_expected" ? "not_applicable" : "review", reason:"Annual privilege tax workflow is independent from Form 20C and is subject to the $100 exemption test.", source:ALABAMA_SOURCES.formCpt, ruleStatus:"Verified" },
  { id:"bpt-nw", system:"CPT", form:"Worksheet BPT-NW", name:"Balance Sheet — Net Worth Computation", embedded:true, applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.federalScheduleLRequired === "no" ? "required" : f.federalScheduleLRequired === "yes" ? "not_applicable" : "conditional", reason:"Required to substantiate net worth when the entity is not required to complete the applicable federal Schedule L.", source:ALABAMA_SOURCES.formCpt, ruleStatus:"Verified" },
  { id:"schedule-g", system:"CPT", form:"Schedule G", name:"Financial Institution Group schedule", applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.financialInstitutionGroup === "yes" ? "required" : f.financialInstitutionGroup === "no" ? "not_applicable" : "conditional", reason:"Expected only for a Financial Institution Group member/group filing fact pattern.", source:ALABAMA_SOURCES.formCpt, ruleStatus:"Verified" },
  { id:"8453b", system:"CPT", form:"AL8453-B", name:"Business privilege tax e-file declaration", applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.electronicFilingCpt === "yes" ? "required" : f.electronicFilingCpt === "no" ? "not_applicable" : "conditional", reason:"Must be signed and retained by the ERO for an electronically filed privilege tax return.", source:ALABAMA_SOURCES.efile, ruleStatus:"Verified" },
  { id:"bpt-v", system:"CPT", form:"BPT-V", name:"Business Privilege Tax Payment Voucher", applicability:(f,filing)=>filing === "not_expected" ? "not_applicable" : f.cptPaymentMethod === "check" ? "required" : ["none","electronic"].includes(f.cptPaymentMethod) ? "not_applicable" : "conditional", reason:"Required with a non-electronic/check payment; do not mail when payment is electronic.", source:ALABAMA_SOURCES.efile, ruleStatus:"Verified" },
];

export function packageStatus(rule: AlabamaPackageRule, facts: AlabamaFacts, filing: AlabamaConclusion, presence: PackagePresence): AlabamaFormStatus {
  const applicability = rule.applicability(facts, filing);
  if (rule.id === "cpt" && facts.cptCalculatedTax !== null && facts.cptCalculatedTax <= 100 && presence === "present") return "Requires Review";
  if (applicability === "required") return presence === "absent" ? "Missing" : presence === "unknown" ? "Requires Review" : "Required";
  if (applicability === "not_applicable") return presence === "present" ? "Unexpected" : "Not Applicable";
  if (applicability === "review") return "Requires Review";
  if (presence === "present") return "Requires Review";
  return "Conditional";
}

export type AlabamaCrossCheck = { id:string; label:string; source:string; expected:(amount:(id:string)=>number|null)=>number|null; reportedId:string };
const add = (amount:(id:string)=>number|null, ids:string[]) => { const values=ids.map(amount); return values.some(v=>v===null) ? null : (values as number[]).reduce((sum,v)=>sum+v,0); };
export const ALABAMA_CROSS_CHECKS: AlabamaCrossCheck[] = [
  { id:"fed-to-20c-1", label:"Federal Form 1120 taxable income → Form 20C Line 1", source:"Federal Form 1120 Line 30", expected:a=>a("FED-1120-2025-P1-L30"), reportedId:"AL-20C-2025-P1-L1" },
  { id:"a26-to-20c-3", label:"Schedule A Line 26 → Form 20C Line 3", source:"Form 20C Schedule A Line 26", expected:a=>a("AL-20C-2025-SA-L26"), reportedId:"AL-20C-2025-P1-L3" },
  { id:"c2e-to-20c-5", label:"Schedule C Everywhere total → Form 20C Line 5", source:"Form 20C Schedule C Line 2 Column E", expected:a=>a("AL-20C-2025-SC-L2E"), reportedId:"AL-20C-2025-P1-L5" },
  { id:"c2f-to-20c-9", label:"Schedule C Alabama total → Form 20C Line 9", source:"Form 20C Schedule C Line 2 Column F", expected:a=>a("AL-20C-2025-SC-L2F"), reportedId:"AL-20C-2025-P1-L9" },
  { id:"d1-to-20c-7", label:"Schedule D-1 Line 9 → Form 20C Line 7", source:"Form 20C Schedule D-1 Line 9", expected:a=>a("AL-20C-2025-SD1-L9"), reportedId:"AL-20C-2025-P1-L7" },
  { id:"20c-6x7-8", label:"Form 20C Line 6 × Line 7 → Line 8", source:"Form 20C Lines 6 and 7", expected:a=>{const x=a("AL-20C-2025-P1-L6"),y=a("AL-20C-2025-P1-L7");return x===null||y===null?null:x*y;}, reportedId:"AL-20C-2025-P1-L8" },
  { id:"20c-8p9-10", label:"Form 20C Line 8 + Line 9 → Line 10", source:"Form 20C Lines 8 and 9", expected:a=>add(a,["AL-20C-2025-P1-L8","AL-20C-2025-P1-L9"]), reportedId:"AL-20C-2025-P1-L10" },
  { id:"e12-to-20c-11a", label:"Schedule E Line 12 → Form 20C Line 11a", source:"Form 20C Schedule E Line 12", expected:a=>a("AL-20C-2025-SE-L12"), reportedId:"AL-20C-2025-P1-L11A" },
  { id:"nol-to-20c-13", label:"Alabama NOL deduction → Form 20C Line 13", source:"Alabama NOL Schedule B support", expected:a=>a("AL-20C-2025-SB-DEDUCTION"), reportedId:"AL-20C-2025-P1-L13" },
  { id:"20c-12m13-14", label:"Form 20C Line 12 − Line 13 → Line 14", source:"Form 20C Lines 12 and 13", expected:a=>{const x=a("AL-20C-2025-P1-L12"),y=a("AL-20C-2025-P1-L13");return x===null||y===null?null:x-y;}, reportedId:"AL-20C-2025-P1-L14" },
  { id:"20c-14-rate-15", label:"Form 20C Line 14 × 6.5% → Line 15", source:"Form 20C Line 14 and statutory rate", expected:a=>{const x=a("AL-20C-2025-P1-L14");return x===null?null:Math.max(0,x*.065);}, reportedId:"AL-20C-2025-P1-L15" },
  { id:"bc-to-20c", label:"Schedule BC credits → Form 20C credit/payment lines", source:"Schedule BC Sections E and F", expected:a=>add(a,["AL-20C-2025-BC-E3","AL-20C-2025-BC-F5"]), reportedId:"AL-20C-2025-BC-CARRY-TOTAL" },
  { id:"cpb-to-20c-20c", label:"Schedule CP-B → Form 20C Line 20c", source:"Schedule CP-B Line 3", expected:a=>a("AL-20C-2025-CPB-L3"), reportedId:"AL-20C-2025-P1-L20C" },
];

export function getAlabamaLineGuidance(line:{ formNumber:string; sectionId:string; description:string }) {
  const text=`${line.formNumber} ${line.sectionId} ${line.description}`.toLowerCase();
  if (text.includes("cpt") || text.includes("bpt")) return { sources:["Trial Balance / balance sheet", "Federal Schedule L", "Prior-year Alabama CPT", "CPT workpaper and payment history"], federal:"Federal Schedule L and federal taxable income", adjustment:"CPT net-worth additions, exclusions, deductions and Alabama apportionment", chain:"Book balance sheet → Federal Schedule L / taxable income → CPT net-worth adjustments → Form CPT line" };
  if (text.includes("d-1") || text.includes("sd1") || text.includes("sales")) return { sources:["Customer sales-by-state report", "AR/customer master", "Federal Form 1120", "Sourcing workpaper"], federal:"Federal gross receipts and supporting schedules", adjustment:"Alabama customer/state assignment, exclusions and special sourcing", chain:"Sales ledger / customer master → Federal gross receipts → Alabama sourcing adjustments → Schedule D-1" };
  if (text.includes("schedule f") || text.includes("sf-")) return { sources:["Trial Balance", "Federal Schedule L", "Fixed asset register", "Inventory-by-location report"], federal:"Federal Form 1120 Schedule L", adjustment:"Explain differences between books, federal Schedule L and Alabama amounts", chain:"Book balance sheet → Federal Schedule L → Alabama balance-sheet adjustment → Schedule F" };
  if (text.includes("nol") || text.includes("schedule b")) return { sources:["Prior-year Alabama returns", "Alabama NOL schedule", "Federal workpapers", "Acquisition limitation support"], federal:"Federal NOL workpapers are reference only", adjustment:"Alabama-specific carryforward, utilization and acquired-loss limitations", chain:"Prior Alabama return → Alabama NOL rollforward → current-year limitation → Form 20C Line 13" };
  if (text.includes("schedule a") || text.includes("sa-")) return { sources:["Trial Balance", "Federal Form 1120", "Federal workpapers", "Book-to-tax reconciliation"], federal:"Federal taxable income and Schedule M-1/M-3 support", adjustment:"Alabama additions and subtractions", chain:"Book / source document → Federal tax return → Alabama adjustment → Schedule A / Form 20C" };
  return { sources:["Trial Balance", "Federal Form 1120", "Federal workpapers", "Book-to-tax reconciliation", "Tax payment history"], federal:"Applicable federal return line or supporting workpaper", adjustment:"Alabama statutory modification, allocation, apportionment, NOL, credit or payment", chain:"Book / source document → Federal tax return → Alabama adjustment → Alabama return line" };
}
