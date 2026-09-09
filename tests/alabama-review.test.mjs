import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType:"custom", configFile:false, root, resolve:{ alias:{ "@":root } }, server:{ middlewareMode:true, hmr:false } });
after(async()=>vite.close());

const rules = await vite.ssrLoadModule("/data/alabama-review/2025.ts");
const facts = (patch={}) => ({...rules.createDefaultAlabamaReviewState().facts,...patch});
const formRule = id => rules.ALABAMA_PACKAGE_RULES.find(rule=>rule.id===id);

test("Form 20C and CPT filing conclusions remain independent",()=>{
  const registered = facts({entityType:"c_corporation",federalReturnType:"1120",registeredQualified:"yes"});
  assert.equal(rules.evaluate20C(registered).label,"20C Expected");
  assert.equal(rules.evaluateCpt(registered).label,"CPT Review Required");

  const sCorp = facts({entityType:"s_corporation",federalReturnType:"1120_s",registeredQualified:"yes"});
  assert.equal(rules.evaluate20C(sCorp).label,"20C Not Expected");
  assert.equal(rules.evaluateCpt(sCorp).label,"CPT Not Expected");
});

test("Form 20C recognizes the TY2025 25% factor-presence alternative",()=>{
  const quarterSales = facts({entityType:"c_corporation",alabamaSales:25000,everywhereSales:100000});
  assert.equal(rules.evaluate20C(quarterSales).label,"20C Expected");
  const quarterProperty = facts({entityType:"c_corporation",alabamaProperty:20000,everywhereProperty:80000});
  assert.equal(rules.evaluate20C(quarterProperty).label,"20C Expected");
});

test("TY2025 CPT $100 exemption test controls the annual CPT conclusion",()=>{
  const exempt = facts({entityType:"c_corporation",cptCalculatedTax:100});
  assert.equal(rules.evaluateCpt(exempt).label,"CPT Not Expected");
  assert.equal(rules.packageStatus(formRule("cpt"),exempt,"not_expected","present"),"Requires Review");

  const taxable = facts({entityType:"c_corporation",cptCalculatedTax:101});
  assert.equal(rules.evaluateCpt(taxable).label,"CPT Expected");
});

test("multistate corporations trigger Schedule D-1 without falsely missing an unindexed embedded schedule",()=>{
  const multistate = facts({entityType:"c_corporation",registeredQualified:"yes",multistate:"yes"});
  assert.equal(rules.packageStatus(formRule("schedule-d1"),multistate,"expected","unknown"),"Requires Review");
  assert.equal(rules.packageStatus(formRule("schedule-d1"),multistate,"expected","absent"),"Missing");
  assert.equal(rules.packageStatus(formRule("schedule-d1"),multistate,"expected","present"),"Required");
});

test("Schedule G is not expected outside a Financial Institution Group",()=>{
  const nonFig = facts({entityType:"c_corporation",cptCalculatedTax:500,financialInstitutionGroup:"no"});
  assert.equal(rules.packageStatus(formRule("schedule-g"),nonFig,"expected","unknown"),"Not Applicable");
  assert.equal(rules.packageStatus(formRule("schedule-g"),nonFig,"expected","present"),"Unexpected");
});
