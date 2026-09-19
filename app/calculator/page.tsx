"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, BookOpen, Building2, Calculator, CheckCircle2,
  ExternalLink, FileCheck2, Info, Landmark, Loader2, MapPin,
  ReceiptIndianRupee, Scale, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JURISDICTIONS, SUIT_TYPES } from "@/lib/legal/catalogue";
import type { CalculationInput, CalculationResult, SuitType } from "@/lib/legal/types";

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string; title?: string; description: string; inputSchema: object;
        annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
        execute: (input: unknown) => unknown | Promise<unknown>;
      }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const stateGroups = {
  State: JURISDICTIONS.filter((item) => item.kind === "State"),
  "Union Territory": JURISDICTIONS.filter((item) => item.kind === "Union Territory"),
};

type FormState = {
  stateId: string; district: string; suitType: SuitType; primaryAmount: string;
  secondaryAmount: string; share: string; durationYears: string; premiumAmount: string;
  subtype: string; excluded: boolean; commercial: boolean; immovable: boolean; titleDenied: boolean;
  propertyLocation: string; defendantLocation: string; causeLocation: string; lowerLimit: string;
  propertyMethod: "market" | "permanent_revenue" | "temporary_revenue" | "profits_or_comparable";
  annualLandRevenue: string; priorYearNetProfits: string; comparableLandRevenue: string;
};

const initialForm: FormState = {
  stateId: "ka", district: "Bengaluru Urban", suitType: "money_recovery", primaryAmount: "500000",
  secondaryAmount: "", share: "50", durationYears: "", premiumAmount: "", subtype: "sale",
  excluded: false, commercial: false, immovable: false, titleDenied: false,
  propertyLocation: "", defendantLocation: "Bengaluru", causeLocation: "Bengaluru", lowerLimit: "",
  propertyMethod: "market", annualLandRevenue: "", priorYearNetProfits: "", comparableLandRevenue: "",
};

const amountField: Record<SuitType, { label: string; key: keyof CalculationInput; hint: string }> = {
  money_recovery: { label: "Amount claimed", key: "claimAmount", hint: "Total monetary relief claimed in the plaint" },
  damages: { label: "Damages claimed", key: "claimAmount", hint: "Compensation quantified in the plaint" },
  specific_performance: { label: "Contract consideration / premium", key: "considerationAmount", hint: "Depends on the contract type selected below" },
  declaration_only: { label: "Value placed on declaration", key: "reliefValue", hint: "Karnataka section 24(d) applies a ₹1,000 minimum" },
  declaration_consequential: { label: "Property market value", key: "propertyMarketValue", hint: "For declaration plus consequential injunction concerning immovable property" },
  injunction: { label: "Value placed on injunction", key: "reliefValue", hint: "If title to immovable property is in issue, enable that option below" },
  possession: { label: "Property market value", key: "propertyMarketValue", hint: "Actual market value; revenue-assessed land options are available below" },
  partition: { label: "Total property market value", key: "propertyMarketValue", hint: "The calculator applies the plaintiff's share" },
  landlord_tenant: { label: "Prior-year rent", key: "annualRent", hint: "Twelve months' rent" },
  accounts: { label: "Estimated amount due", key: "reliefValue", hint: "Subject to adjustment after accounts are taken" },
  mortgage: { label: "Principal secured / amount claimed", key: "securedAmount", hint: "Select recovery, redemption or foreclosure below" },
  administration: { label: "Estate value", key: "estateValue", hint: "Initial fee is fixed; further fee may arise after an order" },
  appeal: { label: "Subject matter in appeal", key: "lowerCourtSuitValue", hint: "Section 49 uses the subject matter of the appeal" },
  maintenance: { label: "Annual maintenance / payment", key: "claimAmount", hint: "Normally multiplied by five under section 22" },
  movable_property: { label: "Movable property market value", key: "claimAmount", hint: "Section 23 baseline" },
  easement: { label: "Value placed on easement relief", key: "reliefValue", hint: "Karnataka section 30 applies a ₹1,000 minimum" },
  preemption: { label: "Sale consideration", key: "claimAmount", hint: "The lower of consideration and market value is used" },
  cancellation: { label: "Decree / document / property value", key: "claimAmount", hint: "Value represented by the instrument to be cancelled" },
  mesne_profits: { label: "Mesne profits claimed", key: "claimAmount", hint: "Approximate amount sued for" },
  set_aside_attachment: { label: "Attached property market value", key: "claimAmount", hint: "Compared with the attachment amount below" },
  revenue_register: { label: "Fixed by statute", key: "reliefValue", hint: "Karnataka section 43 fee: ₹50" },
  public_matter: { label: "Fixed by statute", key: "reliefValue", hint: "Karnataka section 44 fee: ₹50" },
  other: { label: "Value placed on relief", key: "reliefValue", hint: "Karnataka section 47 fixed-fee bands" },
};

