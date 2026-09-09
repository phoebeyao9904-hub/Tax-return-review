export type StateTaxProfile = {
  code: string; name: string; taxRegime: string; rateDisplay: string; flatRate: number | null;
  nexusStandard: string; salesThreshold: number | null; formName: string;
  formStatus: "FULLY_CONFIGURED" | "KEY_LINES_VERIFIED" | "FORM_IDENTIFIED" | "NO_GENERAL_RETURN";
  apportionment: string; serviceSourcing: string; throwback: string; minimumTax: string | null;
  specialTax: string | null; officialName: string; officialUrl: string; keyLines: string[];
  verificationStatus: "VERIFIED_ANNUAL_INSTRUCTIONS" | "REFERENCE_REVIEWED";
};

const rows: Array<[string,string,string,string,number|null,string,string,string,string]> = [
  ["AL","Alabama","Corporate income tax","6.50%",.065,"Form 20C","Alabama Department of Revenue","https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f20c.pdf","阿拉巴马州"],
  ["AK","Alaska","Corporate income tax","0.00%–9.40%",null,"Form 6000","Alaska Department of Revenue","https://tax.alaska.gov/programs/programs/index.aspx?10001","阿拉斯加州"],
  ["AZ","Arizona","Corporate income tax","4.90%",.049,"Form 120","Arizona Department of Revenue","https://azdor.gov/business/corporate-income-tax","亚利桑那州"],
  ["AR","Arkansas","Corporate income tax","1.00%–4.30%",null,"Form AR1100CT","Arkansas DFA","https://www.dfa.arkansas.gov/wp-content/uploads/AR1100CT_CorporationIncomeTaxReturn_2025.pdf","阿肯色州"],
  ["CA","California","Corporate income / franchise tax","8.84%",.0884,"Form 100","California Franchise Tax Board","https://www.ftb.ca.gov/forms/2025/2025-100-booklet.html","加利福尼亚州"],
  ["CO","Colorado","Corporate income tax","4.40%",.044,"Form DR 0112","Colorado Department of Revenue","https://tax.colorado.gov/corporate-income-tax","科罗拉多州"],
  ["CT","Connecticut","Corporate tax plus surtax","7.50% + possible 10% liability surtax",null,"Form CT-1120","Connecticut DRS","https://portal.ct.gov/drs/corporation-tax/","康涅狄格州"],
  ["DE","Delaware","Income tax plus gross receipts tax","8.70% + Gross Receipts Tax",null,"Form 1100","Delaware Division of Revenue","https://revenue.delaware.gov/business-tax-forms/corporate-income-tax/","特拉华州"],
  ["DC","District of Columbia","Corporation franchise tax","8.25%",.0825,"Form D-20","DC Office of Tax and Revenue","https://otr.cfo.dc.gov/page/corporation-franchise-tax","哥伦比亚特区"],
  ["FL","Florida","Corporate income tax","5.50% after $50,000 exemption",null,"Form F-1120","Florida Department of Revenue","https://floridarevenue.com/taxes/taxesfees/Pages/corporate.aspx","佛罗里达州"],
  ["GA","Georgia","Corporate income tax","5.19%",.0519,"Form 600","Georgia Department of Revenue","https://dor.georgia.gov/document/document/2025-it611-corporate-income-tax-instruction-booklet/download","佐治亚州"],
  ["HI","Hawaii","Corporate income tax","4.40%–6.40%",null,"Form N-30","Hawaii Department of Taxation","https://tax.hawaii.gov/geninfo/a2_b2_7corpincome/","夏威夷州"],
  ["ID","Idaho","Corporate income tax","5.695%",.05695,"Form 41","Idaho State Tax Commission","https://tax.idaho.gov/taxes/income-tax/business-income/","爱达荷州"],
  ["IL","Illinois","Income and replacement tax","9.50% combined",.095,"Form IL-1120","Illinois Department of Revenue","https://tax.illinois.gov/research/taxinformation/income/corporate.html","伊利诺伊州"],
  ["IN","Indiana","Corporate income tax","4.90%",.049,"Form IT-20","Indiana Department of Revenue","https://www.in.gov/dor/tax-forms/corporate/current-corporatepartnership/","印第安纳州"],
  ["IA","Iowa","Corporate income tax","5.50%–7.10%",null,"Form IA 1120","Iowa Department of Revenue","https://revenue.iowa.gov/taxes/tax-guidance/business-income-tax/iowa-corporate-income-tax-rates","爱荷华州"],
  ["KS","Kansas","Corporate income tax","4.00% + 3.00% surtax over $50,000",null,"Form K-120","Kansas Department of Revenue","https://www.ksrevenue.gov/bustaxtypes.html","堪萨斯州"],
  ["KY","Kentucky","Corporate income / LLET","5.00%",.05,"Form 720","Kentucky Department of Revenue","https://revenue.ky.gov/Business/Corporation-Income-and-Limited-Liability-Entity-Tax/Pages/default.aspx","肯塔基州"],
  ["LA","Louisiana","Income and franchise tax","5.50%",.055,"Form CIFT-620","Louisiana Department of Revenue","https://revenue.louisiana.gov/CorporationIncomeAndFranchiseTax","路易斯安那州"],
  ["ME","Maine","Corporate income tax","3.50%–8.93%",null,"Form 1120ME","Maine Revenue Services","https://www.maine.gov/revenue/taxes/income-estate-tax/corporate-income-tax","缅因州"],
  ["MD","Maryland","Corporate income tax","8.25%",.0825,"Form 500","Comptroller of Maryland","https://www.marylandcomptroller.gov/businesses/corporate-income-tax/","马里兰州"],
  ["MA","Massachusetts","Corporate excise tax","8.00% + excise components",null,"Form 355","Massachusetts Department of Revenue","https://www.mass.gov/info-details/corporate-excise-tax","马萨诸塞州"],
  ["MI","Michigan","Corporate income tax","6.00%",.06,"Form 4891","Michigan Department of Treasury","https://www.michigan.gov/taxes/business-taxes/cit","密歇根州"],
  ["MN","Minnesota","Corporate franchise tax","9.80%",.098,"Form M4","Minnesota Department of Revenue","https://www.revenue.state.mn.us/corporate-franchise-tax","明尼苏达州"],
  ["MS","Mississippi","Income and franchise tax","0% / 4.00% / 5.00%",null,"Form 83-105","Mississippi Department of Revenue","https://www.dor.ms.gov/business/corporate-income-and-franchise-tax","密西西比州"],
  ["MO","Missouri","Corporate income tax","4.00%",.04,"Form MO-1120","Missouri Department of Revenue","https://dor.mo.gov/taxation/business/tax-types/corporation-income/","密苏里州"],
  ["MT","Montana","Corporate income tax","6.75%",.0675,"Form CIT","Montana Department of Revenue","https://mtrevenue.gov/taxes/corporate-income-tax/","蒙大拿州"],
  ["NE","Nebraska","Corporate income tax","5.20%",.052,"Form 1120N","Nebraska Department of Revenue","https://revenue.nebraska.gov/businesses/corporate-income-tax","内布拉斯加州"],
  ["NV","Nevada","Commerce Tax","Industry rates",null,"Commerce Tax Return","Nevada Department of Taxation","https://tax.nv.gov/tax-types/commerce-tax/","内华达州"],
  ["NH","New Hampshire","Business Profits / Enterprise Tax","7.50% BPT + BET",null,"Forms BET / NH-1120","New Hampshire DRA","https://www.revenue.nh.gov/taxes-glance/business-profits-tax","新罕布什尔州"],
  ["NJ","New Jersey","Corporation business tax","6.50%–9.00% + possible transit fee",null,"Form CBT-100","New Jersey Division of Taxation","https://www.nj.gov/treasury/taxation/cbt/","新泽西州"],
  ["NM","New Mexico","Corporate income / franchise tax","5.90%",.059,"Form CIT-1","New Mexico TRD","https://www.tax.newmexico.gov/businesses/corporate-income-franchise-tax/","新墨西哥州"],
  ["NY","New York","Corporate franchise tax","6.50% / 7.25% + possible MTA surcharge",null,"Form CT-3","New York Tax Department","https://www.tax.ny.gov/forms/current-forms/ct/ct3i.htm","纽约州"],
  ["NC","North Carolina","Income and franchise tax","2.25% + franchise tax",null,"Form CD-405","North Carolina DOR","https://www.ncdor.gov/taxes-forms/corporate-income-franchise-tax/corporate-income-and-franchise-tax-rates","北卡罗来纳州"],
  ["ND","North Dakota","Corporate income tax","1.41%–4.31%",null,"Form 40","North Dakota Tax Commissioner","https://www.tax.nd.gov/business/corporate-income-tax","北达科他州"],
  ["OH","Ohio","Commercial Activity Tax","CAT",null,"CAT Return","Ohio Department of Taxation","https://tax.ohio.gov/business/ohio-business-taxes/commercial-activity-tax","俄亥俄州"],
  ["OK","Oklahoma","Corporate income tax","4.00%",.04,"Form 512","Oklahoma Tax Commission","https://oklahoma.gov/tax/businesses/income-tax.html","俄克拉何马州"],
  ["OR","Oregon","Corporate excise tax plus CAT","6.60%–7.60% + CAT",null,"Form OR-20","Oregon Department of Revenue","https://www.oregon.gov/DOR/forms/FormsPubs/form-or-20-instructions_102-020-1_2025.pdf","俄勒冈州"],
  ["PA","Pennsylvania","Corporate net income tax","7.99%",.0799,"Form RCT-101","Pennsylvania Department of Revenue","https://www.pa.gov/agencies/revenue/resources/tax-rates/corporation-tax-rates","宾夕法尼亚州"],
  ["RI","Rhode Island","Corporate income tax","7.00%",.07,"Form RI-1120C","Rhode Island Division of Taxation","https://tax.ri.gov/help/corporate-tax","罗得岛州"],
  ["SC","South Carolina","Corporate income tax","5.00%",.05,"Form SC1120","South Carolina DOR","https://dor.sc.gov/tax/corporate","南卡罗来纳州"],
  ["SD","South Dakota","No general business income tax","None",null,"No general corporate return","South Dakota Department of Revenue","https://dor.sd.gov/businesses/taxes/","南达科他州"],
  ["TN","Tennessee","Excise and franchise tax","6.50% + franchise tax",null,"Form FAE170","Tennessee Department of Revenue","https://www.tn.gov/revenue/taxes/franchise---excise-tax.html","田纳西州"],
  ["TX","Texas","Franchise (margin) tax","Entity-specific rates",null,"Forms 05-158-A / 05-158-B","Texas Comptroller","https://comptroller.texas.gov/taxes/franchise/forms/2025-franchise.php","得克萨斯州"],
  ["UT","Utah","Corporate income / franchise tax","4.55%",.0455,"Form TC-20","Utah State Tax Commission","https://tax.utah.gov/corporate","犹他州"],
  ["VT","Vermont","Corporate income tax","6.00%–8.50%",null,"Form CO-411","Vermont Department of Taxes","https://tax.vermont.gov/business/corporate-income-tax","佛蒙特州"],
  ["VA","Virginia","Corporate income tax","6.00%",.06,"Form 500","Virginia Tax","https://www.tax.virginia.gov/corporation-income-tax","弗吉尼亚州"],
  ["WA","Washington","Business & Occupation Tax","Activity rates",null,"Combined Excise Tax Return","Washington Department of Revenue","https://dor.wa.gov/taxes-rates/business-occupation-tax","华盛顿州"],
  ["WV","West Virginia","Corporate net income tax","6.50%",.065,"Form CIT-120","West Virginia Tax Department","https://tax.wv.gov/Business/CorporateIncomeTax/Pages/CorporateIncomeTax.aspx","西弗吉尼亚州"],
  ["WI","Wisconsin","Corporate franchise / income tax","7.90%",.079,"Form 4","Wisconsin Department of Revenue","https://www.revenue.wi.gov/Pages/FAQS/ise-corp.aspx","威斯康星州"],
  ["WY","Wyoming","No general business income tax","None",null,"No general corporate return","Wyoming Department of Revenue","https://revenue.wyo.gov/","怀俄明州"]
];

