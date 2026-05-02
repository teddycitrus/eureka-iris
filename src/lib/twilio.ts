import twilio from "twilio";
import { env } from "./env";

let _client: ReturnType<typeof twilio> | null = null;

export function twilioClient() {
  if (!_client) _client = twilio(env.twilioSid(), env.twilioToken());
  return _client;
}

/**
 * Direct Twilio dial (used as a fallback when Vapi isn't reachable).
 * In normal operation Vapi orchestrates the call and uses Twilio under the hood.
 */
export async function placeFallbackCall(opts: {
  to: string;
  twimlUrl: string;
}) {
  return twilioClient().calls.create({
    to: opts.to,
    from: env.twilioNumber(),
    url: opts.twimlUrl,
    method: "POST",
  });
}
