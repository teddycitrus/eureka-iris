import { env } from "./env";
import { elevenLabsVoiceConfig } from "./elevenlabs";

/**
 * Thin wrapper around the Vapi REST API.
 * Iris places outbound calls by POSTing to /call/phone with an inline
 * assistant configured to read a supply-chain alert briefing and capture
 * the on-call manager's decision.
 */

const VAPI_BASE = "https://api.vapi.ai";

type VapiCallResponse = { id: string; status?: string };

export type AssistantBriefing = {
  alertId: string;
  contactName: string;
  supplierName: string;
  region: string;
  severity: string;
  headline: string;
  summary: string;
  recommendation: string;
};

/** Build the system prompt for the on-call voice agent. */
function buildSystemPrompt(b: AssistantBriefing): string {
  return [
    "You are Iris, an interactive supply-chain risk briefing agent calling on behalf of the operations team.",
    `You are calling ${b.contactName} about a ${b.severity.toUpperCase()} risk affecting ${b.supplierName} (${b.region}).`,
    "",
    "Conversation flow:",
    "1. Greet the contact briefly, identify yourself as Iris from the operations desk.",
    "2. Confirm you have ~60 seconds for an urgent supply-chain update — wait for acknowledgement.",
    "3. Read the briefing below (paraphrase concisely, do not list everything verbatim).",
    "4. Read the recommendation, then ask which decision they want to take:",
    "   (a) APPROVE the recommended action",
    "   (b) HOLD and reassess later",
    "   (c) ESCALATE to another stakeholder",
    "   (d) DISMISS as non-actionable",
    "5. If the contact wants to escalate, ask who to escalate to.",
    "6. Repeat back their decision in one sentence to confirm.",
    "7. Thank them and end the call.",
    "",
    "Always call the `record_decision` tool before saying goodbye, with the captured outcome.",
    "Be concise, professional, and human. Do not invent facts beyond the briefing.",
    "",
    "── BRIEFING ──",
    `Headline: ${b.headline}`,
    `Summary: ${b.summary}`,
    `Recommended action: ${b.recommendation}`,
  ].join("\n");
}

function buildAssistant(b: AssistantBriefing) {
  return {
    name: `iris-alert-${b.alertId}`,
    firstMessage: `Hi ${b.contactName}, this is Iris from the operations desk — do you have about a minute for an urgent supply-chain briefing on ${b.supplierName}?`,
    voice: elevenLabsVoiceConfig(),
    model: {
      provider: "google" as const,
      model: env.geminiModel(),
      temperature: 0.3,
      messages: [{ role: "system", content: buildSystemPrompt(b) }],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "record_decision",
            description:
              "Record the contact's decision on the alert and end the call after confirmation.",
            parameters: {
              type: "object",
              properties: {
                outcome: {
                  type: "string",
                  enum: ["approve", "hold", "escalate", "dismiss"],
                },
                escalateTo: {
                  type: "string",
                  description: "Name or role of person to escalate to (only when outcome=escalate).",
                },
                notes: { type: "string" },
              },
              required: ["outcome"],
            },
          },
        },
      ],
    },
    transcriber: { provider: "deepgram" as const, model: "nova-2", language: "en" },
    endCallFunctionEnabled: true,
    serverUrl: `${env.publicBaseUrl()}/api/calls/vapi-webhook`,
    serverUrlSecret: env.webhookSecret(),
    silenceTimeoutSeconds: 25,
    maxDurationSeconds: 300,
  };
}

/** Place an outbound voice call via Vapi (which dials through the imported Twilio number). */
export async function placeAlertCall(opts: {
  briefing: AssistantBriefing;
  toPhone: string;
  metadata?: Record<string, unknown>;
}): Promise<VapiCallResponse> {
  const assistant = buildAssistant(opts.briefing);
  const body: Record<string, unknown> = {
    phoneNumberId: env.vapiPhoneNumberId(),
    customer: { number: opts.toPhone, name: opts.briefing.contactName },
    metadata: { alertId: opts.briefing.alertId, ...opts.metadata },
  };
  const existingAssistantId = env.vapiAssistantId();
  if (existingAssistantId) {
    body.assistantId = existingAssistantId;
    body.assistantOverrides = {
      firstMessage: assistant.firstMessage,
      model: assistant.model,
      variableValues: {
        contactName: opts.briefing.contactName,
        supplierName: opts.briefing.supplierName,
        severity: opts.briefing.severity,
      },
    };
  } else {
    body.assistant = assistant;
  }

  const res = await fetch(`${VAPI_BASE}/call/phone`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.vapiKey()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi call create failed (${res.status}): ${text}`);
  }
  return (await res.json()) as VapiCallResponse;
}

export async function getVapiCall(callId: string) {
  const res = await fetch(`${VAPI_BASE}/call/${callId}`, {
    headers: { authorization: `Bearer ${env.vapiKey()}` },
  });
  if (!res.ok) throw new Error(`Vapi call lookup failed: ${res.status}`);
  return res.json();
}
