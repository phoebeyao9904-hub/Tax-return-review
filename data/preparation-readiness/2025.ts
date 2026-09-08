import type { FederalFacts, TriState } from "@/data/federal-completeness/2025";

export type PreparationStatus = "available" | "missing" | "incomplete" | "need_confirmation" | "not_applicable" | "under_review";
export type RequiredLevel = "mandatory" | "conditional" | "optional";
export type PreparationOwner = "Accounting" | "AP" | "AR" | "Payroll / HR" | "Treasury" | "Legal" | "Tax Firm" | "Management" | "Procurement" | "Sales" | "IT" | "Corporate HQ";
export type PreparationCategoryId = "company" | "prior" | "financials" | "revenue" | "cogs" | "expenses" | "fixed_assets" | "balance_sheet" | "book_tax" | "related_parties" | "special_tax" | "documents";

export type PreparationItemDefinition = {
  id: string; category: PreparationCategoryId; label: string; level: RequiredLevel; owner: PreparationOwner;
  forms: string[]; lines: string; suggestedSources: string[]; why: string; guidance: string; missingImpact: string;
  question: string; risk: "high" | "medium" | "low"; triggerFact?: keyof FederalFacts; professionalJudgment?: boolean;
};
export type PreparationItemState = {
  status: PreparationStatus; value: string; source: string; bookAmount: number | null; taxAmount: number | null;
  adjustment: number | null; supportingDocument: string; reviewerNote: string; updatedAt: string;
};
export type PreparationReadinessState = { items: Record<string, PreparationItemState> };

export const PREPARATION_CATEGORIES_2025 = [
  ["company","Company & Tax Profile","公司及税务基础信息"], ["prior","Prior-Year Federal Tax Data","上年度联邦申报资料"],
  ["financials","Financial Statements & TB","财务报表及总账资料"], ["revenue","Revenue & Other Income","收入及其他收益"],
  ["cogs","COGS & Inventory","销售成本及存货"], ["expenses","Operating Expenses","期间费用"],
  ["fixed_assets","Fixed Assets & Depreciation","固定资产及折旧"], ["balance_sheet","Balance Sheet & Working Capital","资产负债表"],
  ["book_tax","Book-to-Tax Adjustments","账税差异"], ["related_parties","Related Parties & Foreign Ownership","关联方及境外股东"],
  ["special_tax","Special Tax Items","专项税务事项"], ["documents","Supporting Documents Index","支持性资料索引"],
] as const;

