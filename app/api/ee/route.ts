// app/api/ee/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { ensureEE } from "@/lib/ee";

console.log("[ee] module loaded");

export async function GET() {
  console.log("[ee] handler running");
  console.log("[env] EE_CLIENT_EMAIL:", process.env.EE_CLIENT_EMAIL);
  console.log(
    "[env] EE_PRIVATE_KEY starts:",
    process.env.EE_PRIVATE_KEY?.slice(0, 30)
  );
  console.log(
    "[env] EE_PRIVATE_KEY ends:",
    process.env.EE_PRIVATE_KEY?.slice(-30)
  );
  await ensureEE();
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
