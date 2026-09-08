"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileQuestion,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import type { FederalFacts, TriState } from "@/data/federal-completeness/2025";
import {
  PREPARATION_CATEGORIES_2025,
  PREPARATION_FACT_LINKS,
  PREPARATION_ITEMS_2025,
  createBlankPreparationItem,
  preparationRequirement,
  readinessMetrics,
  type PreparationCategoryId,
  type PreparationItemDefinition,
  type PreparationItemState,
  type PreparationReadinessState,
  type PreparationStatus,
  type RequiredLevel,
} from "@/data/preparation-readiness/2025";

type AskPayload = {
  lineId: string;
  topic: string;
  question: string;
  background: string;
  priority: "low" | "medium" | "high";
};
type Props = {
  taxYear: number;
  company: string;
  state: PreparationReadinessState;
  facts: FederalFacts;
  onChange: (value: PreparationReadinessState) => void;
  onFactsChange: (facts: FederalFacts) => void;
  onOpenLine: (lineId: string) => void;
  onApplyAmount: (
    lineId: string,
    amount: number,
    label: string,
    source: string,
  ) => void;
  onAsk: (payload: AskPayload) => void;
};
type View = "overview" | PreparationCategoryId | "missing" | "questions";

const statusLabels: Record<PreparationStatus, string> = {
  available: "Available",
  missing: "Missing",
  incomplete: "Incomplete",
  need_confirmation: "Need Confirmation",
  not_applicable: "Not Applicable",
  under_review: "Under Review",
};
const levelLabels: Record<RequiredLevel, string> = {
  mandatory: "Mandatory",
  conditional: "Conditional",
  optional: "Optional",
};
const directAmountLines: Record<string, string> = {
  "gross-sales": "FED-1120-2025-P1-L1A",
  "sales-returns": "FED-1120-2025-P1-L1B",
  "interest-income": "FED-1120-2025-P1-L5",
  "rental-income": "FED-1120-2025-P1-L6",
  "misc-income": "FED-1120-2025-P1-L10",
  "beginning-inventory": "FED-1125A-2025-L1",
  purchases: "FED-1125A-2025-L2",
  "direct-labor": "FED-1125A-2025-L3",
  "freight-in": "FED-1125A-2025-L5",
  "duties-tariffs": "FED-1125A-2025-L5",
  "other-inventory-costs": "FED-1125A-2025-L5",
  "ending-inventory": "FED-1125A-2025-L7",
  "officer-comp": "FED-1125E-2025-L2",
  salaries: "FED-1120-2025-P1-L13",
  repairs: "FED-1120-2025-P1-L14",
  "bad-debt": "FED-1120-2025-P1-L15",
  rent: "FED-1120-2025-P1-L16",
  "taxes-licenses": "FED-1120-2025-P1-L17",
  "interest-expense": "FED-1120-2025-P1-L18",
  charitable: "FED-1120-2025-P1-L19",
  advertising: "FED-1120-2025-P1-L22",
  "misc-expense": "FED-1120-2025-P1-L26",
  "tax-depreciation": "FED-4562-2025-L22",
  "depreciation-expense": "FED-4562-2025-L22",
};
const lineFor = (item: PreparationItemDefinition) =>
  directAmountLines[item.id] ??
  (item.forms.some((form) => form.includes("1125-A"))
    ? "FED-1125A-2025-L1"
    : item.forms.some((form) => form.includes("1125-E"))
      ? "FED-1125E-2025-L2"
      : item.forms.some((form) => form.includes("4562"))
        ? "FED-4562-2025-L22"
        : item.forms.some((form) => form.includes("5472"))
          ? "FED-5472-2025-P1"
          : item.forms.some((form) => form.includes("8990"))
            ? "FED-8990-2025-L1"
            : item.forms.some((form) => form.includes("M-1"))
              ? "FED-1120-2025-M1-L1"
              : item.forms.some((form) => form.includes("Schedule L"))
                ? "FED-1120-2025-SL-L1"
                : "FED-1120-2025-P1-L1A");
