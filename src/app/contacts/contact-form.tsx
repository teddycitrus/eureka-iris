"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Supplier = { id: string; name: string; country: string };

export function ContactForm({ suppliers }: { suppliers: Supplier[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("+1");
  const [email, setEmail] = useState("");
  const [escalation, setEscalation] = useState(1);
  const [receiveCalls, setReceiveCalls] = useState(true);
  const [supplierIds, setSupplierIds] = useState<string[]>([]);

  function reset() {
    setName(""); setRole(""); setPhone("+1"); setEmail("");
    setEscalation(1); setReceiveCalls(true); setSupplierIds([]);
    setError(null); setDone(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\+\d{6,15}$/.test(phone)) {
      setError("phone must be E.164 (e.g. +14155551234)");
      return;
    }
    const body = { name: name.trim(), role: role.trim(), phone: phone.trim(),
      email: email.trim() ? email.trim() : undefined, escalation, receiveCalls, supplierIds };
    const res = await fetch("/api/contacts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: unknown };
      setError(typeof data.error === "string" ? data.error : "create failed");
      return;
    }
    setDone(true);
    startTransition(() => router.refresh());
    setTimeout(() => { reset(); setOpen(false); }, 800);
  }

  function toggleSupplier(id: string) {
    setSupplierIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ background: "var(--ink)" }}
      >
        <UserPlus className="h-4 w-4" />
        New contact
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(28,25,23,0.4)", backdropFilter: "blur(4px)" }}
      onClick={() => !pending && setOpen(false)}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
              New contact
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
              Iris will dial this person when alerts ≥ high hit a mapped supplier.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 transition-colors"
            style={{ color: "var(--ink-4)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Priya Anand" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Role" required>
            <input required value={role} onChange={(e) => setRole(e.target.value)}
              placeholder="VP Operations" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Phone (E.164)" required hint="include country code">
            <input required value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+14155551234" className={cn(inputClass, "font-mono")} style={inputStyle} />
          </Field>
          <Field label="Email" hint="optional">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@company.com" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Escalation tier" hint="1 = first responder">
            <select value={escalation} onChange={(e) => setEscalation(Number(e.target.value))}
              className={inputClass} style={inputStyle}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>L{n}</option>)}
            </select>
          </Field>
          <Field label="Voice ops">
            <label className="flex h-9 items-center gap-2 rounded-md px-3 cursor-pointer"
              style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}>
              <input type="checkbox" checked={receiveCalls}
                onChange={(e) => setReceiveCalls(e.target.checked)}
                className="h-4 w-4" style={{ accentColor: "var(--iris)" }} />
              <span className="text-sm" style={{ color: "var(--ink-2)" }}>dialable by Iris</span>
            </label>
          </Field>
        </div>

        <div className="mt-4">
          <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--ink-4)" }}>
            Assign suppliers
          </div>
          {suppliers.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--ink-3)" }}>
              No suppliers yet — add some in /suppliers first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {suppliers.map((s) => {
                const on = supplierIds.includes(s.id);
                return (
                  <button key={s.id} type="button" onClick={() => toggleSupplier(s.id)}
                    className="rounded-md px-2 py-1 text-xs font-medium transition-colors"
                    style={{
                      border: `1px solid ${on ? "var(--iris-border)" : "var(--border)"}`,
                      background: on ? "var(--iris-bg)" : "var(--surface-2)",
                      color: on ? "var(--iris)" : "var(--ink-3)",
                    }}>
                    {s.name}
                    <span className="ml-1 text-[10px]" style={{ color: "var(--ink-4)" }}>{s.country}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-md px-3 py-2 text-xs" style={{
            background: "var(--critical-bg)", color: "var(--critical)",
            border: "1px solid var(--critical-border)",
          }}>
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)}
            className="rounded-md px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[color:var(--surface-2)]"
            style={{ border: "1px solid var(--border)", color: "var(--ink-2)" }}>
            Cancel
          </button>
          <button type="submit" disabled={pending || done}
            className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              background: done ? "var(--ok)" : "var(--ink)",
              color: "#fff",
            }}>
            {done ? <Check className="h-4 w-4" /> : pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {done ? "Saved" : pending ? "Saving…" : "Create contact"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass = "h-9 w-full rounded-md px-3 text-sm focus:outline-none";
const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--ink)",
};

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>
        {label}
        {required && <span className="ml-1" style={{ color: "var(--iris)" }}>*</span>}
        {hint && <span className="ml-1.5 normal-case tracking-normal" style={{ color: "var(--ink-4)", opacity: 0.7 }}>· {hint}</span>}
      </span>
      {children}
    </label>
  );
}
