// Servidor de assinatura de atalhos — RODA NUM MAC (macOS 12+, logado numa Conta Apple).
// O CLI oficial `shortcuts sign` só existe no macOS; este serviço expõe a assinatura
// via HTTP para o app web entregar arquivos instaláveis em 1 toque.
//
// Uso:  SIGNER_TOKEN=um-segredo node server.mjs
// Depois configure SIGNER_URL/SIGNER_TOKEN no app web.
//
// Obs.: no modo "anyone" a Apple recebe uma cópia do atalho para validação antimalware.

import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.SIGNER_TOKEN || "";
const MAX_BODY = 2 * 1024 * 1024; // 2 MB é muito mais que qualquer atalho real

if (!TOKEN) {
  console.error("Defina SIGNER_TOKEN (o mesmo valor configurado no app web).");
  process.exit(1);
}

function sign(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    execFile(
      "shortcuts",
      ["sign", "--mode", "anyone", "--input", inputPath, "--output", outputPath],
      { timeout: 30_000 },
      (err, _stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve())
    );
  });
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/sign") {
    res.writeHead(404).end();
    return;
  }

  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    res.writeHead(401).end();
    return;
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) {
      res.writeHead(413).end();
      return;
    }
    chunks.push(chunk);
  }

  const dir = await mkdtemp(join(tmpdir(), "atalho-"));
  const input = join(dir, "in.shortcut");
  const output = join(dir, "out.shortcut");
  try {
    await writeFile(input, Buffer.concat(chunks));
    await sign(input, output);
    const signed = await readFile(output);
    res.writeHead(200, { "content-type": "application/octet-stream" });
    res.end(signed);
  } catch (err) {
    console.error("Falha ao assinar:", err.message);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

server.listen(PORT, () => {
  console.log(`Signer ouvindo em http://localhost:${PORT} — POST /sign`);
});
