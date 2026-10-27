import { spawn, execFileSync } from "node:child_process";
import {
  mkdtempSync,
  rmSync,
  realpathSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import { config } from "../tests/helpers/fixtures.js";

const temp = mkdtempSync(join(tmpdir(), "chaskas-runtime-"));
const npmPath = execFileSync(
  process.platform === "win32" ? "where.exe" : "which",
  [process.platform === "win32" ? "npm.cmd" : "npm"],
  { encoding: "utf8", windowsHide: true },
)
  .trim()
  .split(/\r?\n/)[0];
const npmCli =
  process.platform === "win32"
    ? join(dirname(npmPath), "node_modules/npm/bin/npm-cli.js")
    : realpathSync(npmPath);
const results = [];
function stop(child) {
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } catch {
      /* Ya terminado. */
    }
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      /* Ya terminado. */
    }
  }
}
async function waitFor(url, child, logs) {
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    if (child.exitCode !== null) throw new Error(logs());
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(900) });
      if (res.ok) return res;
    } catch {
      /* Servidor iniciando. */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("No inició el proceso dentro del plazo. " + logs());
}
try {
  for (const mode of ["start", "dev"]) {
    const port = mode === "start" ? 4174 : 3000,
      origin =
        mode === "start" ? "http://127.0.0.1:4174" : "http://localhost:5173";
    let output = "";
    const child = spawn(
      process.execPath,
      [
        npmCli,
        mode === "start" ? "start" : "run",
        ...(mode === "dev" ? ["dev"] : []),
      ],
      {
        cwd: resolve("."),
        env: {
          ...process.env,
          ADMIN_PASSWORD: config.adminPassword,
          WHATSAPP_NUMBER: "",
          DATABASE_PATH: join(temp, mode + ".sqlite"),
          PORT: String(port),
          APP_ORIGIN: origin,
          NODE_ENV: "development",
        },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
        detached: process.platform !== "win32",
      },
    );
    child.stdout.on("data", (x) => {
      output += x;
    });
    child.stderr.on("data", (x) => {
      output += x;
    });
    try {
      const base = mode === "start" ? origin : "http://127.0.0.1:5173";
      const ready = await waitFor(base + "/api/store", child, () =>
        output.slice(-1800),
      );
      assert.deepEqual(await ready.json(), {
        name: "Chaska's Store",
        whatsappEnabled: false,
      });
      assert.deepEqual(await (await fetch(base + "/api/products")).json(), {
        products: [],
      });
      const deep = await fetch(base + "/productos/prueba");
      assert.equal(deep.status, 200);
      assert.match(await deep.text(), /root/);
      const missing = await fetch(base + "/api/unknown");
      assert.equal(missing.status, 404);
      assert.match(missing.headers.get("content-type"), /json/);
      if (mode === "dev") {
        const r = await fetch(base + "/api/admin/session", {
          method: "POST",
          headers: { Origin: origin, "Content-Type": "application/json" },
          body: JSON.stringify({ password: config.adminPassword }),
        });
        assert.equal(r.status, 200);
      }
      results.push({
        mode,
        node: process.version,
        checks:
          "arranque, catálogo vacío, destino no configurado, enlace profundo y 404 JSON; proxy y origen en desarrollo",
      });
    } finally {
      stop(child);
    }
  }
  mkdirSync("docs/validacion", { recursive: true });
  writeFileSync(
    "docs/validacion/runtime-results.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  if (!resolve(temp).startsWith(resolve(tmpdir()) + sep))
    throw new Error("Directorio temporal fuera del destino permitido.");
  rmSync(temp, { recursive: true, force: true });
}
