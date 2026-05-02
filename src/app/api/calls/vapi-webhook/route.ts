import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Vapi posts assistant lifecycle events here:
 *   - status-update      (queued → ringing → in-progress → ended)
 *   - function-call      (when the assistant invokes record_decision)
 *   - end-of-call-report (final transcript + summary)
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-vapi-secret") ?? req.headers.get("authorization") ?? "";
  const expected = env.webhookSecret();
  if (expected && !secret.includes(expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as VapiServerMessage;
  const message = payload?.message ?? (payload as unknown as VapiInnerMessage);
  if (!message) return NextResponse.json({ ok: true });

  const vapiCallId = message.call?.id;
  if (!vapiCallId) return NextResponse.json({ ok: true });

  const call = await db.call.findFirst({ where: { vapiCallId } });
  if (!call) return NextResponse.json({ ok: true, note: "unknown call" });

  switch (message.type) {
    case "status-update":
      await db.call.update({
        where: { id: call.id },
        data: { status: message.status ?? call.status },
      });
      break;

    case "function-call": {
      const fn = message.functionCall;
      if (fn?.name === "record_decision") {
        const args = (fn.parameters ?? fn.arguments ?? {}) as {
          outcome?: string;
          escalateTo?: string;
          notes?: string;
        };
        const decision = args.outcome ?? "unknown";
        await db.call.update({
          where: { id: call.id },
          data: { outcome: decision },
        });
        await db.alert.update({
          where: { id: call.alertId },
          data: {
            status:
              decision === "approve"
                ? "resolved"
                : decision === "escalate"
                  ? "escalated"
                  : decision === "dismiss"
                    ? "dismissed"
                    : "pending",
            decision: [decision, args.notes].filter(Boolean).join(" — "),
            decisionMaker: args.escalateTo,
          },
        });
      }
      // Tools must return a value — Vapi will speak the `result` text.
      return NextResponse.json({
        result: "Decision recorded. Thanks — ending the call now.",
      });
    }

    case "end-of-call-report": {
      const transcript =
        message.transcript ??
        message.artifact?.transcript ??
        (Array.isArray(message.messages)
          ? message.messages.map((m) => `${m.role}: ${m.message}`).join("\n")
          : null);
      await db.call.update({
        where: { id: call.id },
        data: {
          status: "completed",
          transcript: transcript ?? null,
          durationSec: message.durationSeconds ?? null,
          endedAt: new Date(),
        },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ ok: true });
}

// ── Loose typing for the Vapi event envelope ──────────────────────
type VapiInnerMessage = {
  type: string;
  call?: { id: string };
  status?: string;
  functionCall?: {
    name: string;
    parameters?: Record<string, unknown>;
    arguments?: Record<string, unknown>;
  };
  transcript?: string;
  durationSeconds?: number;
  artifact?: { transcript?: string };
  messages?: Array<{ role: string; message: string }>;
};
type VapiServerMessage = { message?: VapiInnerMessage };