type Seed = [string,string,RequiredLevel,PreparationOwner,string,string,"high"|"medium"|"low",(keyof FederalFacts)?];
const seeds: Record<PreparationCategoryId, Seed[]> = {
  company: [
    ["legal-name","Legal Entity Name","mandatory","Legal","Form 1120","Header","high"], ["ein","EIN","mandatory","Legal","Form 1120","Header","high"],
    ["business-address","Business Address","mandatory","Legal","Form 1120","Header","medium"], ["incorporation-state","State of Incorporation","mandatory","Legal","Schedule K","Question 1","medium"],
    ["incorporation-date","Date Incorporated","mandatory","Legal","Form 1120","Header","medium"], ["tax-year-dates","Tax Year Beginning / Ending","mandatory","Accounting","Form 1120","Header","high"],
    ["year-type","Calendar Year / Fiscal Year","mandatory","Accounting","Form 1120","Header","medium"], ["accounting-method","Accounting Method","mandatory","Accounting","Schedule K","Question 1","high"],
    ["principal-activity","Principal Business Activity","mandatory","Management","Form 1120","Header","medium"], ["activity-code","Business Activity Code","mandatory","Tax Firm","Form 1120","Header","medium"],
    ["return-status","Initial / Final Return and Changes","mandatory","Legal","Form 1120","Header checkboxes","medium"], ["consolidated-profile","Consolidated Return / Parent Company","conditional","Corporate HQ","Form 851; Form 1122; Schedule O","Ownership questions","high","consolidatedReturn"],
    ["foreign-parent-profile","Foreign Parent and Ownership Percentage","conditional","Corporate HQ","Form 5472; Schedule G","Ownership disclosures","high","foreignOwnership25"],
    ["foreign-affiliates-profile","Foreign Affiliates","conditional","Corporate HQ","Schedule N; Forms 5471/8858/8865","International disclosures","high","foreignOperations"],
  ],
  prior: [
    ["prior-1120","Prior-Year Form 1120","mandatory","Tax Firm","Form 1120","Comparative review","high"], ["prior-package","Prior-Year Complete Return Package","mandatory","Tax Firm","All federal forms","Opening scope","high"],
    ["prior-l","Prior-Year Schedule L","mandatory","Tax Firm","Schedule L","Beginning balances","high"], ["prior-m","Prior-Year Schedule M-1 / M-3","mandatory","Tax Firm","Schedule M-1 / M-3","Carryforward methodology","high"],
    ["prior-m2","Prior-Year Schedule M-2","mandatory","Tax Firm","Schedule M-2","Beginning retained earnings","medium"], ["prior-4562","Prior-Year Form 4562","conditional","Tax Firm","Form 4562","Tax basis rollforward","high","depreciationOrAmortization"],
    ["prior-5472","Prior-Year Form 5472","conditional","Tax Firm","Form 5472","Reporting history","high","foreignOwnership25"], ["prior-international","Prior-Year Forms 5471 / 1118 / 8858 / 8865","conditional","Tax Firm","International forms","Carryforwards and filing history","high","foreignOperations"],
    ["prior-cogs","Prior-Year Form 1125-A","conditional","Tax Firm","Form 1125-A","Beginning inventory","high","inventoryOrCogs"], ["prior-officer","Prior-Year Form 1125-E","conditional","Tax Firm","Form 1125-E","Officer population","medium","officerCompensation"],
    ["prior-dispositions","Prior-Year Schedule D / Form 4797","conditional","Tax Firm","Schedule D; Form 4797","Carryforwards","medium","capitalAssetTransactions"], ["prior-workpapers","Prior-Year Tax Workpapers","mandatory","Tax Firm","All federal forms","Methods and elections","high"],
    ["prior-carryforwards","NOL, Capital Loss, Contribution and Credit Carryforwards","mandatory","Tax Firm","Form 1120; Schedule D; Form 3800","Current deductions","high"], ["prior-tax-dep","Tax Depreciation Carryforward","conditional","Tax Firm","Form 4562","Tax basis","high","depreciationOrAmortization"],
    ["irs-notices","IRS Notices and Correspondence","mandatory","Management","Form 1120 and affected forms","Open tax matters","high"],
  ],
  financials: [
    ["adjusted-tb","Final Adjusted Trial Balance","mandatory","Accounting","Form 1120; all schedules","All financial lines","high"], ["general-ledger","General Ledger","mandatory","Accounting","Form 1120","Income and deductions","high"],
    ["income-statement","Income Statement","mandatory","Accounting","Form 1120; M-1/M-3","Book income","high"], ["balance-sheet","Balance Sheet","mandatory","Accounting","Schedule L","All balance sheet lines","high"],
    ["cash-flow","Cash Flow Statement","optional","Accounting","Supporting workpaper","Cash and debt review","low"], ["beginning-bs","Beginning Balance Sheet","mandatory","Accounting","Schedule L","Beginning column","high"],
    ["ending-bs","Ending Balance Sheet","mandatory","Accounting","Schedule L","Ending column","high"], ["chart-accounts","Chart of Accounts","mandatory","Accounting","TB mapping","All mapped lines","medium"],
    ["adjusting-entries","Adjusting and Year-End Journal Entries","mandatory","Accounting","M-1/M-3; Form 1120","Final book balances","high"], ["consolidation-entries","Consolidation and Elimination Entries","conditional","Corporate HQ","Form 1120; Form 5472","Reporting entity scope","high","consolidatedReturn"],
    ["tax-mapping-tb","Tax Mapping TB","mandatory","Accounting","Form 1120 and supporting forms","GL-to-tax mapping","high"],
  ],
  revenue: [
    ["gross-sales","Gross Sales","mandatory","AR","Form 1120","Line 1a","high"], ["sales-returns","Sales Returns and Allowances","mandatory","AR","Form 1120","Line 1b","high"],
    ["sales-discounts","Sales Discounts","mandatory","AR","Form 1120","Line 1b / classification review","medium"], ["reimbursements","Reimbursements","mandatory","Accounting","Form 1120","Revenue classification","medium"],
    ["other-operating-income","Other Operating Income","mandatory","Accounting","Form 1120","Lines 1 or 10","medium"], ["interest-income","Interest Income","mandatory","Treasury","Form 1120","Line 5","medium"],
    ["dividend-income","Dividend Income","conditional","Treasury","Schedule C","Dividend lines","high"], ["rental-income","Rental Income","conditional","Accounting","Form 1120","Line 6","medium"],
    ["asset-disposal-gain","Gain / Loss on Asset Disposal","conditional","Accounting","Form 4797; Schedule D","Form 1120 lines 8/9","high","businessPropertyDisposition"], ["fx-gain-loss","Foreign Exchange Gain / Loss","mandatory","Treasury","Form 1120","Line 10 / deductions","medium"],
    ["insurance-proceeds","Insurance Proceeds","conditional","Accounting","Form 1120; Form 4797","Income / basis review","medium"], ["tax-refunds","Tax Refunds","conditional","Accounting","Form 1120","Tax benefit review","medium"],
    ["tariff-refunds","Tariff and Customs Refunds","conditional","Accounting","Form 1120; Form 1125-A","Income or COGS classification","high"], ["misc-income","Miscellaneous Income","mandatory","Accounting","Form 1120","Line 10 statement","medium"],
  ],
  cogs: [
    ["beginning-inventory","Beginning Inventory","conditional","Accounting","Form 1125-A","Line 1","high","inventoryOrCogs"], ["purchases","Purchases","conditional","Procurement","Form 1125-A","Line 2","high","inventoryOrCogs"],
    ["freight-in","Freight-In","conditional","Procurement","Form 1125-A","Line 4 / other costs","medium","inventoryOrCogs"], ["duties-tariffs","Customs Duties and Tariffs","conditional","Procurement","Form 1125-A","Purchases / other costs","high","inventoryOrCogs"],
    ["direct-labor","Direct Labor","conditional","Payroll / HR","Form 1125-A","Line 3","medium","inventoryOrCogs"], ["other-inventory-costs","Other Inventory Costs","conditional","Accounting","Form 1125-A","Line 4","medium","inventoryOrCogs"],
    ["inventory-adjustments","Inventory Adjustments","conditional","Accounting","Form 1125-A; Schedule M-1/M-3","COGS adjustments","high","inventoryOrCogs"], ["inventory-write-down","Inventory Write-Down / Obsolescence","conditional","Accounting","Form 1125-A; Schedule M-1/M-3","Valuation adjustment","high","inventoryOrCogs"],
    ["inventory-reserve","Inventory Reserve","conditional","Accounting","Schedule M-1/M-3","Temporary difference","high","inventoryOrCogs"], ["ending-inventory","Ending Inventory","conditional","Accounting","Form 1125-A; Schedule L","Line 7 / inventory","high","inventoryOrCogs"],
    ["inventory-method","Inventory Valuation Method","conditional","Accounting","Form 1125-A","Method questions","high","inventoryOrCogs"], ["physical-reconciliation","Physical Inventory Reconciliation","conditional","Accounting","Form 1125-A","Ending inventory support","high","inventoryOrCogs"],
    ["book-cogs","Book COGS","conditional","Accounting","Form 1120","Line 2 reconciliation","high","inventoryOrCogs"], ["tax-cogs","Tax COGS","conditional","Tax Firm","Form 1125-A; Form 1120","Line 8 to line 2","high","inventoryOrCogs"],
  ],
  expenses: [
    ["officer-comp","Officer Compensation","conditional","Payroll / HR","Form 1125-E; Form 1120","Line 12","high","officerCompensation"], ["salaries","Salaries and Wages","mandatory","Payroll / HR","Form 1120","Line 13","high"],
    ["payroll-benefits","Payroll Taxes and Employee Benefits","mandatory","Payroll / HR","Form 1120","Lines 17/24","medium"], ["rent","Rent","mandatory","Accounting","Form 1120","Line 16","medium"],
    ["repairs","Repairs and Maintenance","mandatory","Accounting","Form 1120","Line 14 / capitalization review","medium"], ["interest-expense","Interest Expense","conditional","Treasury","Form 8990; Form 1120","Line 18","high","businessInterestExpense"],
    ["taxes-licenses","Taxes and Licenses","mandatory","Accounting","Form 1120","Line 17","medium"], ["insurance","Insurance","mandatory","Accounting","Form 1120","Line 26 statement","medium"],
    ["professional-fees","Legal, Accounting and Professional Fees","mandatory","AP","Form 1120","Line 26 statement","medium"], ["advertising","Advertising","mandatory","Sales","Form 1120","Line 22","low"],
    ["travel-meals","Travel, Meals and Entertainment","mandatory","Accounting","Form 1120; Schedule M-1/M-3","Lines 24/26 and limitations","high"], ["auto-utilities-office","Auto, Utilities and Office Expense","mandatory","Accounting","Form 1120","Line 26 statement","medium"],
    ["warehouse-expense","Warehouse Expense","mandatory","Accounting","Form 1120 / Form 1125-A","Classification review","high"], ["bad-debt","Bad Debt Expense / Reserve","mandatory","AR","Form 1120; Schedule M-1/M-3","Line 15","high"],
    ["depreciation-expense","Depreciation and Amortization Expense","conditional","Accounting","Form 4562; Form 1120","Line 20 / other lines","high","depreciationOrAmortization"], ["charitable","Charitable Contributions","mandatory","Accounting","Form 1120; Form 8283","Line 19","high"],
    ["nondeductible-expenses","Penalties, Fines, Club Dues and Gifts","mandatory","Accounting","Schedule M-1/M-3","Nondeductible adjustment","high"], ["misc-expense","Miscellaneous Expense Detail","mandatory","Accounting","Form 1120","Line 26 statement","medium"],
  ],
  fixed_assets: [
    ["fixed-beginning","Beginning Fixed Assets and Tax Basis","conditional","Accounting","Form 4562","Basis rollforward","high","depreciationOrAmortization"], ["fixed-additions","Current-Year Fixed Asset Additions","conditional","Accounting","Form 4562","Current depreciation","high","depreciationOrAmortization"],
    ["fixed-disposals","Current-Year Disposals","conditional","Accounting","Form 4562; Form 4797","Basis and gain/loss","high","depreciationOrAmortization"], ["asset-detail","Acquisition Date, Cost and Asset Category","conditional","Accounting","Form 4562","Asset detail","high","depreciationOrAmortization"],
    ["book-method","Book Useful Life and Depreciation","conditional","Accounting","Schedule M-1/M-3","Book amount","medium","depreciationOrAmortization"], ["tax-method","Tax Method and Recovery Period","conditional","Tax Firm","Form 4562","MACRS / ADS","high","depreciationOrAmortization"],
    ["179-bonus","Section 179 and Bonus Depreciation","conditional","Tax Firm","Form 4562","Parts I and II","high","depreciationOrAmortization"], ["tax-depreciation","Tax Depreciation and Amortization Schedule","conditional","Tax Firm","Form 4562; Form 1120","Deduction allocation","high","depreciationOrAmortization"],
    ["accum-dep","Accumulated Depreciation","conditional","Accounting","Schedule L","Fixed asset contra account","medium","depreciationOrAmortization"],
  ],
  balance_sheet: [
    ["cash","Cash","mandatory","Treasury","Schedule L","Line 1","medium"], ["accounts-receivable","Accounts Receivable and Allowance","mandatory","AR","Schedule L","Lines 2a–2b","high"],
    ["inventory-bs","Inventory","conditional","Accounting","Schedule L; Form 1125-A","Line 3 / ending inventory","high","inventoryOrCogs"], ["prepaids","Prepaid Expenses","mandatory","Accounting","Schedule L","Other current assets","medium"],
    ["fixed-assets-bs","Fixed Assets and Accumulated Depreciation","conditional","Accounting","Schedule L","Lines 10a–10b","high","depreciationOrAmortization"], ["other-assets","Other Assets Detail","mandatory","Accounting","Schedule L","Lines 6–14","medium"],
    ["accounts-payable","Accounts Payable","mandatory","AP","Schedule L","Line 16","high"], ["accrued-expenses","Accrued Expenses","mandatory","Accounting","Schedule L; Schedule M-1/M-3","Other current liabilities","high"],
    ["loans","Loans and Debt","mandatory","Treasury","Schedule L; Form 8990","Lines 17–20","high"], ["related-balances","Related-Party Balances","conditional","Accounting","Schedule L; Form 5472","Loans / other assets and liabilities","high","relatedPartyTransactions"],
    ["other-liabilities","Other Liabilities","mandatory","Accounting","Schedule L","Lines 18–21","medium"], ["equity","Capital Stock, APIC and Retained Earnings","mandatory","Corporate HQ","Schedule L; Schedule M-2","Lines 22–25","high"],
  ],
  book_tax: [
    ["book-pretax-income","Book Pretax Income","mandatory","Accounting","Schedule M-1/M-3","Starting point","high"], ["federal-tax-expense","Federal Income Tax Expense","mandatory","Accounting","Schedule M-1/M-3","Permanent addition","high"],
    ["meals-adjustment","Nondeductible Meals / Entertainment","mandatory","Accounting","Schedule M-1/M-3","Permanent difference","high"], ["penalties-adjustment","Penalties and Fines","mandatory","Accounting","Schedule M-1/M-3","Permanent difference","high"],
    ["contribution-adjustment","Charitable Contribution Limitation / Carryforward","mandatory","Tax Firm","Schedule M-1/M-3; Form 1120","Limitation adjustment","high"], ["bad-debt-adjustment","Bad Debt Reserve","mandatory","AR","Schedule M-1/M-3","Temporary difference","high"],
    ["accrual-adjustment","Accrued Expense Tax Adjustments","mandatory","Accounting","Schedule M-1/M-3","Timing difference","high"], ["depreciation-adjustment","Book vs Tax Depreciation","conditional","Accounting","Schedule M-1/M-3; Form 4562","Temporary difference","high","depreciationOrAmortization"],
    ["inventory-adjustment-bt","Inventory Reserve / Valuation Adjustment","conditional","Accounting","Schedule M-1/M-3","Temporary difference","high","inventoryOrCogs"], ["unrealized-adjustment","Unrealized Gain / Loss","mandatory","Accounting","Schedule M-1/M-3","Recognition review","medium"],
    ["capital-loss-adjustment","Capital Loss Limitation","conditional","Tax Firm","Schedule D; Schedule M-1/M-3","Carryforward","high","capitalAssetTransactions"], ["state-tax-adjustment","State Income Tax","mandatory","Accounting","Form 1120; Schedule M-1/M-3","Deduction / provision difference","medium"],
    ["other-permanent","Other Permanent Differences","mandatory","Tax Firm","Schedule M-1/M-3","Other permanent items","medium"], ["other-temporary","Other Temporary Differences","mandatory","Tax Firm","Schedule M-1/M-3","Other timing items","medium"],
  ],
  related_parties: [
    ["direct-parent","Direct and Ultimate Parent","conditional","Corporate HQ","Schedule G; Form 5472","Ownership","high","foreignOwnership25"], ["parent-country","Parent Country and Ownership Percentage","conditional","Corporate HQ","Form 5472","Parts II/III","high","foreignOwnership25"],
    ["related-party-master","Related-Party Master List","conditional","Corporate HQ","Form 5472; international forms","Reportable parties","high","relatedPartyTransactions"], ["intercompany-ar-ap","Intercompany AR / AP","conditional","Accounting","Form 5472; Schedule L","Balance disclosures","high","relatedPartyTransactions"],
    ["intercompany-trade","Intercompany Purchases and Sales","conditional","AP","Form 5472; Form 1125-A; Form 1120","Transaction categories","high","relatedPartyTransactions"], ["intercompany-services","Service and Management Fees","conditional","AP","Form 5472","Services paid/received","high","relatedPartyTransactions"],
    ["intercompany-interest","Interest and Loans","conditional","Treasury","Form 5472; Form 8990","Borrowing/lending","high","relatedPartyTransactions"], ["capital-dividends","Capital Contributions and Dividends","conditional","Corporate HQ","Form 5472; Schedule C/M-2","Capital transactions","high","relatedPartyTransactions"],
    ["royalties-reimbursements","Royalties and Reimbursements","conditional","Accounting","Form 5472","Other transactions","high","relatedPartyTransactions"], ["transfer-pricing","Transfer-Pricing Support","conditional","Tax Firm","Form 5472; tax workpapers","Pricing support","high","relatedPartyTransactions"],
  ],
  special_tax: [
    ["interest-limitation","Section 163(j) Interest Limitation","conditional","Tax Firm","Form 8990","Applicability and calculation","high","businessInterestExpense"], ["nol","Net Operating Loss","mandatory","Tax Firm","Form 1120","Line 29a / carryforward","high"],
    ["capital-loss","Capital Loss","conditional","Tax Firm","Schedule D","Limitation / carryforward","high","capitalAssetTransactions"], ["tax-credits","Tax Credits","conditional","Tax Firm","Form 3800 and credit forms","Schedule J","high","generalBusinessCredit"],
    ["foreign-taxes","Foreign Taxes","conditional","Tax Firm","Form 1118","Credit or deduction","high","foreignTaxCredit"], ["asset-disposals","Asset Disposals","conditional","Accounting","Form 4797; Schedule D","Gain/loss","high","businessPropertyDisposition"],
    ["stock-transactions","Stock Transactions","conditional","Corporate HQ","Schedule D; Schedule M-2","Capital/equity treatment","medium"], ["debt-forgiveness","Debt Forgiveness","conditional","Treasury","Form 1120; Form 982","Income / attribute reduction","high"],
    ["recoveries-settlements","Insurance Recoveries and Legal Settlements","conditional","Legal","Form 1120; Form 4797","Income and basis","high"], ["refunds-special","Tax, Customs and Tariff Refunds","conditional","Accounting","Form 1120; Form 1125-A","Tax benefit / classification","high"],
    ["research-174","R&D and Section 174","conditional","Tax Firm","Form 6765; Form 4562; M-1/M-3","Credit and capitalization","high","researchCredit"], ["depreciation-elections","Sections 179 and Bonus Depreciation","conditional","Tax Firm","Form 4562","Tax elections","high","depreciationOrAmortization"],
  ],
  documents: [
    ["doc-adjusted-tb","2025 Adjusted TB","mandatory","Accounting","Form 1120","Multiple","high"], ["doc-financials","Final Financial Statements","mandatory","Accounting","Form 1120; Schedule L/M-1","Multiple","high"],
    ["doc-fixed-assets","Fixed Asset and Tax Depreciation Schedule","conditional","Accounting","Form 4562","Depreciation","high","depreciationOrAmortization"], ["doc-inventory","Inventory Rollforward and Reconciliation","conditional","Accounting","Form 1125-A","COGS","high","inventoryOrCogs"],
    ["doc-related-party","Related-Party Transaction Detail","conditional","Accounting","Form 5472","Parts IV/V/VI","high","relatedPartyTransactions"], ["doc-ownership","Ownership Chart and Legal Records","conditional","Corporate HQ","Schedule G; Form 5472","Ownership","high","foreignOwnership25"],
    ["doc-payroll","Payroll and Officer Compensation Reports","mandatory","Payroll / HR","Form 1125-E; Form 1120","Compensation","high"], ["doc-debt","Debt and Interest Schedules","conditional","Treasury","Form 8990; Form 5472","Interest","high","businessInterestExpense"],
    ["doc-carryforward","Tax Carryforward Schedules","mandatory","Tax Firm","Form 1120 and supporting forms","Carryforwards","high"], ["doc-source-index","Document Source Index and File References","mandatory","Accounting","All forms","Audit trail","medium"],
  ],
};

