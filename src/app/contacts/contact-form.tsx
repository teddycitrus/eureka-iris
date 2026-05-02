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
    setName("");
    setRole("");
    setPhone("+1");
    setEmail("");
    setEscalation(1);
    setReceiveCalls(true);
    setSupplierIds([]);
    setError(null);
    setDone(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\+\d{6,15}$/.test(phone)) {
      setError("phone must be E.164 (e.g. +14155551234)");
      return;
    }

    const body = {
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim() ? email.trim() : undefined,
      escalation,
      receiveCalls,
      supplierIds,
    };

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: unknown };
      setError(typeof data.error === "string" ? data.error : "create failed");
      return;
    }

    setDone(true);
    startTransition(() => router.refresh());
    setTimeout(() => {
      reset();
      setOpen(false);
    }, 800);
  }

  function toggleSupplier(id: string) {
    setSupplierIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-iris-500 px-3.5 py-2 text-sm font-medium text-white shadow-glow hover:bg-iris-400"
      >
        <UserPlus className="h-4 w-4" />
        New contact
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => !pending && setOpen(false)}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="glass w-full max-w-lg rounded-2xl p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg text-ink">New contact</h3>
            <p className="text-xs text-ink-muted">
              Iris will dial this person when alerts ≥ high hit a mapped supplier.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-ink-dim hover:bg-bg-hover hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="Name" required>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Priya Anand"
              className={inputClass}
            />
          </Field>
          <Field label="Role" required>
            <input
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="VP Operations"
              className={inputClass}
            />
          </Field>
          <Field label="Phone (E.164)" required hint="include country code, no spaces">
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+14155551234"
              className={cn(inputClass, "font-mono")}
            />
          </Field>
          <Field label="Email" hint="optional">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@company.com"
              className={inputClass}
            />
          </Field>
          <Field label="Escalation tier" hint="1 = first responder">
            <select
              value={escalation}
              onChange={(e) => setEscalation(Number(e.target.value))}
              className={inputClass}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  L{n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Voice ops">
            <label className="flex h-9 items-center gap-2 rounded-lg border border-line bg-bg-raised/60 px-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={receiveCalls}
                onChange={(e) => setReceiveCalls(e.target.checked)}
                className="h-4 w-4 accent-iris-500"
              />
              dialable by Iris
            </label>
          </Field>
        </div>

        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-dim">
            assign suppliers
          </div>
          {suppliers.length === 0 ? (
            <p className="mt-2 text-xs text-ink-muted">
              No suppliers yet — add some in /suppliers first.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suppliers.map((s) => {
                const on = supplierIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSupplier(s.id)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs transition",
                      on
                        ? "border-iris-500/60 bg-iris-500/15 text-iris-100"
                        : "border-line bg-bg-raised/40 text-ink-muted hover:text-ink",
                    )}
                  >
                    {s.name}
                    <span className="ml-1 text-[10px] text-ink-dim">{s.country}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-risk-critical/15 px-3 py-2 text-xs text-risk-critical">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-line bg-bg-raised/60 px-3.5 py-2 text-sm text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || done}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium",
              done
                ? "bg-risk-low/20 text-risk-low ring-1 ring-risk-low/40"
                : "bg-iris-500 text-white shadow-glow hover:bg-iris-400 disabled:opacity-60",
            )}
          >
            {done ? <Check className="h-4 w-4" /> : pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {done ? "saved" : pending ? "saving…" : "Create contact"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-lg border border-line bg-bg-raised/60 px-3 text-sm text-ink placeholder:text-ink-dim focus:border-iris-500 focus:outline-none focus:ring-2 focus:ring-iris-500/30";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-ink-dim">
        {label}
        {required && <span className="ml-1 text-iris-300">*</span>}
        {hint && <span className="ml-2 normal-case tracking-normal text-ink-dim/70">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}