const numeric = (value: string) => {
  const parsed = Number(value.replace(/,/g, ""));
  return value.trim() && Number.isFinite(parsed) ? parsed : undefined;
};

function payloadFrom(form: FormState): CalculationInput {
  const field = amountField[form.suitType];
  const payload: CalculationInput = {
    stateId: form.stateId, district: form.district, suitType: form.suitType,
    secondaryAmount: numeric(form.secondaryAmount), durationYears: numeric(form.durationYears),
    premiumAmount: numeric(form.premiumAmount), reliefVariant: form.subtype,
    plaintiffSharePercent: numeric(form.share), excludedFromPossession: form.excluded,
    commercialDispute: form.commercial, titleDenied: form.titleDenied,
    immovableProperty: form.immovable || ["possession", "partition", "declaration_consequential"].includes(form.suitType),
    propertyLocation: form.propertyLocation, defendantLocation: form.defendantLocation,
    causeOfActionLocation: form.causeLocation, localLowerCourtLimit: numeric(form.lowerLimit),
    propertyValuationMethod: form.propertyMethod,
    annualLandRevenue: numeric(form.annualLandRevenue), priorYearNetProfits: numeric(form.priorYearNetProfits),
    comparableLandRevenue: numeric(form.comparableLandRevenue),
  };
  if (!["revenue_register", "public_matter"].includes(form.suitType)) {
    Object.assign(payload, { [field.key]: numeric(form.primaryAmount) });
  }
  if (form.suitType === "injunction" && payload.immovableProperty && form.titleDenied) {
    delete payload.reliefValue;
    payload.propertyMarketValue = numeric(form.primaryAmount);
  }
  return payload;
}

