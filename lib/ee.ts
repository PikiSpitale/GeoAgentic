/* eslint-disable @typescript-eslint/no-explicit-any */
// /lib/ee.ts
import "server-only";
import ee from "@google/earthengine";
console.log("[ee] module loaded"); // <- se imprime al importar el módulo

export const runtime = "nodejs"; // <- MUY IMPORTANTE (evita Edge)
export const dynamic = "force-dynamic"; // <- evita que Next lo haga estático

let eeReady: Promise<void> | null = null;

function getKey(): { client_email: string; private_key: string } {
  console.log("[env raw] EE_CLIENT_EMAIL:", process.env.EE_CLIENT_EMAIL);
  console.log("[env raw] EE_PRIVATE_KEY:", process.env.EE_PRIVATE_KEY);
  console.log("FOO:", process.env.FOO);
  const client_email = process.env.EE_CLIENT_EMAIL;
  const private_key = (process.env.EE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!client_email || !private_key) {
    throw new Error("Faltan EE_CLIENT_EMAIL o EE_PRIVATE_KEY");
  }
  return { client_email, private_key };
}

export function ensureEE(): Promise<void> {
  console.log("[ee] ensureEE called"); // <- ¿aparece?
  if (!eeReady) {
    console.log("[ee] initializing EE...");
    const key = getKey();
    eeReady = new Promise<void>((resolve, reject) => {
      ee.data.authenticateViaPrivateKey(
        key as any,
        () =>
          ee.initialize(
            null,
            null,
            () => {
              console.log("[ee] initialized");
              resolve();
            },
            (e: string) => {
              console.error("[ee] init error:", e);
              reject(new Error(e));
            }
          ),
        (e: string) => {
          console.error("[ee] auth error:", e);
          reject(new Error(e));
        }
      );
    });
  } else {
    console.log("[ee] reusing EE promise");
  }
  return eeReady;
}

export { ee };