const sourceDefaults: Record<PreparationCategoryId,string[]> = {
  company:["Prior-year Form 1120","IRS EIN letter","Corporate legal records"], prior:["Tax archive","Tax firm portal","Prior-year workpapers"],
  financials:["ERP / General Ledger","Final financial statements","Year-end close package"], revenue:["Adjusted TB","Sales ledger","General Ledger detail"],
  cogs:["Inventory subledger","Purchases GL","Physical inventory reconciliation"], expenses:["Adjusted TB","General Ledger detail","Vendor or payroll reports"],
  fixed_assets:["Fixed asset register","Tax depreciation workpaper","Capex support"], balance_sheet:["Adjusted TB","Balance sheet detail","Subledger reconciliation"],
  book_tax:["Tax provision workpaper","Adjusted TB","Tax firm workpapers"], related_parties:["Intercompany ledger","Ownership chart","Transfer-pricing records"],
  special_tax:["Tax workpapers","General Ledger detail","Legal or treasury records"], documents:["Accounting files","Tax firm portal","Corporate records"],
};

export const PREPARATION_ITEMS_2025: PreparationItemDefinition[] = PREPARATION_CATEGORIES_2025.flatMap(([category]) => seeds[category].map(([id,label,level,owner,formText,lines,risk,triggerFact]) => {
  const forms = formText.split(";").map(value => value.trim());
  return { id, category, label, level, owner, forms, lines, risk, triggerFact, suggestedSources:sourceDefaults[category],
    why:`Required to support ${formText} and independently verify the reporting treatment.`,
    guidance:`Confirm the reporting entity and 2025 tax year, tie the amount or fact to an identified source, and document any difference between book and tax treatment. Do not treat a blank as zero or assume a book amount is deductible.`,
    missingImpact:`The affected ${formText} amount, disclosure, or applicability conclusion cannot be independently verified.`,
    question:`Please provide or confirm the 2025 ${label.toLowerCase()} used for ${formText}, including the source, calculation, and any book-to-tax adjustment.`,
    professionalJudgment:["warehouse-expense","tariff-refunds","tax-refunds","recoveries-settlements","research-174"].includes(id),
  };
}));

