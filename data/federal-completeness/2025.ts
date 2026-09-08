export type TriState = "unknown" | "yes" | "no";
export type ExpectedResult = "expected" | "not_expected" | "potential";
export type CompletenessReviewStatus = "not_reviewed" | "reviewed_no_issue" | "reviewed_explained" | "question_tax_firm" | "potential_error" | "not_applicable";
export type TieType = "Direct Numerical Tie" | "Indirect Numerical Tie" | "Disclosure / Information Tie" | "Procedural Only";

export type FederalFacts = {
  inventoryOrCogs: TriState;
  depreciationOrAmortization: TriState;
  businessInterestExpense: TriState;
  avgGrossReceipts3Yr: number | null;
  taxShelter: TriState;
  partnershipExcessBusinessInterest: TriState;
  exceptedTradeOnly: TriState;
  foreignOwnership25: TriState;
  relatedPartyTransactions: TriState;
  officerCompensation: TriState;
  totalReceipts: number | null;
  section250Items: TriState;
  scheduleGOwnership: TriState;
  totalAssets: number | null;
  voluntaryM3: TriState;
  electronicFiling: TriState;
  capitalAssetTransactions: TriState;
  foreignCorporationOwnership: TriState;
  foreignDisregardedEntity: TriState;
  foreignPartnershipInterest: TriState;
  giltiItems: TriState;
  foreignTaxCredit: TriState;
  generalBusinessCredit: TriState;
  researchCredit: TriState;
  noncashContribution: TriState;
  reportableTransaction: TriState;
  foreignOperations: TriState;
  controlledGroup: TriState;
  uncertainTaxPosition: TriState;
  personalHoldingCompany: TriState;
  personalServiceCorporation: TriState;
  estimatedTaxUnderpayment: TriState;
  fuelCredit: TriState;
  creditRecapture: TriState;
  corporateAmt: TriState;
  businessPropertyDisposition: TriState;
  installmentSale: TriState;
  extensionFiled: TriState;
  consolidatedReturn: TriState;
  consolidatedSubsidiary: TriState;
  businessAcquisition: TriState;
  pficOwnership: TriState;
  priorMinimumTaxCredit: TriState;
  specifiedForeignFinancialAssets: TriState;
  partnershipAdjustment: TriState;
  baseErosionTax: TriState;
  qualifiedOpportunityFund: TriState;
  foreignPropertyTransfer: TriState;
  foreignPayeeWithholding: TriState;
};

export type FederalFormRule = {
  id: string;
  formNumber: string;
  formName: string;
  trigger: string;
  factKey?: keyof FederalFacts;
  logic: "always" | "yes" | "form8990" | "form5472" | "form1125e" | "scheduleM3" | "scheduleB" | "scheduleLM" | "scheduleM1";
  risk: "high" | "medium" | "low";
  tieType: TieType;
  source: string;
  sourceUrl: string;
  lastVerified: string;
  representativeLineId: string;
  category: "core" | "additional";
  packageGroup?: "Core return" | "Income & deductions" | "Tax & credits" | "Ownership & transactions" | "International" | "Procedure & separate filings";
  filingMethod?: "Attached to Form 1120" | "Part of Form 1120" | "Separate or preparer authorization";
};

export type CrossCheckRule = {
  id: string;
  formNumber: string;
  label: string;
  supportingLabel: string;
  targetLabel: string;
  sourceLineIds: string[];
  targetLineIds: string[];
  tieType: TieType;
  risk: "high" | "medium" | "low";
  allowsReconcilingAmount: boolean;
  source: string;
  sourceUrl: string;
  lastVerified: string;
};

export type InformationCheckRule = {
  id: string;
  label: string;
  targetLabel: string;
  targetLineIds: string[];
  risk: "high" | "medium" | "low";
};

export type FactPrompt = { key: keyof FederalFacts; label: string; question: string; input: "tri" | "amount"; group: "Core business facts" | "Ownership & international" | "Tax, credits & transactions" | "Procedure & other filings" };

export type CompletenessItemReview = { status: CompletenessReviewStatus; notes: string };
export type CrossCheckReview = { status: CompletenessReviewStatus; reconcilingAmount: number | null; notes: string };
export type InformationReview = { bookAmount: number | null; returnAmountOverride: number | null; status: CompletenessReviewStatus; notes: string };

export type FederalCompletenessState = {
  facts: FederalFacts;
  receivedForms: Record<string, boolean>;
  formReviews: Record<string, CompletenessItemReview>;
  crossCheckReviews: Record<string, CrossCheckReview>;
  informationReviews: Record<string, InformationReview>;
};