const singleSales = new Set("AL AR CA CO CT DE DC GA ID IL IN IA KY LA ME MD MA MI MN MO MT NE NH NJ NY NC OR PA RI SC TN UT VT WV WI".split(" "));
const threeFactor = new Set("AK HI KS OK".split(" "));
const elective = new Set("AZ MS NM ND VA".split(" "));
const special = new Set("NV OH TX WA".split(" "));
const marketBenefit = new Set("AZ CA GA IN IA MI NV NJ OH RI UT WA WI".split(" "));
const costPerformance = new Set("AK AR DE FL KS MS ND SC VA".split(" "));
const throwback = new Set("AK AR CA CO DC HI ID IL KS MA MS MT NH NM ND OK OR UT VT WI".split(" "));
const exact = new Set("AL AR CA DC FL GA IL IN NJ NY OR TX".split(" "));
const minimum: Record<string,string> = { CA:"$800 minimum franchise tax",CT:"$250 minimum tax",DC:"$250 / $1,000 gross-receipts minimum",MA:"$456 minimum excise",NJ:"$500–$2,000 gross-receipts minimum",NY:"$25–$200,000 fixed-dollar minimum" };
const specialTax: Record<string,string> = { DE:"Gross Receipts Tax",NV:"Commerce Tax",OH:"Commercial Activity Tax (CAT)",OR:"Corporate Activity Tax (CAT)",TX:"Franchise (margin) tax",WA:"Business & Occupation Tax (B&O)" };
const threshold: Record<string,number> = { AL:675000,CO:500000,HI:100000,MA:500000,MI:350000,NY:1000000,OH:500000,PA:500000,TN:500000,TX:500000,WA:100000 };
const exactLines: Record<string,string[]> = {
  AL:["Form 20C Line 1 · federal taxable income","Form 20C Lines 2–5 · Alabama additions and subtractions","Schedule D-1 · apportionment factors","Form 20C Lines 17–18 · Alabama taxable income and tax","Form 20C Lines 19–22 · payments and balance"],
  AR:["AR1100CT Line 1 · federal taxable income","AR1100CT Lines 2–7 · Arkansas adjustments","Schedule A · apportionment","AR1100CT Lines 21–22 · Arkansas taxable income and tax","AR1100CT Lines 23–31 · credits, payments and balance"],
  CA:["Line 1 · income before state adjustments","Line 18 · California net income","Line 23 · corporation tax","Line 28 · tax after minimum-tax comparison","Line 32 · estimated payments"],
  DC:["Line 36 · DC taxable income","Line 37 · tax at 8.25%","Line 39 · DC gross receipts","Line 40 · net tax after minimum tax","Line 41 · payments and credits"],
  FL:["Line 1 · federal taxable income","Lines 2–5 · Florida adjustments","Line 10 · Florida net income","Line 11 · tax before credits","Lines 16–19 · payments and balance"],
  GA:["Schedule 1 Line 1 · federal taxable income","Schedule 1 Lines 2–4 · additions/subtractions","Schedule 6 · apportionment","Schedule 1 Line 9 · Georgia taxable income","Schedule 1 Line 10 · income tax"],
  IL:["Line 1 · federal taxable income","Lines 2–21 · state modifications","Lines 28–30 · sales factor","Line 35 · Illinois net income","Lines 40–48 · replacement tax, income tax and credits"],
  IN:["IT-20 Line 1 · federal taxable income","IT-20 Lines 2–11 · Indiana modifications","IT-20 Lines 12–15 · adjusted gross income tax","IT-20 Lines 22–25 · supplemental taxes","IT-20 Lines 26–48 · credits, payments and balance"],
  NJ:["Schedule A Part I Line 28 · federal taxable net income","Schedule A Part II · modifications","Schedule J · allocation factor","Schedule A Part III Line 4 · tax base","Page 1 Lines 6–10 · tax and payments"],
  NY:["Part 2 Line 1a · business income base tax","Part 2 Line 1b · capital base tax","Part 2 Line 1c · fixed-dollar minimum","Part 2 Line 2 · tax before credits","Part 2 Line 18 · prepayments"],
  OR:["Line 1 · federal starting income","Lines 2–6 · modifications and NOL","Line 8 · apportionment","Lines 9–14 · taxable income and tax","Lines 23–26 · payments and balance"],
  TX:["Form 05-158-A · total revenue","Form 05-158-A · taxable margin","Forms 05-158-A/B · apportionment","Form 05-158-B · tax before credits","Form 05-170 · tax due"]
};

