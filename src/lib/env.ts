function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function opt(name: string): string {
  return process.env[name] ?? "";
}

export const env = {
  publicBaseUrl: () => process.env.PUBLIC_BASE_URL ?? "http://localhost:3000",
  webhookSecret: () => opt("WEBHOOK_SHARED_SECRET"),

  geminiKey: () => need("GEMINI_API_KEY"),
  geminiModel: () => process.env.GEMINI_MODEL ?? "gemini-2.5-flash",

  newsApiKey: () => opt("NEWSAPI_KEY"),

  twilioSid: () => need("TWILIO_ACCOUNT_SID"),
  twilioToken: () => need("TWILIO_AUTH_TOKEN"),
  twilioNumber: () => need("TWILIO_PHONE_NUMBER"),

  vapiKey: () => need("VAPI_API_KEY"),
  vapiPhoneNumberId: () => need("VAPI_PHONE_NUMBER_ID"),
  vapiAssistantId: () => opt("VAPI_ASSISTANT_ID"),

  elevenLabsKey: () => need("ELEVENLABS_API_KEY"),
  elevenLabsVoiceId: () => process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM",
  elevenLabsModel: () => process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5",
};

export type Env = typeof env;