export const FEDERAL_FORM_RULES_2025: FederalFormRule[] = [
  { id:"1120", formNumber:"Form 1120", formName:"U.S. Corporation Income Tax Return", trigger:"Domestic C corporation return", logic:"always", risk:"high", tieType:"Direct Numerical Tie", source:"2025 Instructions for Form 1120", sourceUrl:"https://www.irs.gov/pub/irs-prior/i1120--2025.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120-2025-P1-L1A", category:"core" },
  { id:"scheduleC", formNumber:"Schedule C (Form 1120)", formName:"Dividends, Inclusions, and Special Deductions", trigger:"Built-in Form 1120 schedule; complete applicable dividend, inclusion, and special-deduction lines", logic:"always", risk:"medium", tieType:"Direct Numerical Tie", source:"2025 Form 1120", sourceUrl:"https://www.irs.gov/pub/irs-pdf/f1120.pdf", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SC-L1", category:"core", packageGroup:"Core return", filingMethod:"Part of Form 1120" },
  { id:"scheduleJ", formNumber:"Schedule J (Form 1120)", formName:"Tax Computation and Payment", trigger:"Built-in Form 1120 tax and payment computation", logic:"always", risk:"high", tieType:"Direct Numerical Tie", source:"2025 Form 1120", sourceUrl:"https://www.irs.gov/pub/irs-pdf/f1120.pdf", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SJ-L1A", category:"core", packageGroup:"Core return", filingMethod:"Part of Form 1120" },
  { id:"scheduleK", formNumber:"Schedule K (Form 1120)", formName:"Other Information", trigger:"Built-in Form 1120 information questions", logic:"always", risk:"high", tieType:"Disclosure / Information Tie", source:"2025 Form 1120", sourceUrl:"https://www.irs.gov/pub/irs-pdf/f1120.pdf", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L1", category:"core", packageGroup:"Core return", filingMethod:"Part of Form 1120" },
  { id:"scheduleL", formNumber:"Schedule L (Form 1120)", formName:"Balance Sheets per Books", trigger:"Required unless both total receipts and year-end total assets are below $250,000 and Schedule K question 13 is answered Yes", logic:"scheduleLM", risk:"high", tieType:"Direct Numerical Tie", source:"2025 Instructions for Form 1120, Schedule K question 13", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i1120.pdf", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SL-L1", category:"core", packageGroup:"Core return", filingMethod:"Part of Form 1120" },
  { id:"scheduleM1", formNumber:"Schedule M-1 (Form 1120)", formName:"Reconciliation of Income per Books With Income per Return", trigger:"Required unless the small-corporation Schedule K question 13 exception applies or Schedule M-3 replaces Schedule M-1", logic:"scheduleM1", risk:"high", tieType:"Indirect Numerical Tie", source:"2025 Instructions for Form 1120", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i1120.pdf", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-M1-L1", category:"core", packageGroup:"Core return", filingMethod:"Part of Form 1120" },
  { id:"scheduleM2", formNumber:"Schedule M-2 (Form 1120)", formName:"Analysis of Unappropriated Retained Earnings per Books", trigger:"Required unless both total receipts and year-end total assets are below $250,000 and Schedule K question 13 is answered Yes", logic:"scheduleLM", risk:"medium", tieType:"Indirect Numerical Tie", source:"2025 Instructions for Form 1120, Schedule K question 13", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i1120.pdf", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-M2-L1", category:"core", packageGroup:"Core return", filingMethod:"Part of Form 1120" },
  { id:"1125A", formNumber:"Form 1125-A", formName:"Cost of Goods Sold", trigger:"Inventory or a cost-of-goods-sold deduction", factKey:"inventoryOrCogs", logic:"yes", risk:"high", tieType:"Direct Numerical Tie", source:"IRS About Form 1125-A", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-1125-a", lastVerified:"2026-09-07", representativeLineId:"FED-1125A-2025-L8", category:"core" },
  { id:"4562", formNumber:"Form 4562", formName:"Depreciation and Amortization", trigger:"Corporate tax depreciation, amortization, section 179, bonus depreciation, or listed property", factKey:"depreciationOrAmortization", logic:"yes", risk:"medium", tieType:"Indirect Numerical Tie", source:"2025 Instructions for Form 4562", sourceUrl:"https://www.irs.gov/instructions/i4562", lastVerified:"2026-09-07", representativeLineId:"FED-4562-2025-L22", category:"core" },
  { id:"8990", formNumber:"Form 8990", formName:"Limitation on Business Interest Expense Under Section 163(j)", trigger:"Business interest expense, carryforward, or excess business interest, subject to filing exclusions", logic:"form8990", risk:"high", tieType:"Direct Numerical Tie", source:"2025 Instructions for Form 8990", sourceUrl:"https://www.irs.gov/instructions/i8990", lastVerified:"2026-09-07", representativeLineId:"FED-8990-2025-L30", category:"core" },
  { id:"5472", formNumber:"Form 5472", formName:"25% Foreign-Owned U.S. Corporation Information Return", trigger:"At least 25% foreign ownership plus reportable transactions with a foreign or domestic related party", logic:"form5472", risk:"high", tieType:"Disclosure / Information Tie", source:"2025 Instructions for Form 1120 and Instructions for Form 5472", sourceUrl:"https://www.irs.gov/instructions/i5472", lastVerified:"2026-09-07", representativeLineId:"FED-5472-2025-P1", category:"core" },
  { id:"1125E", formNumber:"Form 1125-E", formName:"Compensation of Officers", trigger:"Officer compensation deduction and total receipts of $500,000 or more", logic:"form1125e", risk:"medium", tieType:"Direct Numerical Tie", source:"2025 Instructions for Form 1120", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i1120.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1125E-2025-L4", category:"core" },
  { id:"8993", formNumber:"Form 8993", formName:"Section 250 Deduction", trigger:"Section 250 deduction or applicable 2025 FDII/GILTI items", factKey:"section250Items", logic:"yes", risk:"high", tieType:"Direct Numerical Tie", source:"2025 Form 1120 and Instructions for Form 8993", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i8993.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-8993-2025-L24", category:"core" },
  { id:"scheduleG", formNumber:"Schedule G", formName:"Certain Persons Owning the Corporation's Voting Stock", trigger:"Entity or person meets the 20% direct or 50% direct/indirect voting-stock disclosure thresholds", factKey:"scheduleGOwnership", logic:"yes", risk:"medium", tieType:"Disclosure / Information Tie", source:"2025 Form 1120, Schedule K, questions 4a and 4b", sourceUrl:"https://www.irs.gov/pub/irs-pdf/f1120.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120SG-2025-P1-OWNER", category:"core" },
  { id:"scheduleM3", formNumber:"Schedule M-3", formName:"Net Income (Loss) Reconciliation", trigger:"Schedule L total assets of $10 million or more, or voluntary filing", logic:"scheduleM3", risk:"high", tieType:"Indirect Numerical Tie", source:"2025 Instructions for Schedule M-3 (Form 1120)", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i1120sm3.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120M3-2025-P1-L11", category:"core" },
  { id:"scheduleB", formNumber:"Schedule B", formName:"Additional Information for Schedule M-3 Filers", trigger:"Generally required for required Schedule M-3 filers with total assets of $50 million or more; exceptions require review", logic:"scheduleB", risk:"medium", tieType:"Disclosure / Information Tie", source:"2025 Instructions for Schedule M-3 (Form 1120)", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i1120sm3.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120SB-2025-L1", category:"core" },
  { id:"8879CORP", formNumber:"Form 8879-CORP", formName:"E-file Authorization for Corporations", trigger:"Electronic filing authorization used by the return preparer", factKey:"electronicFiling", logic:"yes", risk:"low", tieType:"Procedural Only", source:"IRS About Form 8879-CORP", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-8879-corp", lastVerified:"2026-09-07", representativeLineId:"FED-8879CORP-2025-RTN", category:"core" },
  { id:"scheduleD", formNumber:"Schedule D", formName:"Capital Gains and Losses", trigger:"Capital asset sales, exchanges, or carryovers", factKey:"capitalAssetTransactions", logic:"yes", risk:"medium", tieType:"Indirect Numerical Tie", source:"2025 Form 1120 supporting schedules", sourceUrl:"https://www.irs.gov/forms-pubs/about-schedule-d-form-1120", lastVerified:"2026-09-07", representativeLineId:"FED-1120-2025-P1-L8", category:"additional" },
  { id:"8949", formNumber:"Form 8949", formName:"Sales and Other Dispositions of Capital Assets", trigger:"Transactions requiring detailed capital-asset reporting", factKey:"capitalAssetTransactions", logic:"yes", risk:"medium", tieType:"Indirect Numerical Tie", source:"2025 Instructions for Form 8949", sourceUrl:"https://www.irs.gov/instructions/i8949", lastVerified:"2026-09-07", representativeLineId:"FED-1120-2025-P1-L8", category:"additional" },
  { id:"5471", formNumber:"Form 5471", formName:"Information Return of U.S. Persons With Respect to Certain Foreign Corporations", trigger:"Ownership, control, acquisition, disposition, or other filing category involving a foreign corporation", factKey:"foreignCorporationOwnership", logic:"yes", risk:"high", tieType:"Disclosure / Information Tie", source:"2025 Instructions for Form 5471", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i5471.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120-2025-SC-L16C", category:"additional" },
  { id:"8858", formNumber:"Form 8858", formName:"Information Return of U.S. Persons With Respect to Foreign Disregarded Entities and Foreign Branches", trigger:"Foreign disregarded entity or foreign branch reporting", factKey:"foreignDisregardedEntity", logic:"yes", risk:"high", tieType:"Disclosure / Information Tie", source:"Instructions for Form 8858", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i8858.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120SB-2025-L2", category:"additional" },
  { id:"8865", formNumber:"Form 8865", formName:"Return of U.S. Persons With Respect to Certain Foreign Partnerships", trigger:"Foreign partnership ownership or reportable transaction", factKey:"foreignPartnershipInterest", logic:"yes", risk:"high", tieType:"Disclosure / Information Tie", source:"2025 Instructions for Form 8865", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i8865.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120SB-2025-L1", category:"additional" },
  { id:"8992", formNumber:"Form 8992", formName:"U.S. Shareholder Calculation of GILTI", trigger:"GILTI computation for applicable controlled foreign corporations", factKey:"giltiItems", logic:"yes", risk:"high", tieType:"Indirect Numerical Tie", source:"Instructions for Form 8992", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i8992.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120-2025-SC-L17", category:"additional" },
  { id:"1118", formNumber:"Form 1118", formName:"Foreign Tax Credit—Corporations", trigger:"Corporate foreign tax credit claimed", factKey:"foreignTaxCredit", logic:"yes", risk:"high", tieType:"Direct Numerical Tie", source:"IRS About Form 1118", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-1118", lastVerified:"2026-09-07", representativeLineId:"FED-1120-2025-SJ-L5A", category:"additional" },
  { id:"3800", formNumber:"Form 3800", formName:"General Business Credit", trigger:"General business credit claimed or carried", factKey:"generalBusinessCredit", logic:"yes", risk:"medium", tieType:"Direct Numerical Tie", source:"2025 Instructions for Form 3800", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i3800.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120-2025-SJ-L5C", category:"additional" },
  { id:"6765", formNumber:"Form 6765", formName:"Credit for Increasing Research Activities", trigger:"Research credit calculated or claimed", factKey:"researchCredit", logic:"yes", risk:"medium", tieType:"Indirect Numerical Tie", source:"2025 Instructions for Form 6765", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i6765.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120-2025-SJ-L5C", category:"additional" },
  { id:"8283", formNumber:"Form 8283", formName:"Noncash Charitable Contributions", trigger:"Noncash charitable contributions requiring detailed substantiation", factKey:"noncashContribution", logic:"yes", risk:"medium", tieType:"Disclosure / Information Tie", source:"2025 Instructions for Form 8283", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i8283.pdf", lastVerified:"2026-09-07", representativeLineId:"FED-1120-2025-P1-L19", category:"additional" },
  { id:"8886", formNumber:"Form 8886", formName:"Reportable Transaction Disclosure Statement", trigger:"Participation in a reportable transaction", factKey:"reportableTransaction", logic:"yes", risk:"high", tieType:"Disclosure / Information Tie", source:"IRS About Form 8886", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-8886", lastVerified:"2026-09-07", representativeLineId:"FED-1120-2025-SK-L14", category:"additional" },
  { id:"scheduleN", formNumber:"Schedule N", formName:"Foreign Operations of U.S. Corporations", trigger:"Assets in, or business operations in, a foreign country or U.S. possession", factKey:"foreignOperations", logic:"yes", risk:"high", tieType:"Disclosure / Information Tie", source:"2025 Instructions for Form 1120 and Schedule N", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-1120", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L21", category:"additional", packageGroup:"International", filingMethod:"Attached to Form 1120" },
  { id:"scheduleO", formNumber:"Schedule O", formName:"Consent Plan and Apportionment Schedule for a Controlled Group", trigger:"Membership in a controlled group that apportions tax benefits under a consent plan", factKey:"controlledGroup", logic:"yes", risk:"medium", tieType:"Disclosure / Information Tie", source:"2025 Instructions for Form 1120", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i1120.pdf", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L5", category:"additional", packageGroup:"Ownership & transactions", filingMethod:"Attached to Form 1120" },
  { id:"scheduleUTP", formNumber:"Schedule UTP", formName:"Uncertain Tax Position Statement", trigger:"Corporation meets the Schedule UTP asset threshold and has one or more reportable uncertain tax positions", factKey:"uncertainTaxPosition", logic:"yes", risk:"high", tieType:"Disclosure / Information Tie", source:"IRS About Schedule UTP", sourceUrl:"https://www.irs.gov/forms-pubs/about-schedule-utp-form-1120", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L14", category:"additional", packageGroup:"Procedure & separate filings", filingMethod:"Attached to Form 1120" },
  { id:"schedulePH", formNumber:"Schedule PH", formName:"U.S. Personal Holding Company Tax", trigger:"Corporation is a personal holding company", factKey:"personalHoldingCompany", logic:"yes", risk:"high", tieType:"Direct Numerical Tie", source:"IRS About Schedule PH", sourceUrl:"https://www.irs.gov/forms-pubs/about-schedule-ph-form-1120", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SJ-L9", category:"additional", packageGroup:"Tax & credits", filingMethod:"Attached to Form 1120" },
  { id:"scheduleH", formNumber:"Schedule H", formName:"Section 280H Limitations for a Personal Service Corporation", trigger:"Personal service corporation elects a section 444 tax year and must test the minimum distribution requirement", factKey:"personalServiceCorporation", logic:"yes", risk:"medium", tieType:"Indirect Numerical Tie", source:"IRS Schedule H (Form 1120)", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-1120", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L8", category:"additional", packageGroup:"Income & deductions", filingMethod:"Attached to Form 1120" },
  { id:"2220", formNumber:"Form 2220", formName:"Underpayment of Estimated Tax by Corporations", trigger:"Estimated tax installments were insufficient or an exception/annualized method must be documented", factKey:"estimatedTaxUnderpayment", logic:"yes", risk:"medium", tieType:"Direct Numerical Tie", source:"IRS About Form 2220", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-2220", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SJ-L34", category:"additional", packageGroup:"Tax & credits", filingMethod:"Attached to Form 1120" },
  { id:"4136", formNumber:"Form 4136", formName:"Credit for Federal Tax Paid on Fuels", trigger:"Refundable federal fuel tax credit is claimed", factKey:"fuelCredit", logic:"yes", risk:"low", tieType:"Direct Numerical Tie", source:"IRS About Form 4136", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-4136", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SJ-L19", category:"additional", packageGroup:"Tax & credits", filingMethod:"Attached to Form 1120" },
  { id:"4255", formNumber:"Form 4255", formName:"Certain Credit Recapture, Excessive Payments, and Penalties", trigger:"Investment or other listed business credits are subject to recapture or excessive-payment reporting", factKey:"creditRecapture", logic:"yes", risk:"medium", tieType:"Direct Numerical Tie", source:"IRS About Form 4255", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-4255", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SJ-L1G", category:"additional", packageGroup:"Tax & credits", filingMethod:"Attached to Form 1120" },
  { id:"4626", formNumber:"Form 4626", formName:"Alternative Minimum Tax—Corporations", trigger:"Corporation must determine applicable-corporation status or calculate corporate alternative minimum tax under the 2025 instructions", factKey:"corporateAmt", logic:"yes", risk:"high", tieType:"Direct Numerical Tie", source:"IRS About Form 4626", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-4626", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SJ-L3", category:"additional", packageGroup:"Tax & credits", filingMethod:"Attached to Form 1120" },
  { id:"4797", formNumber:"Form 4797", formName:"Sales of Business Property", trigger:"Sale, exchange, involuntary conversion, or other disposition of business property", factKey:"businessPropertyDisposition", logic:"yes", risk:"medium", tieType:"Direct Numerical Tie", source:"IRS About Form 4797", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-4797", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-P1-L9", category:"additional", packageGroup:"Income & deductions", filingMethod:"Attached to Form 1120" },
  { id:"6252", formNumber:"Form 6252", formName:"Installment Sale Income", trigger:"Income from an installment sale is reported for the current or a prior year", factKey:"installmentSale", logic:"yes", risk:"medium", tieType:"Indirect Numerical Tie", source:"IRS About Form 6252", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-6252", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-P1-L9", category:"additional", packageGroup:"Income & deductions", filingMethod:"Attached to Form 1120" },
  { id:"7004", formNumber:"Form 7004", formName:"Application for Automatic Extension", trigger:"An automatic extension of time to file the corporate return was requested", factKey:"extensionFiled", logic:"yes", risk:"medium", tieType:"Procedural Only", source:"IRS About Form 7004", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-7004", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L12", category:"additional", packageGroup:"Procedure & separate filings", filingMethod:"Separate or preparer authorization" },
  { id:"851", formNumber:"Form 851", formName:"Affiliations Schedule", trigger:"Common parent files a consolidated income tax return for an affiliated group", factKey:"consolidatedReturn", logic:"yes", risk:"high", tieType:"Disclosure / Information Tie", source:"IRS About Form 851", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-851", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L4", category:"additional", packageGroup:"Ownership & transactions", filingMethod:"Attached to Form 1120" },
  { id:"1122", formNumber:"Form 1122", formName:"Authorization and Consent of Subsidiary Corporation", trigger:"Subsidiary joins a consolidated return and must consent to the consolidated-return regulations", factKey:"consolidatedSubsidiary", logic:"yes", risk:"high", tieType:"Procedural Only", source:"IRS About Form 1122", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-1122", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L4", category:"additional", packageGroup:"Ownership & transactions", filingMethod:"Attached to Form 1120" },
  { id:"8594", formNumber:"Form 8594", formName:"Asset Acquisition Statement", trigger:"Assets constituting a trade or business were acquired or sold in an applicable asset acquisition", factKey:"businessAcquisition", logic:"yes", risk:"medium", tieType:"Disclosure / Information Tie", source:"IRS About Form 8594", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-8594", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-P1-L26", category:"additional", packageGroup:"Ownership & transactions", filingMethod:"Attached to Form 1120" },
  { id:"8621", formNumber:"Form 8621", formName:"Information Return by a Shareholder of a PFIC or QEF", trigger:"Direct or indirect ownership of a passive foreign investment company or a reportable PFIC transaction", factKey:"pficOwnership", logic:"yes", risk:"high", tieType:"Disclosure / Information Tie", source:"IRS About Form 8621", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-8621", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SJ-L1C", category:"additional", packageGroup:"International", filingMethod:"Attached to Form 1120" },
  { id:"8827", formNumber:"Form 8827", formName:"Credit for Prior Year Minimum Tax—Corporations", trigger:"Corporation claims or carries a prior-year minimum tax credit", factKey:"priorMinimumTaxCredit", logic:"yes", risk:"medium", tieType:"Direct Numerical Tie", source:"IRS About Form 8827", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-8827", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SJ-L5D", category:"additional", packageGroup:"Tax & credits", filingMethod:"Attached to Form 1120" },
  { id:"8938", formNumber:"Form 8938", formName:"Statement of Specified Foreign Financial Assets", trigger:"Corporation is a specified domestic entity and exceeds the applicable foreign-financial-asset reporting threshold", factKey:"specifiedForeignFinancialAssets", logic:"yes", risk:"high", tieType:"Disclosure / Information Tie", source:"IRS About Form 8938", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-8938", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L21", category:"additional", packageGroup:"International", filingMethod:"Attached to Form 1120" },
  { id:"8978", formNumber:"Form 8978", formName:"Partner's Additional Reporting Year Tax", trigger:"A partnership adjustment is taken into account under the centralized partnership audit regime", factKey:"partnershipAdjustment", logic:"yes", risk:"high", tieType:"Direct Numerical Tie", source:"IRS About Form 8978", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-8978", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SJ-L1D", category:"additional", packageGroup:"Tax & credits", filingMethod:"Attached to Form 1120" },
  { id:"8991", formNumber:"Form 8991", formName:"Tax on Base Erosion Payments", trigger:"Taxpayer must compute base erosion and anti-abuse tax under section 59A", factKey:"baseErosionTax", logic:"yes", risk:"high", tieType:"Direct Numerical Tie", source:"IRS About Form 8991", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-8991", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SJ-L1F", category:"additional", packageGroup:"International", filingMethod:"Attached to Form 1120" },
  { id:"8996", formNumber:"Form 8996", formName:"Qualified Opportunity Fund", trigger:"Corporation is organized and self-certifies as a qualified opportunity fund", factKey:"qualifiedOpportunityFund", logic:"yes", risk:"medium", tieType:"Disclosure / Information Tie", source:"IRS About Form 8996", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-8996", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L14", category:"additional", packageGroup:"Ownership & transactions", filingMethod:"Attached to Form 1120" },
  { id:"926", formNumber:"Form 926", formName:"Return by a U.S. Transferor of Property to a Foreign Corporation", trigger:"Reportable transfer of cash or other property to a foreign corporation", factKey:"foreignPropertyTransfer", logic:"yes", risk:"high", tieType:"Disclosure / Information Tie", source:"IRS About Form 926", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-926", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-SK-L21", category:"additional", packageGroup:"International", filingMethod:"Attached to Form 1120" },
  { id:"1042", formNumber:"Forms 1042 / 1042-S", formName:"U.S.-Source Income and Withholding for Foreign Persons", trigger:"U.S.-source FDAP payments or other reportable amounts were paid to foreign persons", factKey:"foreignPayeeWithholding", logic:"yes", risk:"high", tieType:"Procedural Only", source:"IRS About Form 1042", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-1042", lastVerified:"2026-09-08", representativeLineId:"FED-1120-2025-P1-L26", category:"additional", packageGroup:"Procedure & separate filings", filingMethod:"Separate or preparer authorization" }
];

export const CROSS_CHECK_RULES_2025: CrossCheckRule[] = [
  { id:"cogs", formNumber:"Form 1125-A", label:"Cost of goods sold", supportingLabel:"Form 1125-A, line 8", targetLabel:"Form 1120, line 2", sourceLineIds:["FED-1125A-2025-L8"], targetLineIds:["FED-1120-2025-P1-L2"], tieType:"Direct Numerical Tie", risk:"high", allowsReconcilingAmount:false, source:"2025 Form 1120 and Form 1125-A", sourceUrl:"https://www.irs.gov/forms-pubs/about-form-1125-a", lastVerified:"2026-09-07" },
  { id:"officerComp", formNumber:"Form 1125-E", label:"Officer compensation deduction", supportingLabel:"Form 1125-E, line 4", targetLabel:"Form 1120, line 12", sourceLineIds:["FED-1125E-2025-L4"], targetLineIds:["FED-1120-2025-P1-L12"], tieType:"Direct Numerical Tie", risk:"medium", allowsReconcilingAmount:false, source:"2025 Instructions for Form 1120", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i1120.pdf", lastVerified:"2026-09-07" },
  { id:"depreciation", formNumber:"Form 4562", label:"Depreciation and amortization allocation", supportingLabel:"Form 4562, line 22 total depreciation", targetLabel:"Form 1120, line 20 amount not claimed elsewhere", sourceLineIds:["FED-4562-2025-L22"], targetLineIds:["FED-1120-2025-P1-L20"], tieType:"Indirect Numerical Tie", risk:"medium", allowsReconcilingAmount:true, source:"2025 Instructions for Form 4562 and Form 1120", sourceUrl:"https://www.irs.gov/instructions/i4562", lastVerified:"2026-09-07" },
  { id:"interest", formNumber:"Form 8990", label:"Deductible business interest", supportingLabel:"Form 8990, line 30", targetLabel:"Form 1120, line 18", sourceLineIds:["FED-8990-2025-L30"], targetLineIds:["FED-1120-2025-P1-L18"], tieType:"Direct Numerical Tie", risk:"high", allowsReconcilingAmount:false, source:"2025 Instructions for Form 8990", sourceUrl:"https://www.irs.gov/instructions/i8990", lastVerified:"2026-09-07" },
  { id:"section250", formNumber:"Form 8993", label:"Section 250 deduction", supportingLabel:"Form 8993, total section 250 deduction", targetLabel:"Form 1120, Schedule C, line 22", sourceLineIds:["FED-8993-2025-L24"], targetLineIds:["FED-1120-2025-SC-L22"], tieType:"Direct Numerical Tie", risk:"high", allowsReconcilingAmount:false, source:"2025 Form 1120 and Form 8993", sourceUrl:"https://www.irs.gov/pub/irs-pdf/i8993.pdf", lastVerified:"2026-09-07" }
];

export const INFORMATION_CHECK_RULES_2025: InformationCheckRule[] = [
  { id:"relatedSales", label:"Related-party sales / receipts", targetLabel:"Form 5472 lines 9–10", targetLineIds:["FED-5472-2025-L9","FED-5472-2025-L10"], risk:"high" },
  { id:"relatedPurchases", label:"Related-party purchases", targetLabel:"Form 5472 lines 23–24", targetLineIds:["FED-5472-2025-L23","FED-5472-2025-L24"], risk:"high" },
  { id:"dueFrom", label:"Due from affiliates / loans advanced", targetLabel:"Form 5472 lines 34–36", targetLineIds:["FED-5472-2025-L34"], risk:"high" },
  { id:"dueTo", label:"Due to affiliates / amounts borrowed", targetLabel:"Form 5472 lines 20–22", targetLineIds:["FED-5472-2025-L20"], risk:"high" },
  { id:"interestReceived", label:"Related-party interest received", targetLabel:"Form 5472 line 16", targetLineIds:["FED-5472-2025-L16"], risk:"medium" },
  { id:"interestPaid", label:"Related-party interest paid", targetLabel:"Form 5472 line 30", targetLineIds:["FED-5472-2025-L30"], risk:"medium" },
  { id:"servicesProvided", label:"Related-party services provided", targetLabel:"Form 5472 line 11", targetLineIds:["FED-5472-2025-L11"], risk:"high" },
  { id:"servicesReceived", label:"Related-party services / management fees paid", targetLabel:"Form 5472 line 25", targetLineIds:["FED-5472-2025-L25"], risk:"high" },
  { id:"capitalTransactions", label:"Capital contributions / distributions", targetLabel:"Form 5472 nonmonetary and other transaction disclosures", targetLineIds:[], risk:"high" },
  { id:"otherRelated", label:"Other related-party payments or receipts", targetLabel:"Form 5472 lines 18 and 32 / attached statements", targetLineIds:["FED-5472-2025-L18","FED-5472-2025-L32"], risk:"high" }
];

export const FACT_CHECKLIST_2025: FactPrompt[] = [
  {key:"inventoryOrCogs",label:"Inventory / COGS",question:"Does the company maintain inventory or report cost of goods sold?",input:"tri",group:"Core business facts"},
  {key:"depreciationOrAmortization",label:"Depreciation / amortization",question:"Does the company have depreciable or amortizable assets, tax depreciation, section 179, or bonus depreciation?",input:"tri",group:"Core business facts"},
  {key:"businessInterestExpense",label:"Business interest",question:"Does the company have business interest expense, a disallowed carryforward, or excess business interest expense?",input:"tri",group:"Core business facts"},
  {key:"avgGrossReceipts3Yr",label:"3-year average gross receipts",question:"Enter average annual gross receipts for the three prior tax years for the 2025 section 163(j) test.",input:"amount",group:"Core business facts"},
  {key:"taxShelter",label:"Tax shelter status",question:"Is the taxpayer a tax shelter for purposes of the small-business exception?",input:"tri",group:"Core business facts"},
  {key:"partnershipExcessBusinessInterest",label:"Partnership excess interest",question:"Is there current- or prior-year excess business interest expense from a partnership?",input:"tri",group:"Core business facts"},
  {key:"exceptedTradeOnly",label:"Excepted trade only",question:"Is all interest expense attributable only to an excepted trade or business?",input:"tri",group:"Core business facts"},
  {key:"officerCompensation",label:"Officer compensation",question:"Does the corporation report compensation paid to officers?",input:"tri",group:"Core business facts"},
  {key:"totalReceipts",label:"Total receipts",question:"Enter Form 1120 total receipts used for the Form 1125-E threshold.",input:"amount",group:"Core business facts"},
  {key:"totalAssets",label:"Year-end total assets",question:"Enter Form 1120 Schedule L year-end total assets for the Schedule M-3 test.",input:"amount",group:"Core business facts"},
  {key:"voluntaryM3",label:"Voluntary M-3",question:"Will the corporation voluntarily file Schedule M-3 if it is not otherwise required?",input:"tri",group:"Core business facts"},
  {key:"electronicFiling",label:"Electronic filing",question:"Will the return use Form 8879-CORP electronic filing authorization?",input:"tri",group:"Core business facts"},
  {key:"foreignOwnership25",label:"25% foreign ownership",question:"Is the U.S. corporation at least 25% foreign-owned by vote or value?",input:"tri",group:"Ownership & international"},
  {key:"relatedPartyTransactions",label:"Related-party transactions",question:"Did the company have reportable transactions with a foreign or domestic related party?",input:"tri",group:"Ownership & international"},
  {key:"scheduleGOwnership",label:"Schedule G ownership",question:"Do persons or entities meet the applicable voting-stock disclosure thresholds?",input:"tri",group:"Ownership & international"},
  {key:"section250Items",label:"Section 250",question:"Does the corporation claim a 2025 section 250 deduction or have relevant FDII/GILTI items?",input:"tri",group:"Ownership & international"},
  {key:"foreignCorporationOwnership",label:"Foreign corporation",question:"Does a U.S. person meet a Form 5471 ownership, control, acquisition, disposition, or other filing category?",input:"tri",group:"Ownership & international"},
  {key:"foreignDisregardedEntity",label:"Foreign disregarded entity / branch",question:"Does the corporation own a foreign disregarded entity or operate a foreign branch?",input:"tri",group:"Ownership & international"},
  {key:"foreignPartnershipInterest",label:"Foreign partnership",question:"Does the corporation own or transact with a foreign partnership in a Form 8865 filing category?",input:"tri",group:"Ownership & international"},
  {key:"giltiItems",label:"GILTI computation",question:"Are there controlled foreign corporation items requiring a GILTI computation?",input:"tri",group:"Ownership & international"},
  {key:"foreignOperations",label:"Foreign operations",question:"Did the corporation have assets in, or operate a business in, a foreign country or U.S. possession?",input:"tri",group:"Ownership & international"},
  {key:"foreignPropertyTransfer",label:"Transfer to foreign corporation",question:"Did the corporation transfer cash or other property to a foreign corporation?",input:"tri",group:"Ownership & international"},
  {key:"pficOwnership",label:"PFIC / QEF ownership",question:"Did the corporation directly or indirectly own a PFIC or have a reportable PFIC transaction?",input:"tri",group:"Ownership & international"},
  {key:"specifiedForeignFinancialAssets",label:"Specified foreign financial assets",question:"Could the corporation be a specified domestic entity exceeding the Form 8938 reporting threshold?",input:"tri",group:"Ownership & international"},
  {key:"baseErosionTax",label:"BEAT / base erosion",question:"Do gross receipts and base-erosion payments require a Form 8991 computation?",input:"tri",group:"Ownership & international"},
  {key:"foreignPayeeWithholding",label:"Payments to foreign persons",question:"Were U.S.-source FDAP or other reportable amounts paid to foreign persons requiring Forms 1042/1042-S?",input:"tri",group:"Ownership & international"},
  {key:"capitalAssetTransactions",label:"Capital assets",question:"Were there capital asset sales, exchanges, or carryovers?",input:"tri",group:"Tax, credits & transactions"},
  {key:"businessPropertyDisposition",label:"Business property dispositions",question:"Was depreciable, real, or other business property sold, exchanged, or involuntarily converted?",input:"tri",group:"Tax, credits & transactions"},
  {key:"installmentSale",label:"Installment sales",question:"Is installment-sale income reportable from a current- or prior-year disposition?",input:"tri",group:"Tax, credits & transactions"},
  {key:"businessAcquisition",label:"Business asset acquisition",question:"Did the company buy or sell a group of assets constituting a trade or business?",input:"tri",group:"Tax, credits & transactions"},
  {key:"foreignTaxCredit",label:"Foreign tax credit",question:"Is a corporate foreign tax credit claimed?",input:"tri",group:"Tax, credits & transactions"},
  {key:"generalBusinessCredit",label:"General business credit",question:"Is a general business credit claimed or carried?",input:"tri",group:"Tax, credits & transactions"},
  {key:"researchCredit",label:"Research credit",question:"Is a research credit calculated or claimed?",input:"tri",group:"Tax, credits & transactions"},
  {key:"priorMinimumTaxCredit",label:"Prior minimum tax credit",question:"Is a prior-year minimum tax credit claimed or carried?",input:"tri",group:"Tax, credits & transactions"},
  {key:"corporateAmt",label:"Corporate AMT",question:"Do the Form 4626 filing rules or CAMT safe-harbor review require Form 4626?",input:"tri",group:"Tax, credits & transactions"},
  {key:"creditRecapture",label:"Credit recapture",question:"Did a recapture event or excessive payment affect an investment or other listed business credit?",input:"tri",group:"Tax, credits & transactions"},
  {key:"fuelCredit",label:"Federal fuel tax credit",question:"Is a credit for federal tax paid on fuels claimed?",input:"tri",group:"Tax, credits & transactions"},
  {key:"partnershipAdjustment",label:"Partnership audit adjustment",question:"Must the corporation take a BBA partnership adjustment into account this year?",input:"tri",group:"Tax, credits & transactions"},
  {key:"noncashContribution",label:"Noncash contribution",question:"Were noncash charitable contributions made that may require substantiation?",input:"tri",group:"Tax, credits & transactions"},
  {key:"reportableTransaction",label:"Reportable transaction",question:"Did the corporation participate in a transaction potentially reportable on Form 8886?",input:"tri",group:"Tax, credits & transactions"},
  {key:"controlledGroup",label:"Controlled group",question:"Was the corporation a member of a controlled group requiring Schedule O review?",input:"tri",group:"Procedure & other filings"},
  {key:"consolidatedReturn",label:"Consolidated parent",question:"Is the company the common parent filing a consolidated federal return?",input:"tri",group:"Procedure & other filings"},
  {key:"consolidatedSubsidiary",label:"Consolidated subsidiary consent",question:"Is the company joining a consolidated return as a subsidiary requiring Form 1122 consent?",input:"tri",group:"Procedure & other filings"},
  {key:"uncertainTaxPosition",label:"Uncertain tax positions",question:"Does the corporation meet the Schedule UTP asset threshold and have a reportable uncertain tax position?",input:"tri",group:"Procedure & other filings"},
  {key:"personalHoldingCompany",label:"Personal holding company",question:"Does the corporation meet the personal holding company income and ownership tests?",input:"tri",group:"Procedure & other filings"},
  {key:"personalServiceCorporation",label:"Personal service corporation",question:"Is the corporation a PSC using a section 444 tax year that requires Schedule H?",input:"tri",group:"Procedure & other filings"},
  {key:"estimatedTaxUnderpayment",label:"Estimated tax underpayment",question:"Were estimated tax installments insufficient, or is an annualized/adjusted seasonal method used?",input:"tri",group:"Procedure & other filings"},
  {key:"extensionFiled",label:"Filing extension",question:"Was Form 7004 filed to extend the Form 1120 filing deadline?",input:"tri",group:"Procedure & other filings"},
  {key:"qualifiedOpportunityFund",label:"Qualified Opportunity Fund",question:"Is the corporation organized and self-certified as a qualified opportunity fund?",input:"tri",group:"Procedure & other filings"}
];

export const defaultFederalFacts: FederalFacts = Object.freeze({
  inventoryOrCogs:"unknown", depreciationOrAmortization:"unknown", businessInterestExpense:"unknown", avgGrossReceipts3Yr:null, taxShelter:"unknown", partnershipExcessBusinessInterest:"unknown", exceptedTradeOnly:"unknown", foreignOwnership25:"unknown", relatedPartyTransactions:"unknown", officerCompensation:"unknown", totalReceipts:null, section250Items:"unknown", scheduleGOwnership:"unknown", totalAssets:null, voluntaryM3:"unknown", electronicFiling:"unknown", capitalAssetTransactions:"unknown", foreignCorporationOwnership:"unknown", foreignDisregardedEntity:"unknown", foreignPartnershipInterest:"unknown", giltiItems:"unknown", foreignTaxCredit:"unknown", generalBusinessCredit:"unknown", researchCredit:"unknown", noncashContribution:"unknown", reportableTransaction:"unknown", foreignOperations:"unknown", controlledGroup:"unknown", uncertainTaxPosition:"unknown", personalHoldingCompany:"unknown", personalServiceCorporation:"unknown", estimatedTaxUnderpayment:"unknown", fuelCredit:"unknown", creditRecapture:"unknown", corporateAmt:"unknown", businessPropertyDisposition:"unknown", installmentSale:"unknown", extensionFiled:"unknown", consolidatedReturn:"unknown", consolidatedSubsidiary:"unknown", businessAcquisition:"unknown", pficOwnership:"unknown", priorMinimumTaxCredit:"unknown", specifiedForeignFinancialAssets:"unknown", partnershipAdjustment:"unknown", baseErosionTax:"unknown", qualifiedOpportunityFund:"unknown", foreignPropertyTransfer:"unknown", foreignPayeeWithholding:"unknown"
});

const defaultReceived = ["1120","scheduleC","scheduleJ","scheduleK","scheduleL","scheduleM1","scheduleM2","scheduleB","scheduleG","1125A","1125E","4562","5472","8879CORP","8990","8993","scheduleM3"];

export const createDefaultFederalCompletenessState = (): FederalCompletenessState => ({
  facts: { ...defaultFederalFacts },
  receivedForms: Object.fromEntries(FEDERAL_FORM_RULES_2025.map(rule => [rule.id, defaultReceived.includes(rule.id)])),
  formReviews: {}, crossCheckReviews: {}, informationReviews: {}
});

export function evaluateExpectedForm(rule: FederalFormRule, facts: FederalFacts): { result: ExpectedResult; reason: string } {
  if (rule.logic === "always") return { result:"expected", reason:"Required core return for the configured U.S. C corporation review." };
  if (rule.logic === "yes") {
    const value = rule.factKey ? facts[rule.factKey] : "unknown";
    return value === "yes" ? { result:"expected", reason:rule.trigger } : value === "no" ? { result:"not_expected", reason:"Current facts do not identify the triggering condition." } : { result:"potential", reason:"Triggering fact has not been confirmed." };
  }
  if (rule.logic === "form5472") {
    if (facts.foreignOwnership25 === "no" || facts.relatedPartyTransactions === "no") return { result:"not_expected", reason:"The current checklist does not show both 25% foreign ownership and reportable related-party transactions." };
    if (facts.foreignOwnership25 === "yes" && facts.relatedPartyTransactions === "yes") return { result:"expected", reason:"25% foreign ownership and reportable related-party transactions are both present." };
    return { result:"potential", reason:"Foreign ownership or related-party transaction facts remain unconfirmed." };
  }
  if (rule.logic === "form1125e") {
    if (facts.officerCompensation === "no") return { result:"not_expected", reason:"No officer compensation deduction identified." };
    if (facts.officerCompensation === "yes" && facts.totalReceipts !== null && facts.totalReceipts >= 500000) return { result:"expected", reason:"Officer compensation is reported and total receipts are at least $500,000." };
    if (facts.officerCompensation === "yes" && facts.totalReceipts !== null && facts.totalReceipts < 500000) return { result:"not_expected", reason:"Total receipts are below the $500,000 Form 1125-E threshold." };
    return { result:"potential", reason:"Officer compensation or total receipts must be confirmed." };
  }
  if (rule.logic === "form8990") {
    if (facts.businessInterestExpense === "no") return { result:"not_expected", reason:"No business interest expense or carryforward identified." };
    if (facts.businessInterestExpense !== "yes") return { result:"potential", reason:"Business interest expense has not been confirmed." };
    const small = facts.avgGrossReceipts3Yr !== null && facts.avgGrossReceipts3Yr <= 31000000;
    const cleanException = small && facts.taxShelter === "no" && facts.partnershipExcessBusinessInterest === "no";
    if (cleanException || facts.exceptedTradeOnly === "yes") return { result:"not_expected", reason:"A 2025 Form 8990 filing exception appears to apply; document and review the exception." };
    if ((facts.avgGrossReceipts3Yr !== null && facts.avgGrossReceipts3Yr > 31000000) || facts.taxShelter === "yes" || facts.partnershipExcessBusinessInterest === "yes") return { result:"expected", reason:"Business interest exists and the supplied facts do not qualify for the small-business filing exclusion." };
    return { result:"potential", reason:"Business interest exists, but the 2025 $31 million test and filing exclusions are not fully resolved." };
  }
  if (rule.logic === "scheduleM3") {
    if (facts.totalAssets !== null && facts.totalAssets >= 10000000) return { result:"expected", reason:"Year-end total assets equal or exceed $10 million." };
    if (facts.voluntaryM3 === "yes") return { result:"expected", reason:"Schedule M-3 is being filed voluntarily." };
    if (facts.totalAssets !== null && facts.totalAssets < 10000000 && facts.voluntaryM3 === "no") return { result:"not_expected", reason:"Assets are below $10 million and no voluntary filing is indicated." };
    return { result:"potential", reason:"Year-end assets or voluntary filing status must be confirmed." };
  }
  if (rule.logic === "scheduleLM") {
    if (facts.totalReceipts !== null && facts.totalAssets !== null && facts.totalReceipts < 250000 && facts.totalAssets < 250000) return { result:"not_expected", reason:"Both total receipts and year-end assets are below $250,000; document the Schedule K question 13 small-corporation exception." };
    if ((facts.totalReceipts !== null && facts.totalReceipts >= 250000) || (facts.totalAssets !== null && facts.totalAssets >= 250000)) return { result:"expected", reason:"The $250,000 small-corporation exception is not available." };
    return { result:"potential", reason:"Total receipts and year-end assets must both be confirmed for the Schedule K question 13 exception." };
  }
  if (rule.logic === "scheduleM1") {
    const m3 = evaluateExpectedForm(FEDERAL_FORM_RULES_2025.find(item => item.id === "scheduleM3")!, facts);
    if (m3.result === "expected") return { result:"not_expected", reason:"Schedule M-3 replaces Schedule M-1 for this filing." };
    const scheduleL = evaluateExpectedForm(FEDERAL_FORM_RULES_2025.find(item => item.id === "scheduleL")!, facts);
    if (scheduleL.result === "not_expected") return { result:"not_expected", reason:"The Schedule K question 13 small-corporation exception applies." };
    if (scheduleL.result === "expected" && m3.result === "not_expected") return { result:"expected", reason:"The small-corporation exception is unavailable and Schedule M-3 will not replace Schedule M-1." };
    return { result:"potential", reason:"Resolve the $250,000 exception and Schedule M-3 status." };
  }
  const m3 = evaluateExpectedForm(FEDERAL_FORM_RULES_2025.find(item => item.id === "scheduleM3")!, facts);
  if (m3.result === "not_expected") return { result:"not_expected", reason:"Schedule M-3 is not expected under the supplied facts." };
  if (facts.voluntaryM3 === "yes") return { result:"not_expected", reason:"A voluntary Schedule M-3 filer generally is not required to file Schedule B." };
  if (facts.totalAssets !== null && facts.totalAssets >= 50000000 && m3.result === "expected") return { result:"expected", reason:"Required Schedule M-3 filer with total assets of at least $50 million." };
  if (facts.totalAssets !== null && facts.totalAssets < 50000000) return { result:"not_expected", reason:"Required Schedule M-3 filers with less than $50 million in assets generally are not required to file Schedule B." };
  return { result:"potential", reason:"Schedule M-3 status and the $50 million Schedule B asset threshold require review." };
}

export function normalizeFederalCompletenessState(value?: Partial<FederalCompletenessState>): FederalCompletenessState {
  const blank = createDefaultFederalCompletenessState();
  return { facts:{...blank.facts,...(value?.facts ?? {})}, receivedForms:{...blank.receivedForms,...(value?.receivedForms ?? {})}, formReviews:value?.formReviews ?? {}, crossCheckReviews:value?.crossCheckReviews ?? {}, informationReviews:value?.informationReviews ?? {} };
}