export const createBlankPreparationItem = (): PreparationItemState => ({ status:"need_confirmation", value:"", source:"", bookAmount:null, taxAmount:null, adjustment:null, supportingDocument:"", reviewerNote:"", updatedAt:"" });
export const createDefaultPreparationReadinessState = (): PreparationReadinessState => ({ items:{} });
export const normalizePreparationReadinessState = (value?: Partial<PreparationReadinessState>): PreparationReadinessState => ({ items:value?.items ?? {} });

export function preparationRequirement(item: PreparationItemDefinition, facts: FederalFacts): "required"|"potential"|"optional"|"not_applicable" {
  if (item.level === "mandatory") return "required";
  if (item.level === "optional") return "optional";
  const fact = item.triggerFact ? facts[item.triggerFact] : "unknown";
  if (fact === "yes") return "required";
  if (fact === "no") return "not_applicable";
  return "potential";
}

export function readinessMetrics(state: PreparationReadinessState, facts: FederalFacts) {
  const untouched = Object.keys(state.items).length === 0;
  let earned=0, total=0; let criticalMissing=0, incomplete=0, needConfirmation=0, available=0;
  const rows = PREPARATION_ITEMS_2025.map(definition => {
    const requirement=preparationRequirement(definition,facts); const item=state.items[definition.id] ?? createBlankPreparationItem();
    const status=requirement === "not_applicable" ? "not_applicable" as const : item.status;
    const weight=definition.level === "mandatory" ? 3 : definition.level === "conditional" ? 2 : 1;
    if (requirement !== "not_applicable") { total+=weight; earned+=weight*({available:1,under_review:.65,incomplete:.4,need_confirmation:.2,missing:0,not_applicable:1}[status]); }
    if (status === "available") available++; if (status === "incomplete") incomplete++; if (status === "need_confirmation") needConfirmation++;
    if ((status === "missing" || status === "incomplete") && definition.risk === "high" && requirement === "required") criticalMissing++;
    return {definition,item,status,requirement,weight};
  });
  const score=untouched ? 0 : total ? Math.round(earned/total*100) : 0;
  const label=untouched ? "Not Started" : criticalMissing ? "Not Ready" : score >= 95 && needConfirmation === 0 ? "Ready for Tax Review" : score >= 85 ? "Ready for Tax Preparation" : score >= 65 ? "Ready with Exceptions" : score === 0 ? "Not Started" : "In Progress";
  return {rows,score,label,criticalMissing,incomplete,needConfirmation,available,totalItems:rows.filter(row=>row.requirement!=="not_applicable").length};
}

export const PREPARATION_FACT_LINKS: Array<{key:keyof FederalFacts;label:string;forms:string}> = [
  {key:"inventoryOrCogs",label:"Inventory / COGS",forms:"Form 1125-A"}, {key:"depreciationOrAmortization",label:"Fixed assets / tax depreciation",forms:"Form 4562"},
  {key:"officerCompensation",label:"Officer compensation",forms:"Form 1125-E"}, {key:"businessInterestExpense",label:"Business interest",forms:"Form 8990"},
  {key:"foreignOwnership25",label:"25% foreign-owned",forms:"Form 5472 / Schedule G"}, {key:"relatedPartyTransactions",label:"Related-party transactions",forms:"Form 5472"},
  {key:"foreignOperations",label:"Foreign operations",forms:"Schedule N / international forms"}, {key:"capitalAssetTransactions",label:"Capital transactions",forms:"Schedule D / Form 8949"},
] as const;

export const setTriFact = (facts:FederalFacts,key:keyof FederalFacts,value:TriState):FederalFacts => ({...facts,[key]:value});