function apportionmentFor(code:string) { if (singleSales.has(code)) return "Single sales factor"; if (threeFactor.has(code)) return "Equal three-factor"; if (code === "FL") return "Double-weighted sales"; if (elective.has(code)) return "Election / industry review required"; if (special.has(code)) return "Special-tax receipts situs"; if (["SD","WY"].includes(code)) return "Not applicable"; return "Annual review required"; }
function serviceFor(code:string) { if (marketBenefit.has(code)) return "Market-based (benefit)"; if (costPerformance.has(code)) return "Cost of performance"; if (special.has(code)) return "Special-tax sourcing"; if (["SD","WY"].includes(code)) return "Not applicable"; return "Market-based / state-specific"; }

export const STATE_TAX_PROFILES: StateTaxProfile[] = rows.map(([code,name,taxRegime,rateDisplay,flatRate,formName,officialName,officialUrl]) => ({
  code,name,taxRegime,rateDisplay,flatRate,formName,officialName,officialUrl,
  nexusStandard: ["SD","WY"].includes(code) ? "No general business tax" : threshold[code] ? "Bright-line / special threshold" : code === "CA" ? "Annually indexed" : "Facts and circumstances",
  salesThreshold: threshold[code] ?? null,
  formStatus: ["AL","AR","GA","IN"].includes(code) ? "FULLY_CONFIGURED" : ["SD","WY"].includes(code) ? "NO_GENERAL_RETURN" : exact.has(code) ? "KEY_LINES_VERIFIED" : "FORM_IDENTIFIED",
  apportionment: apportionmentFor(code), serviceSourcing: serviceFor(code), throwback: code === "AR" ? "Partial throwback" : throwback.has(code) ? "Throwback" : code === "ME" ? "Throwout" : "None / review",
  minimumTax: minimum[code] ?? null, specialTax: specialTax[code] ?? null, keyLines: exactLines[code] ?? [],
  verificationStatus: ["AL","AR","GA","IN"].includes(code) ? "VERIFIED_ANNUAL_INSTRUCTIONS" : "REFERENCE_REVIEWED"
}));
