"use client";

import { useState } from "react";
import Link from "next/link";

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  seller_type: string;
  business_name: string;
  tax_number: string;
  website_or_social: string;
  product_category: string;
  product_description: string;
  estimated_product_count: string;
  kvkk_consent: boolean;
  website_url_hp: string; // honeypot
};

const initial: FormState = {
  full_name: "",
  email: "",
  phone: "",
  city: "",
  seller_type: "",
  business_name: "",
  tax_number: "",
  website_or_social: "",
  product_category: "",
  product_description: "",
  estimated_product_count: "",
  kvkk_consent: false,
  website_url_hp: "",
};

const STEPS = ["Kişisel bilgiler", "İşletme", "Ürünler", "Onay"];

const SELLER_TYPES = [
  { value: "individual", label: "Bireysel üretici / satıcı" },
  { value: "sole_proprietor", label: "Şahıs işletmesi / esnaf" },
  { value: "company", label: "Şirket" },
  { value: "producer_coop", label: "Kooperatif / üretici birliği" },
];

const COUNTS = ["1-10", "11-50", "51-200", "200+"];

const inputCls =
  "mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-900";
const labelCls = "block text-sm font-medium text-neutral-800";
const errCls = "mt-1 text-xs text-red-600";

export default function SellerApplicationForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);

  const needsBusiness = form.seller_type !== "" && form.seller_type !== "individual";

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (form.full_name.trim().length < 2) e.full_name = "Ad soyad zorunlu.";
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Geçerli bir e-posta girin.";
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 13) e.phone = "Geçerli bir telefon girin.";
      if (form.city.trim().length < 2) e.city = "Şehir zorunlu.";
    }
    if (s === 1) {
      if (!form.seller_type) e.seller_type = "Satıcı tipini seçin.";
      if (needsBusiness && !form.business_name.trim()) e.business_name = "İşletme adı zorunlu.";
      if (form.tax_number && !/^(\d{10}|\d{11})$/.test(form.tax_number))
        e.tax_number = "Vergi no 10, TC kimlik no 11 haneli olmalı.";
    }
    if (s === 2) {
      if (form.product_category.trim().length < 2) e.product_category = "Kategori zorunlu.";
      if (form.product_description.trim().length < 20)
        e.product_description = "En az 20 karakterlik kısa bir tanıtım yazın.";
      if (!form.estimated_product_count) e.estimated_product_count = "Bir aralık seçin.";
    }
    if (s === 3) {
      if (!form.kvkk_consent) e.kvkk_consent = "Devam etmek için onaylamalısınız.";
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => s + 1);
  }

  async function submit() {
    const e = validate(3);
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    setServerError("");
    try {
      const body = {
        ...form,
        business_name: form.business_name.trim() || null,
        tax_number: form.tax_number.trim() || null,
        website_or_social: form.website_or_social.trim() || null,
        website_url_hp: form.website_url_hp || null,
      };
      const res = await fetch("/api/v1/seller-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDone(true);
        return;
      }
      const data = await res.json().catch(() => null);
      if (res.status === 409) setServerError(data?.detail ?? "Bekleyen bir başvurunuz var.");
      else if (res.status === 422) setServerError("Girdiğiniz bilgilerde bir sorun var. Lütfen adımları kontrol edin.");
      else setServerError("Bir hata oluştu. Lütfen biraz sonra tekrar deneyin.");
    } catch {
      setServerError("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-neutral-200 p-10 text-center">
        <h2 className="text-2xl font-semibold">Başvurunuz alındı 🎉</h2>
        <p className="mt-4 text-neutral-600 leading-7">
          Başvurunuzu inceleyip <strong>{form.email}</strong> adresi üzerinden sizinle iletişime
          geçeceğiz.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-neutral-950 px-7 py-3.5 text-sm font-medium text-white"
        >
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Adım göstergesi */}
      <ol className="mb-10 flex items-center gap-2 text-xs font-medium">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-2">
            <span
              className={`h-1 rounded-full ${i <= step ? "bg-neutral-950" : "bg-neutral-200"}`}
            />
            <span className={i === step ? "text-neutral-950" : "text-neutral-400"}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="space-y-6">
        {step === 0 && (
          <>
            <div>
              <label className={labelCls}>Ad soyad</label>
              <input className={inputCls} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} autoComplete="name" />
              {errors.full_name && <p className={errCls}>{errors.full_name}</p>}
            </div>
            <div>
              <label className={labelCls}>E-posta</label>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
              {errors.email && <p className={errCls}>{errors.email}</p>}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Telefon</label>
                <input type="tel" className={inputCls} placeholder="05xx xxx xx xx" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
                {errors.phone && <p className={errCls}>{errors.phone}</p>}
              </div>
              <div>
                <label className={labelCls}>Şehir</label>
                <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level1" />
                {errors.city && <p className={errCls}>{errors.city}</p>}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className={labelCls}>Satıcı tipi</label>
              <div className="mt-2 grid gap-3">
                {SELLER_TYPES.map((t) => (
                  <label
                    key={t.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      form.seller_type === t.value ? "border-neutral-950 bg-neutral-50" : "border-neutral-300"
                    }`}
                  >
                    <input type="radio" name="seller_type" checked={form.seller_type === t.value} onChange={() => set("seller_type", t.value)} />
                    {t.label}
                  </label>
                ))}
              </div>
              {errors.seller_type && <p className={errCls}>{errors.seller_type}</p>}
            </div>
            {needsBusiness && (
              <div>
                <label className={labelCls}>İşletme / marka adı</label>
                <input className={inputCls} value={form.business_name} onChange={(e) => set("business_name", e.target.value)} />
                {errors.business_name && <p className={errCls}>{errors.business_name}</p>}
              </div>
            )}
            <div>
              <label className={labelCls}>Vergi no / TC kimlik no <span className="text-neutral-400">(opsiyonel)</span></label>
              <input inputMode="numeric" maxLength={11} className={inputCls} value={form.tax_number} onChange={(e) => set("tax_number", e.target.value.replace(/\D/g, ""))} />
              {errors.tax_number && <p className={errCls}>{errors.tax_number}</p>}
            </div>
            <div>
              <label className={labelCls}>Web sitesi veya sosyal medya <span className="text-neutral-400">(opsiyonel)</span></label>
              <input className={inputCls} placeholder="instagram.com/markaniz" value={form.website_or_social} onChange={(e) => set("website_or_social", e.target.value)} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className={labelCls}>Ürün kategorisi</label>
              <input className={inputCls} placeholder="Örn. El yapımı sabun, zeytinyağı, seramik" value={form.product_category} onChange={(e) => set("product_category", e.target.value)} />
              {errors.product_category && <p className={errCls}>{errors.product_category}</p>}
            </div>
            <div>
              <label className={labelCls}>Ürünlerinizi kısaca anlatın</label>
              <textarea rows={5} maxLength={2000} className={inputCls} value={form.product_description} onChange={(e) => set("product_description", e.target.value)} />
              <div className="mt-1 flex justify-between text-xs text-neutral-400">
                <span>{errors.product_description && <span className="text-red-600">{errors.product_description}</span>}</span>
                <span>{form.product_description.length}/2000</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Tahmini ürün sayısı</label>
              <div className="mt-2 flex flex-wrap gap-3">
                {COUNTS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => set("estimated_product_count", c)}
                    className={`rounded-full border px-5 py-2.5 text-sm transition ${
                      form.estimated_product_count === c ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 hover:bg-neutral-100"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {errors.estimated_product_count && <p className={errCls}>{errors.estimated_product_count}</p>}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="rounded-2xl bg-neutral-50 p-6 text-sm leading-7">
              <p><strong>{form.full_name}</strong> · {form.email} · {form.phone} · {form.city}</p>
              <p>{SELLER_TYPES.find((t) => t.value === form.seller_type)?.label}{form.business_name && ` · ${form.business_name}`}</p>
              <p>{form.product_category} · {form.estimated_product_count} ürün</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
              <input type="checkbox" className="mt-1" checked={form.kvkk_consent} onChange={(e) => set("kvkk_consent", e.target.checked)} />
              <span>
                <Link href="/kvkk" className="underline" target="_blank">KVKK aydınlatma metnini</Link> okudum ve kişisel verilerimin
                başvurum kapsamında işlenmesini kabul ediyorum.
              </span>
            </label>
            {errors.kvkk_consent && <p className={errCls}>{errors.kvkk_consent}</p>}
            {serverError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>}
          </>
        )}

        {/* Honeypot: ekranda görünmez */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          value={form.website_url_hp}
          onChange={(e) => set("website_url_hp", e.target.value)}
        />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0 || submitting}
          className="rounded-full border border-neutral-200 px-7 py-3.5 text-sm font-medium transition hover:bg-neutral-100 disabled:invisible"
        >
          Geri
        </button>
        {step < 3 ? (
          <button type="button" onClick={next} className="rounded-full bg-neutral-950 px-7 py-3.5 text-sm font-medium text-white">
            Devam
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting} className="rounded-full bg-neutral-950 px-7 py-3.5 text-sm font-medium text-white disabled:opacity-60">
            {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
          </button>
        )}
      </div>
    </div>
  );
}
