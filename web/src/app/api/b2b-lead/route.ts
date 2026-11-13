import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { b2bLeadSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 8 * 1024;

// IP yalnızca AÇIKÇA güvenilen proxy başlığından okunur. Varsayılan kapalıdır:
// aksi hâlde istemci her istekte farklı `cf-connecting-ip` gönderip limiti atlatır.
function clientKey(request: Request): string {
  if (process.env.TRUSTED_PROXY !== "true") return "client";

  const trusted =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return trusted || "client"; // başlık yoksa tek kova → bypass yok
}

// Gövdeyi akış olarak, kümülatif BAYT sayarak okur: content-length uydurulsa da
// (chunked istek), sınır aşıldığında okuma iptal edilir ve bellek şişmez.
async function readLimitedBody(request: Request, max: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

export async function POST(request: Request) {
  if (!checkRateLimit(clientKey(request), LIMIT, WINDOW_MS)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const raw = await readLimitedBody(request, MAX_BODY_BYTES);
  if (raw === null) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = b2bLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("b2b_leads")
    .insert({
      company: parsed.data.company,
      contact_name: parsed.data.contactName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      sector: parsed.data.sector,
      message: parsed.data.message ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
