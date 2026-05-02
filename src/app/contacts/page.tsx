import { db } from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { Phone, Mail, ShieldCheck, Building2 } from "lucide-react";
import { ContactForm } from "./contact-form";
import { DeleteContactButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const [contacts, suppliers] = await Promise.all([
    db.contact.findMany({
      include: { suppliers: { include: { supplier: true } } },
      orderBy: [{ escalation: "asc" }, { name: "asc" }],
    }),
    db.supplier.findMany({
      select: { id: true, name: true, country: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const reachable = contacts.filter((c) => c.receiveCalls).length;
  const escalation1 = contacts.filter((c) => c.escalation === 1).length;

  return (
    <div className="flex flex-col">
      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 p-6 pb-0 lg:grid-cols-4">
        <StatCard
          label="Contacts on call-tree"
          value={contacts.length}
          delta={contacts.length > 0 ? "total" : undefined}
          deltaDir="up"
        />
        <StatCard
          label="Voice-enabled"
          value={reachable}
          accent={
            reachable > 0 ? (
              <span
                className="font-mono text-[10.5px] rounded px-1.5 py-0.5"
                style={{
                  background: "var(--ok-bg)",
                  color: "var(--ok)",
                  border: "1px solid oklch(0.85 0.08 155)",
                }}
              >
                dialable
              </span>
            ) : undefined
          }
        />
        <StatCard label="First responders (L1)" value={escalation1} hint="escalation tier 1" />
        <StatCard label="Suppliers mapped" value={suppliers.length} hint="across contact tree" />
      </div>

      {/* ── Contacts table ──────────────────────────────────────── */}
      <div className="p-6 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              Call tree
            </h2>
            <p className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-3)" }}>
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""} · lower escalation = first
              to call
            </p>
          </div>
          <ContactForm suppliers={suppliers} />
        </div>

        {contacts.length === 0 ? (
          <div
            className="rounded-lg px-6 py-12 text-center text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--ink-3)",
            }}
          >
            No contacts yet — click{" "}
            <span style={{ color: "var(--iris)", fontWeight: 500 }}>New contact</span> to add one.
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            {/* Column headers */}
            <div
              className="grid px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]"
              style={{
                gridTemplateColumns: "44px 1fr 140px 1fr 160px 60px 80px 40px",
                borderBottom: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--ink-4)",
                gap: "12px",
              }}
            >
              <span />
              <span>Name</span>
              <span>Role</span>
              <span>Supplier</span>
              <span>Phone</span>
              <span>Tier</span>
              <span>Voice</span>
              <span />
            </div>

            {contacts.map((c, i) => {
              const initials = c.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("");

              return (
                <div
                  key={c.id}
                  className="row-hover grid items-center px-4 py-3"
                  style={{
                    gridTemplateColumns: "44px 1fr 140px 1fr 160px 60px 80px 40px",
                    gap: "12px",
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  {/* Avatar */}
                  <div className="relative w-8 h-8 shrink-0">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
                      style={{
                        background: "var(--surface-3)",
                        color: "var(--ink-2)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {initials}
                    </div>
                    <span
                      className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full"
                      style={{
                        background: c.receiveCalls ? "var(--ok)" : "var(--ink-4)",
                        border: "2px solid var(--surface)",
                      }}
                    />
                  </div>

                  {/* Name */}
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>
                      {c.name}
                    </div>
                    {c.email && (
                      <div
                        className="flex items-center gap-1 text-[11.5px] truncate"
                        style={{ color: "var(--ink-4)" }}
                      >
                        <Mail className="h-3 w-3 shrink-0" />
                        {c.email}
                      </div>
                    )}
                  </div>

                  {/* Role */}
                  <span className="text-[12.5px] truncate" style={{ color: "var(--ink-3)" }}>
                    {c.role}
                  </span>

                  {/* Supplier */}
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {c.suppliers.length === 0 ? (
                      <span className="text-[11px]" style={{ color: "var(--critical)" }}>
                        no suppliers
                      </span>
                    ) : (
                      c.suppliers.slice(0, 2).map((cs) => (
                        <span
                          key={cs.supplierId}
                          className="inline-flex items-center gap-0.5 font-mono text-[10.5px] rounded px-1.5 py-0.5 truncate"
                          style={{
                            border: "1px solid var(--border)",
                            background: "var(--surface-2)",
                            color: "var(--ink-3)",
                          }}
                        >
                          <Building2 className="h-2.5 w-2.5 shrink-0" />
                          {cs.supplier.name}
                        </span>
                      ))
                    )}
                    {c.suppliers.length > 2 && (
                      <span
                        className="text-[11px]"
                        style={{ color: "var(--ink-4)" }}
                      >
                        +{c.suppliers.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  <div
                    className="flex items-center gap-1.5 text-[11.5px]"
                    style={{ color: "var(--ink-3)" }}
                  >
                    <Phone className="h-3 w-3 shrink-0" style={{ color: "var(--iris)" }} />
                    <span className="font-mono truncate">{c.phone}</span>
                  </div>

                  {/* Tier */}
                  <span
                    className="font-mono text-[11px] rounded px-1.5 py-0.5 w-fit"
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--ink-3)",
                    }}
                  >
                    L{c.escalation}
                  </span>

                  {/* Voice */}
                  <div
                    className="flex items-center gap-1 text-[11.5px]"
                    style={{ color: c.receiveCalls ? "var(--ok)" : "var(--ink-4)" }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="text-[11px]">{c.receiveCalls ? "yes" : "no"}</span>
                  </div>

                  {/* Delete */}
                  <div>
                    <DeleteContactButton id={c.id} name={c.name} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
