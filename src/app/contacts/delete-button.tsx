"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteContactButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (res.ok) startTransition(() => router.refresh());
    setConfirm(false);
  }

  return (
    <button
      type="button"
      onClick={() => (confirm ? handleDelete() : setConfirm(true))}
      onBlur={() => setConfirm(false)}
      disabled={pending}
      title={confirm ? `Click again to delete ${name}` : `Delete ${name}`}
      className="rounded-md p-1.5 transition-colors"
      style={{
        color: confirm ? "var(--critical)" : "var(--ink-4)",
        background: confirm ? "var(--critical-bg)" : "transparent",
        border: confirm ? "1px solid var(--critical-border)" : "1px solid transparent",
      }}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