const parseAmount = (value: string) =>
  value.trim() === "" ? null : Number(value.replace(/,/g, ""));
const fmt = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
const officialSourceFor = (item: PreparationItemDefinition) => {
  const forms = item.forms.join(" ");
  if (forms.includes("4562")) return { title: "IRS Instructions for Form 4562", url: "https://www.irs.gov/instructions/i4562" };
  if (forms.includes("5472")) return { title: "IRS Instructions for Form 5472", url: "https://www.irs.gov/instructions/i5472" };
  if (forms.includes("8990")) return { title: "IRS Instructions for Form 8990", url: "https://www.irs.gov/instructions/i8990" };
  if (forms.includes("1125-A")) return { title: "IRS About Form 1125-A", url: "https://www.irs.gov/forms-pubs/about-form-1125-a" };
  if (forms.includes("4797")) return { title: "IRS Instructions for Form 4797", url: "https://www.irs.gov/instructions/i4797" };
  return { title: "2025 Instructions for Form 1120", url: "https://www.irs.gov/pub/irs-pdf/i1120.pdf" };
};

export function PreparationReadiness({
  taxYear,
  company,
  state,
  facts,
  onChange,
  onFactsChange,
  onOpenLine,
  onApplyAmount,
  onAsk,
}: Props) {
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const metrics = useMemo(() => readinessMetrics(state, facts), [state, facts]);
  const update = (id: string, patch: Partial<PreparationItemState>) =>
    onChange({
      ...state,
      items: {
        ...state.items,
        [id]: {
          ...createBlankPreparationItem(),
          ...(state.items[id] ?? {}),
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  const visible = metrics.rows.filter((row) => {
    if (
      view !== "overview" &&
      view !== "missing" &&
      view !== "questions" &&
      row.definition.category !== view
    )
      return false;
    if (
      view === "missing" &&
      !(
        ["missing", "incomplete", "need_confirmation"].includes(row.status) &&
        row.requirement !== "not_applicable"
      )
    )
      return false;
    if (
      view === "questions" &&
      !(
        ["missing", "incomplete", "need_confirmation"].includes(row.status) &&
        row.requirement !== "not_applicable"
      )
    )
      return false;
    const hay =
      `${row.definition.label} ${row.definition.forms.join(" ")} ${row.definition.owner} ${row.definition.suggestedSources.join(" ")}`.toLowerCase();
    return (
      hay.includes(search.toLowerCase()) &&
      (!statusFilter || row.status === statusFilter) &&
      (!levelFilter || row.definition.level === levelFilter) &&
      (!ownerFilter || row.definition.owner === ownerFilter) &&
      (!formFilter ||
        row.definition.forms.some((form) =>
          form.toLowerCase().includes(formFilter.toLowerCase()),
        ))
    );
  });
  const categoryMetric = (id: PreparationCategoryId) => {
    const rows = metrics.rows.filter(
      (row) =>
        row.definition.category === id && row.requirement !== "not_applicable",
    );
    const done = rows.filter((row) => row.status === "available").length;
    return rows.length ? Math.round((done / rows.length) * 100) : 100;
  };
  const ask = (definition: PreparationItemDefinition) =>
    onAsk({
      lineId: lineFor(definition),
      topic: `Preparation · ${definition.label}`,
      question: definition.question,
      background: `Federal Tax Return Preparation Readiness\nRequired level: ${definition.level}\nAffected: ${definition.forms.join(", ")} · ${definition.lines}\nWhy required: ${definition.why}\nMissing impact: ${definition.missingImpact}`,
      priority: definition.risk,
    });
  const exportWorkbook = () => {
    const wb = XLSX.utils.book_new();
    const all = metrics.rows.map(
      ({ definition, item, status, requirement }) => ({
        Category: PREPARATION_CATEGORIES_2025.find(
          ([id]) => id === definition.category,
        )?.[1],
        Item: definition.label,
        Requirement: requirement,
        "Required Level": levelLabels[definition.level],
        Status: statusLabels[status],
        Value: item.value,
        "Book Amount": item.bookAmount,
        "Tax Amount": item.taxAmount,
        Adjustment: item.adjustment,
        Owner: definition.owner,
        Source: item.source || definition.suggestedSources.join("; "),
        "Supporting Document": item.supportingDocument,
        "Affected Form": definition.forms.join("; "),
        "Affected Line": definition.lines,
        Guidance: definition.guidance,
        "Missing Impact": definition.missingImpact,
        "Reviewer Note": item.reviewerNote,
      }),
    );
    const append = (name: string, rows: Record<string, unknown>[]) =>
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(rows.length ? rows : [{ Status: "No items" }]),
        name.slice(0, 31),
      );
    append("Preparation Summary", [
      {
        Company: company,
        "Tax Year": taxYear,
        "Entity Type": "C Corporation",
        "Federal Return": "Form 1120",
        "Readiness Score": `${metrics.score}%`,
        Status: metrics.label,
        "Critical Missing": metrics.criticalMissing,
        Incomplete: metrics.incomplete,
        "Need Confirmation": metrics.needConfirmation,
      },
    ]);
    const by = (category: PreparationCategoryId) =>
      all.filter(
        (_, index) => metrics.rows[index].definition.category === category,
      );
    append("Company Profile", by("company"));
    append("Financial Data Checklist", [...by("prior"), ...by("financials")]);
    append("Revenue", by("revenue"));
    append("COGS & Inventory", by("cogs"));
    append("Expenses", by("expenses"));
    append("Fixed Assets", by("fixed_assets"));
    append("Book-to-Tax", by("book_tax"));
    append("Balance Sheet", by("balance_sheet"));
    append("Related Parties", by("related_parties"));
    append("Special Tax Items", by("special_tax"));
    append(
      "Missing Data",
      all.filter(
        (_, index) =>
          ["missing", "incomplete", "need_confirmation"].includes(
            metrics.rows[index].status,
          ) && metrics.rows[index].requirement !== "not_applicable",
      ),
    );
    append(
      "Questions for Tax Firm",
      metrics.rows
        .filter(
          (row) =>
            ["missing", "incomplete", "need_confirmation"].includes(
              row.status,
            ) && row.requirement !== "not_applicable",
        )
        .map((row) => ({
          Topic: row.definition.label,
          Question: row.definition.question,
          "Related Form": row.definition.forms.join("; "),
          "Related Line": row.definition.lines,
          Reason: row.definition.missingImpact,
          Priority: row.definition.risk,
        })),
    );
    append("Supporting Document Index", by("documents"));
    XLSX.writeFile(
      wb,
      `${company.replace(/[^a-z0-9]+/gi, "_")}_${taxYear}_Federal_Preparation_Readiness.xlsx`,
    );
  };
  if (taxYear !== 2025)
    return (
      <main className="page preparation-page">
        <div className="state-caution">
          <AlertTriangle />
          <span>
            <strong>No approved preparation database for {taxYear}.</strong>
            <br />A separate tax-year rule set is required.
          </span>
        </div>
      </main>
    );
  return (
    <main className="page preparation-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            FEDERAL TAX RETURN PREPARATION READINESS · {taxYear}
          </p>
          <h1>联邦企业所得税申报准备度检查</h1>
          <p>
            {company} · Company facts → required data → workpapers → applicable
            forms → review.
          </p>
        </div>
        <Button onClick={exportWorkbook}>
          <Download />
          Export Preparation Workpaper
        </Button>
      </div>
      <section className="preparation-hero">
        <div>
          <span>PREPARATION READINESS</span>
          <strong>{metrics.score}% Ready</strong>
          <Progress value={metrics.score} />
          <small>{metrics.label} · C Corporation · Form 1120</small>
        </div>
        <article className={metrics.criticalMissing ? "attention" : ""}>
          <span>Critical Missing</span>
          <strong>{metrics.criticalMissing}</strong>
          <small>High-risk required items</small>
        </article>
        <article>
          <span>Need Confirmation</span>
          <strong>{metrics.needConfirmation}</strong>
          <small>Facts or data still unresolved</small>
        </article>
        <article>
          <span>Last Updated</span>
          <strong>{new Date().toLocaleDateString()}</strong>
          <small>Saved automatically in this browser</small>
        </article>
      </section>
      <div className="preparation-layout">
        <aside className="preparation-nav">
          <button
            className={view === "overview" ? "active" : ""}
            onClick={() => setView("overview")}
          >
            <strong>Overview</strong>
            <small>
              {metrics.available} available · {metrics.totalItems} in scope
            </small>
          </button>
          {PREPARATION_CATEGORIES_2025.map(([id, en, zh]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => setView(id)}
            >
              <strong>{en}</strong>
              <small>
                {zh} · {categoryMetric(id)}%
              </small>
            </button>
          ))}
          <button
            className={view === "missing" ? "active alert" : ""}
            onClick={() => setView("missing")}
          >
            <strong>Missing Data</strong>
            <small>
              {metrics.criticalMissing} critical · {metrics.incomplete}{" "}
              incomplete
            </small>
          </button>
          <button
            className={view === "questions" ? "active" : ""}
            onClick={() => setView("questions")}
          >
            <strong>Questions</strong>
            <small>Generate for Tax Firm</small>
          </button>
        </aside>
        <div className="preparation-content">
          {view === "overview" && (
            <>
              <section className="preparation-panel">
                <div className="panel-head">
                  <div>
                    <span className="jurisdiction">
                      FORM APPLICABILITY LINK
                    </span>
                    <h2>Business facts shared with Federal Check</h2>
                    <p>
                      These answers update the existing Federal Form
                      Completeness module immediately.
                    </p>
                  </div>
                </div>
                <div className="fact-link-grid">
                  {PREPARATION_FACT_LINKS.map((link) => (
                    <label key={link.key}>
                      <span>
                        <strong>{link.label}</strong>
                        <small>Affects {link.forms}</small>
                      </span>
                      <NativeSelect
                        value={String(facts[link.key])}
                        onChange={(event) =>
                          onFactsChange({
                            ...facts,
                            [link.key]: event.target.value as TriState,
                          })
                        }
                      >
                        <NativeSelectOption value="unknown">
                          Unknown / Review
                        </NativeSelectOption>
                        <NativeSelectOption value="yes">Yes</NativeSelectOption>
                        <NativeSelectOption value="no">No</NativeSelectOption>
                      </NativeSelect>
                    </label>
                  ))}
                </div>
              </section>
              <section className="preparation-panel">
                <div className="panel-head">
                  <div>
                    <span className="jurisdiction">CATEGORY READINESS</span>
                    <h2>Preparation coverage</h2>
                  </div>
                </div>
                <div className="category-readiness">
                  {PREPARATION_CATEGORIES_2025.map(([id, en, zh]) => (
                    <button key={id} onClick={() => setView(id)}>
                      <span>
                        <strong>{en}</strong>
                        <small>{zh}</small>
                      </span>
                      <b>{categoryMetric(id)}%</b>
                      <Progress value={categoryMetric(id)} />
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          {view !== "overview" && (
            <>
              <div className="preparation-toolbar">
                <label>
                  <Search />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search item, form, owner, or source"
                  />
                </label>
                <NativeSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <NativeSelectOption value="">All statuses</NativeSelectOption>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <NativeSelectOption key={value} value={value}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                >
                  <NativeSelectOption value="">All levels</NativeSelectOption>
                  {Object.entries(levelLabels).map(([value, label]) => (
                    <NativeSelectOption key={value} value={value}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Input
                  value={formFilter}
                  onChange={(e) => setFormFilter(e.target.value)}
                  placeholder="Filter form"
                />
                <NativeSelect
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                >
                  <NativeSelectOption value="">All owners</NativeSelectOption>
                  {[
                    ...new Set(
                      PREPARATION_ITEMS_2025.map((item) => item.owner),
                    ),
                  ].map((owner) => (
                    <NativeSelectOption key={owner} value={owner}>
                      {owner}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              {view === "questions" ? (
                <section className="preparation-panel">
                  <div className="panel-head">
                    <div>
                      <span className="jurisdiction">
                        QUESTIONS FOR TAX FIRM
                      </span>
                      <h2>
                        Questions generated from unresolved preparation items
                      </h2>
                    </div>
                  </div>
                  <div className="preparation-question-list">
                    {visible.map((row) => (
                      <article key={row.definition.id}>
                        <span
                          className={`readiness-risk ${row.definition.risk}`}
                        >
                          {row.definition.risk}
                        </span>
                        <div>
                          <strong>{row.definition.label}</strong>
                          <p>{row.definition.question}</p>
                          <small>
                            {row.definition.forms.join(" · ")} ·{" "}
                            {row.definition.lines}
                          </small>
                        </div>
                        <Button onClick={() => ask(row.definition)}>
                          <FileQuestion />
                          Add to Questions
                        </Button>
                      </article>
                    ))}
                  </div>
                </section>
              ) : (
                <section className="preparation-panel">
                  <div className="panel-head">
                    <div>
                      <span className="jurisdiction">
                        {view === "missing"
                          ? "MISSING DATA GUIDANCE"
                          : PREPARATION_CATEGORIES_2025.find(
                              ([id]) => id === view,
                            )?.[1].toUpperCase()}
                      </span>
                      <h2>
                        {view === "missing"
                          ? "Missing, incomplete, and unconfirmed items"
                          : PREPARATION_CATEGORIES_2025.find(
                              ([id]) => id === view,
                            )?.[2]}
                      </h2>
                      <p>{visible.length} checklist items shown</p>
                    </div>
                  </div>
                  <div className="preparation-items">
                    {visible.map(
                      ({ definition, item, status, requirement }) => (
                        <article
                          key={definition.id}
                          className={`prep-${status}`}
                        >
                          <header>
                            <div>
                              <span>
                                {levelLabels[definition.level]} ·{" "}
                                {requirement.replace("_", " ")} ·{" "}
                                {definition.owner}
                              </span>
                              <h3>{definition.label}</h3>
                              <small>
                                {definition.forms.join(" · ")} ·{" "}
                                {definition.lines}
                              </small>
                            </div>
                            <NativeSelect
                              value={status}
                              disabled={requirement === "not_applicable"}
                              onChange={(e) =>
                                update(definition.id, {
                                  status: e.target.value as PreparationStatus,
                                })
                              }
                            >
                              {Object.entries(statusLabels).map(
                                ([value, label]) => (
                                  <NativeSelectOption key={value} value={value}>
                                    {label}
                                  </NativeSelectOption>
                                ),
                              )}
                            </NativeSelect>
                          </header>
                          <div className="prep-input-grid">
                            <label>
                              Value / factual answer
                              <Input
                                value={item.value}
                                onChange={(e) =>
                                  update(definition.id, {
                                    value: e.target.value,
                                  })
                                }
                                placeholder="Enter value or description"
                              />
                            </label>
                            <label>
                              Book amount
                              <Input
                                value={item.bookAmount ?? ""}
                                onChange={(e) =>
                                  update(definition.id, {
                                    bookAmount: parseAmount(e.target.value),
                                  })
                                }
                                inputMode="decimal"
                                placeholder="0"
                              />
                            </label>
                            <label>
                              Tax amount
                              <Input
                                value={item.taxAmount ?? ""}
                                onChange={(e) =>
                                  update(definition.id, {
                                    taxAmount: parseAmount(e.target.value),
                                  })
                                }
                                inputMode="decimal"
                                placeholder="0"
                              />
                            </label>
                            <label>
                              Adjustment
                              <Input
                                value={
                                  item.adjustment ??
                                  (item.bookAmount !== null &&
                                  item.taxAmount !== null
                                    ? item.taxAmount - item.bookAmount
                                    : "")
                                }
                                onChange={(e) =>
                                  update(definition.id, {
                                    adjustment: parseAmount(e.target.value),
                                  })
                                }
                                inputMode="decimal"
                                placeholder="Tax − book"
                              />
                            </label>
                            <label>
                              Confirmed source
                              <Input
                                value={item.source}
                                onChange={(e) =>
                                  update(definition.id, {
                                    source: e.target.value,
                                  })
                                }
                                placeholder={definition.suggestedSources.join(
                                  " · ",
                                )}
                              />
                            </label>
                            <label>
                              Supporting document
                              <Input
                                value={item.supportingDocument}
                                onChange={(e) =>
                                  update(definition.id, {
                                    supportingDocument: e.target.value,
                                  })
                                }
                                placeholder="File name / reference"
                              />
                            </label>
                          </div>
                          <details>
                            <summary>
                              Data Source Guidance & official basis
                            </summary>
                            <div className="prep-guidance">
                              <p>
                                <strong>What / why:</strong> {definition.why}
                              </p>
                              <p>
                                <strong>Where to get it:</strong>{" "}
                                {definition.suggestedSources.join("; ")}
                              </p>
                              <p>
                                <strong>Used for:</strong>{" "}
                                {definition.forms.join("; ")} ·{" "}
                                {definition.lines}
                              </p>
                              <p>
                                <strong>If missing:</strong>{" "}
                                {definition.missingImpact}
                              </p>
                              <p>
                                <strong>How to review:</strong>{" "}
                                {definition.guidance}
                              </p>
                              {definition.triggerFact && (
                                <p>
                                  <strong>Trigger:</strong>{" "}
                                  {String(definition.triggerFact)} = Yes.
                                  Current result:{" "}
                                  {preparationRequirement(definition, facts)}.
                                </p>
                              )}
                              {definition.professionalJudgment && (
                                <p className="judgment">
                                  <AlertTriangle />
                                  Professional Judgment Required
                                </p>
                              )}
                              <footer>
                                <a
                                  href={officialSourceFor(definition).url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {officialSourceFor(definition).title}{" "}
                                  <ExternalLink />
                                </a>
                                <span>Last verified 2026-09-08</span>
                              </footer>
                            </div>
                          </details>
                          <Textarea
                            value={item.reviewerNote}
                            onChange={(e) =>
                              update(definition.id, {
                                reviewerNote: e.target.value,
                              })
                            }
                            placeholder="Reviewer note, difference explanation, or follow-up"
                          />
                          <div className="prep-actions">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => onOpenLine(lineFor(definition))}
                            >
                              Open affected return line
                            </Button>
                            {item.taxAmount !== null &&
                              directAmountLines[definition.id] && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() =>
                                    onApplyAmount(
                                      directAmountLines[definition.id],
                                      item.taxAmount!,
                                      definition.label,
                                      item.source || item.supportingDocument,
                                    )
                                  }
                                >
                                  Apply tax amount to return
                                </Button>
                              )}
                            {[
                              "missing",
                              "incomplete",
                              "need_confirmation",
                            ].includes(status) &&
                              requirement !== "not_applicable" && (
                                <Button
                                  size="xs"
                                  onClick={() => ask(definition)}
                                >
                                  <FileQuestion />
                                  Ask Tax Firm
                                </Button>
                              )}
                            <span>
                              {item.bookAmount !== null &&
                              item.taxAmount !== null
                                ? `Calculated difference ${fmt(item.taxAmount - item.bookAmount)}`
                                : "Book amount is not automatically the tax amount."}
                            </span>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
