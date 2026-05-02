"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
      className={cn(
        "rounded-lg p-1.5 transition",
        confirm
          ? "bg-risk-critical/20 text-risk-critical ring-1 ring-risk-critical/40"
          : "text-ink-dim hover:bg-bg-hover hover:text-risk-critical",
      )}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}
