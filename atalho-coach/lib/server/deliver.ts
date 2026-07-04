// Entrega: serializa o IR e, se houver um servidor de assinatura configurado
// (Mac rodando signer/server.mjs), devolve o arquivo já assinado — instalável
// em 1 toque. Sem signer, entrega o plist não assinado + instruções.

import { irToPlist } from "@/lib/shortcuts/plist";
import type { ShortcutIR } from "@/lib/shortcuts/types";

export interface DeliveryPayload {
  name: string;
  fileName: string;
  fileBase64: string;
  signed: boolean;
  summary: string[];
  attempts?: number;
}

export async function deliver(ir: ShortcutIR, summary: string[]): Promise<DeliveryPayload> {
  const plist = irToPlist(ir);
  let bytes: Buffer = Buffer.from(plist, "utf8");
  let signed = false;

  const signerUrl = process.env.SIGNER_URL;
  if (signerUrl) {
    try {
      const res = await fetch(`${signerUrl.replace(/\/$/, "")}/sign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SIGNER_TOKEN ?? ""}`,
          "content-type": "application/octet-stream",
        },
        body: new Uint8Array(bytes),
        signal: AbortSignal.timeout(45_000),
      });
      if (res.ok) {
        bytes = Buffer.from(await res.arrayBuffer());
        signed = true;
      } else {
        console.error(`signer respondeu ${res.status}`);
      }
    } catch (err) {
      console.error("signer indisponível:", err);
    }
  }

  // O nome do arquivo vira o nome do atalho na importação — mantenha-o limpo.
  const safeName = ir.name.replace(/[/\\:]/g, "-").trim() || "Atalho";
  return {
    name: ir.name,
    fileName: `${safeName}.shortcut`,
    fileBase64: bytes.toString("base64"),
    signed,
    summary,
  };
}