async function requestCalculation(payload: CalculationInput) {
  const response = await fetch("/api/calculate", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  const data = await response.json() as { ok: boolean; result?: CalculationResult; error?: string };
  if (!response.ok || !data.result) throw new Error(data.error || "Calculation failed.");
  return data.result;
}

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const field = amountField[form.suitType];
  const chosenState = useMemo(() => JURISDICTIONS.find((item) => item.id === form.stateId), [form.stateId]);
  const isKarnataka = form.stateId === "ka";
  const showProperty = ["possession", "partition", "declaration_consequential"].includes(form.suitType) || form.immovable;
  const showLandMethod = isKarnataka && showProperty && ["possession", "partition", "declaration_consequential", "injunction"].includes(form.suitType);
  const hidePrimary = ["revenue_register", "public_matter"].includes(form.suitType);

  const calculate = useCallback(async (nextForm = form) => {
    setLoading(true); setError("");
    try { setResult(await requestCalculation(payloadFrom(nextForm))); }
    catch (err) { setError(err instanceof Error ? err.message : "Calculation failed."); }
    finally { setLoading(false); }
  }, [form]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "calculate_suit_valuation", title: "Calculate suit valuation",
      description: "Run the deterministic India civil-suit valuation, Karnataka fee and jurisdiction engine used by the visible calculator.",
      inputSchema: { type: "object", additionalProperties: true, properties: { stateId: { type: "string" }, district: { type: "string" }, suitType: { type: "string" } }, required: ["stateId", "district", "suitType"] },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async (input) => requestCalculation(input as CalculationInput),
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((old) => ({ ...old, [key]: value }));
  const moneyInput = (key: keyof FormState, placeholder = "0") => <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">₹</span><Input inputMode="decimal" value={String(form[key])} onChange={(e) => update(key, e.target.value.replace(/[^0-9.]/g, "") as never)} placeholder={placeholder} className="h-11 pl-8 font-medium" /></div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#17212b]">
      <header className="border-b border-[#d8dee5] bg-[#0d2436] text-white">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg border border-white/20 bg-white/10"><Scale className="size-5 text-[#83d9c8]" /></div><div><p className="text-[15px] font-semibold tracking-wide">SuitVal India</p><p className="text-xs text-slate-300">Statutory calculation engine</p></div></div>
          <div className="hidden items-center gap-2 text-sm text-slate-300 sm:flex"><ShieldCheck className="size-4 text-[#83d9c8]" /> Karnataka verified · No AI arithmetic</div>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-4 py-5 lg:px-8 lg:py-7">
        <Tabs defaultValue="calculator" className="gap-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="mb-1 text-sm font-medium text-[#2b6f66]">Civil filing workspace</p><h1 className="text-2xl font-semibold tracking-[-0.03em] md:text-[30px]">Suit valuation, court fee & forum</h1><p className="mt-1 max-w-3xl text-sm text-slate-600">Karnataka rules are section-coded and fee-calculated. Other jurisdictions remain clearly marked as framework coverage.</p></div>
            <TabsList className="h-10 border border-[#d8dee5] bg-white p-1 shadow-sm"><TabsTrigger value="calculator" className="px-4"><Calculator /> Calculator</TabsTrigger><TabsTrigger value="coverage" className="px-4"><BookOpen /> Rules coverage</TabsTrigger></TabsList>
          </div>

          <TabsContent value="calculator">
            <div className="grid gap-5 xl:grid-cols-[220px_minmax(460px,1fr)_minmax(380px,0.82fr)]">
              <aside className="order-2 rounded-xl border border-[#d8dee5] bg-white p-4 xl:order-1 xl:min-h-[680px]">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Calculation path</p>
                {[{ icon: MapPin, title: "Forum", sub: chosenState?.name || "Choose location" }, { icon: FileCheck2, title: "Relief", sub: SUIT_TYPES.find((s) => s.id === form.suitType)?.label }, { icon: ReceiptIndianRupee, title: "Valuation", sub: field.label }, { icon: Landmark, title: "Jurisdiction", sub: form.district || "District required" }].map((step, index) => (
                  <div key={step.title} className="relative flex gap-3 pb-6 last:pb-0">{index < 3 && <span className="absolute left-[15px] top-8 h-[calc(100%-18px)] w-px bg-[#dfe5ea]" />}<span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-[#e8f5f1] text-[#22675e]"><step.icon className="size-4" /></span><div><p className="text-sm font-semibold">{index + 1}. {step.title}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{step.sub}</p></div></div>
                ))}
                <div className="mt-7 rounded-lg border border-[#cfe2dd] bg-[#f0f8f6] p-3 text-xs leading-5 text-[#315d57]"><Info className="mb-2 size-4" />The engine uses code-only formulas and returns the statutory section behind each step.</div>
              </aside>

              <section className="order-1 rounded-xl border border-[#d8dee5] bg-white shadow-[0_1px_2px_rgb(15_23_42/3%)] xl:order-2">
                <div className="border-b border-[#e2e7eb] px-5 py-4 md:px-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Case inputs</h2><p className="mt-0.5 text-sm text-slate-500">Amounts are in Indian rupees.</p></div>{isKarnataka && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Verified Karnataka rules</Badge>}</div></div>
                <div className="space-y-6 p-5 md:p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="State / Union Territory"><Select value={form.stateId} onValueChange={(value) => update("stateId", value)}><SelectTrigger className="h-11 w-full bg-white"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(stateGroups).map(([group, states]) => <div key={group}><p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}s</p>{states.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</div>)}</SelectContent></Select></Field>
                    <Field label="District / city"><Input value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="e.g. Bengaluru Urban" className="h-11" /></Field>
                  </div>
                  {!isKarnataka && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900"><AlertTriangle className="mr-2 inline size-4" />This jurisdiction currently provides framework valuation only; its fee schedule is not yet verified.</div>}
                  <Field label="Nature of suit"><Select value={form.suitType} onValueChange={(value) => setForm((old) => ({ ...old, suitType: value as SuitType, subtype: value === "mortgage" ? "recovery" : "sale", secondaryAmount: "" }))}><SelectTrigger className="h-11 w-full bg-white"><SelectValue /></SelectTrigger><SelectContent>{SUIT_TYPES.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></Field>

                  {!hidePrimary && <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={form.suitType === "injunction" && showProperty && form.titleDenied ? "Property market value" : field.label} hint={field.hint}>{moneyInput("primaryAmount")}</Field>
                    {form.suitType === "partition" ? <Field label="Plaintiff's share (%)" hint="Share claimed in the plaint"><Input inputMode="decimal" value={form.share} onChange={(e) => update("share", e.target.value.replace(/[^0-9.]/g, ""))} className="h-11" /></Field> : <SecondaryField form={form} update={update} moneyInput={moneyInput} />}
                  </div>}

                  {form.suitType === "specific_performance" && <Field label="Contract type"><Select value={form.subtype} onValueChange={(value) => update("subtype", value)}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sale">Sale</SelectItem><SelectItem value="mortgage">Mortgage</SelectItem><SelectItem value="lease">Lease</SelectItem><SelectItem value="exchange">Exchange</SelectItem></SelectContent></Select></Field>}
                  {form.suitType === "mortgage" && <Field label="Mortgage relief"><Select value={form.subtype} onValueChange={(value) => update("subtype", value)}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recovery">Recover mortgage money</SelectItem><SelectItem value="redemption">Redemption</SelectItem><SelectItem value="foreclosure">Foreclosure</SelectItem></SelectContent></Select></Field>}

                  <div className="grid gap-3 rounded-lg border border-[#dfe4e8] bg-[#f9fafb] p-4 sm:grid-cols-2">
                    <Toggle label="Commercial dispute" description="Test commercial-court routing" checked={form.commercial} onCheckedChange={(v) => update("commercial", v)} />
                    <Toggle label="Immovable property involved" description="Use property-location rule" checked={showProperty} disabled={["possession", "partition", "declaration_consequential"].includes(form.suitType)} onCheckedChange={(v) => update("immovable", v)} />
                    {form.suitType === "partition" && <Toggle label="Excluded from possession" description="Ad valorem fee instead of fixed fee" checked={form.excluded} onCheckedChange={(v) => update("excluded", v)} />}
                    {form.suitType === "injunction" && showProperty && <Toggle label="Title denied or in issue" description="Triggers Karnataka section 26(a)" checked={form.titleDenied} onCheckedChange={(v) => update("titleDenied", v)} />}
                  </div>

                  {showLandMethod && <div className="space-y-4 rounded-lg border border-[#d8e6e2] bg-[#f6fbfa] p-4"><Field label="Karnataka property valuation method"><Select value={form.propertyMethod} onValueChange={(value) => update("propertyMethod", value as FormState["propertyMethod"])}><SelectTrigger className="h-11 w-full bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="market">Market value — section 7(2)(d)</SelectItem><SelectItem value="permanent_revenue">Permanently settled revenue land — 25×</SelectItem><SelectItem value="temporary_revenue">Temporarily settled revenue land — 12.5×</SelectItem><SelectItem value="profits_or_comparable">No revenue / exempt — lower statutory formula</SelectItem></SelectContent></Select></Field>{["permanent_revenue", "temporary_revenue"].includes(form.propertyMethod) && <Field label="Annual land revenue">{moneyInput("annualLandRevenue")}</Field>}{form.propertyMethod === "profits_or_comparable" && <div className="grid gap-4 sm:grid-cols-2"><Field label="Previous-year net profits">{moneyInput("priorYearNetProfits")}</Field><Field label="Comparable land annual revenue">{moneyInput("comparableLandRevenue")}</Field></div>}</div>}

                  <div className="grid gap-4 sm:grid-cols-2">{showProperty ? <Field label="Property location"><Input value={form.propertyLocation} onChange={(e) => update("propertyLocation", e.target.value)} placeholder="District where property is situated" className="h-11" /></Field> : <Field label="Defendant location"><Input value={form.defendantLocation} onChange={(e) => update("defendantLocation", e.target.value)} placeholder="Residence or business location" className="h-11" /></Field>}{!showProperty && <Field label="Cause of action location"><Input value={form.causeLocation} onChange={(e) => update("causeLocation", e.target.value)} placeholder="Where cause arose" className="h-11" /></Field>}</div>
                  {error && <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div>}
                  <Button onClick={() => void calculate()} disabled={loading} className="h-11 w-full bg-[#176f63] text-base hover:bg-[#125d54]">{loading ? <><Loader2 className="animate-spin" /> Calculating</> : <>Calculate valuation & fee <ArrowRight /></>}</Button>
                </div>
              </section>

              <aside className="order-3 overflow-hidden rounded-xl border border-[#cfd8df] bg-[#102a3c] text-white shadow-[0_14px_40px_rgb(15_35_50/12%)]">
                <div className="border-b border-white/10 px-5 py-4 md:px-6"><div className="flex items-center justify-between"><h2 className="font-semibold">Calculation result</h2><Badge className="border-[#65bfaf]/30 bg-[#17493f] text-[#a9eee0]">Rule trace on</Badge></div></div>
                {result ? <ResultPanel result={result} /> : <div className="grid min-h-[520px] place-items-center p-8 text-center text-slate-300"><div><Calculator className="mx-auto mb-3 size-8" /><p>Complete the case inputs to calculate.</p></div></div>}
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="coverage">
            <section className="overflow-hidden rounded-xl border border-[#d8dee5] bg-white"><div className="flex flex-col justify-between gap-2 border-b border-[#e2e7eb] px-5 py-4 md:flex-row md:items-center md:px-6"><div><h2 className="font-semibold">India rules catalogue</h2><p className="mt-1 text-sm text-slate-500">Karnataka is fully fee-calculated for the listed civil reliefs. The remaining jurisdictions are selectable framework entries pending official-source implementation.</p></div><Badge variant="outline" className="w-fit">1 verified · 35 framework</Badge></div><div className="grid sm:grid-cols-2 xl:grid-cols-3">{JURISDICTIONS.map((item) => <div key={item.id} className="border-b border-r border-[#e5e9ed] p-4"><div className="mb-2 flex items-start justify-between gap-3"><p className="font-medium">{item.name}</p><span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${item.verification === "verified" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{item.verification}</span></div><p className="text-xs leading-5 text-slate-500">{item.act}</p>{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#176f63]">Official source <ExternalLink className="size-3" /></a>}</div>)}</div></section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function SecondaryField({ form, update, moneyInput }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; moneyInput: (key: keyof FormState, placeholder?: string) => React.ReactNode }) {
  if (form.suitType === "preemption") return <Field label="Property market value" hint="Used if lower than sale consideration">{moneyInput("secondaryAmount")}</Field>;
  if (form.suitType === "set_aside_attachment") return <Field label="Attachment amount" hint="Amount for which attachment was made">{moneyInput("secondaryAmount")}</Field>;
  if (form.suitType === "maintenance") return <Field label="Duration in years (optional)" hint="Only enter a term shorter than five years"><Input inputMode="decimal" value={form.durationYears} onChange={(e) => update("durationYears", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="5-year default" className="h-11" /></Field>;
  if (form.suitType === "landlord_tenant") return <Field label="Lease premium (if any)" hint="Added where section 41 requires it">{moneyInput("premiumAmount")}</Field>;
  if (form.suitType === "specific_performance" && form.subtype === "lease") return <Field label="Average annual rent">{moneyInput("secondaryAmount")}</Field>;
  if (form.suitType === "mortgage" && form.subtype === "redemption") return <Field label="Amount stated as due" hint="Compared with one-fourth of principal">{moneyInput("secondaryAmount")}</Field>;
  if (form.suitType === "appeal") return <Field label="First-instance fee for appealed subject" hint="Section 49 carries the same fee to the appeal">{moneyInput("secondaryAmount")}</Field>;
  return <Field label="Local lower-court limit (optional)" hint="Overrides the catalogue only when you have a verified notification">{moneyInput("lowerLimit", "Leave blank")}</Field>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <div className="space-y-2"><Label className="text-sm font-semibold text-[#263642]">{label}</Label>{children}{hint && <p className="text-xs leading-4 text-slate-500">{hint}</p>}</div>; }

function Toggle({ label, description, checked, disabled, onCheckedChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onCheckedChange: (value: boolean) => void }) { return <div className="flex items-center justify-between gap-3 rounded-md bg-white p-3"><div><p className="text-sm font-medium">{label}</p><p className="mt-0.5 text-xs text-slate-500">{description}</p></div><Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} aria-label={label} /></div>; }

function ResultPanel({ result }: { result: CalculationResult }) {
  return <div className="p-5 md:p-6"><div className="flex items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">Suit valuation</p>{result.state.verification === "verified" && <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-200">Verified rules</span>}</div><p className="mt-2 text-[34px] font-semibold tracking-[-0.04em] text-white">{money.format(result.suitValuation)}</p><p className="mt-1 text-sm text-slate-300">{result.suitTypeLabel} · {result.state.name}</p><div className="mt-5 grid grid-cols-2 gap-3"><ResultMetric label="Court-fee basis" value={result.courtFeeBasis === null ? "Fixed statutory fee" : money.format(result.courtFeeBasis)} /><ResultMetric label="Court fee payable" value={result.courtFeeStatus === "calculated" && result.courtFee !== null ? money.format(result.courtFee) : "Schedule sign-off needed"} warning={result.courtFeeStatus !== "calculated"} /></div><div className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#9fe6d8]"><Building2 className="size-4" /> Suggested forum</div><p className="text-sm leading-6 text-white">{result.court}</p></div><div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200"><MapPin className="size-4" /> Territorial basis</div><p className="text-sm leading-6 text-slate-300">{result.territorialBasis}</p></div>{result.commercialTrack && <div className="mt-3 rounded-lg border border-[#61b8a8]/20 bg-[#143f39] p-3 text-xs leading-5 text-[#b9eadf]">{result.commercialTrack}</div>}<div className="mt-6"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">How the code decided</p><div className="space-y-2">{result.ruleTrace.map((line, index) => <div key={`${line}-${index}`} className="flex gap-2 text-xs leading-5 text-slate-300"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#70cbbb]" /><span>{index === 0 ? <strong className="font-medium text-white">{line}</strong> : line}</span></div>)}</div></div>{result.legalSources.length > 0 && <div className="mt-6 border-t border-white/10 pt-4"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">Primary sources</p><div className="space-y-2">{result.legalSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-3 rounded-md bg-white/[0.05] p-3 text-xs text-slate-200 hover:bg-white/[0.09]"><span><strong className="block font-medium text-white">{source.title}</strong><span className="mt-1 block leading-4 text-slate-400">{source.note}</span></span><ExternalLink className="mt-0.5 size-3.5 shrink-0 text-[#83d9c8]" /></a>)}</div></div>}<div className="mt-6 border-t border-white/10 pt-4"><p className="flex items-center gap-2 text-xs font-semibold text-amber-200"><AlertTriangle className="size-3.5" /> Filing check required</p><div className="mt-2 space-y-1">{result.warnings.slice(0, 2).map((warning) => <p key={warning} className="text-xs leading-5 text-slate-400">{warning}</p>)}</div></div></div>;
}

function ResultMetric({ label, value, warning }: { label: string; value: string; warning?: boolean }) { return <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 text-sm font-semibold leading-5 ${warning ? "text-amber-200" : "text-white"}`}>{value}</p></div>; }
