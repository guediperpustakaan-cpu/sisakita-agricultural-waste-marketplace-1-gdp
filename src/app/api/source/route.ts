import { ZipArchive } from "archiver";
import { createWriteStream, readFileSync, unlinkSync } from "fs";
import path from "path";
import { tmpdir } from "os";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const IGNORE = [
  "node_modules/**",
  ".next/**",
  ".git/**",
  ".kilo/**",
  "out/**",
  "build/**",
  "drizzle/**",
  "*.log",
  ".env",
  ".env.local",
  ".env.example",
  "tsconfig.tsbuildinfo",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
];

async function buildZip(): Promise<Buffer> {
  const tmp = path.join(tmpdir(), `sisakita-source-${Date.now()}.zip`);
  const out = createWriteStream(tmp);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  await new Promise<void>((resolve, reject) => {
    out.on("close", resolve);
    out.on("error", reject);
    archive.on("error", reject);
    archive.pipe(out);
    void archive.glob("**/*", {
      cwd: process.cwd(),
      ignore: IGNORE,
      nodir: true,
      dot: true,
    });
    void archive.finalize();
  });

  const buffer = readFileSync(tmp);
  try {
    unlinkSync(tmp);
  } catch {
    /* abaikan bila gagal dihapus */
  }
  return buffer;
}

export async function GET() {
  try {
    const zip = await buildZip();
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="sisakita-agricultural-waste-marketplace.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Gagal membuat source zip:", err);
    return Response.json({ error: "Gagal membuat arsip source code" }, { status: 500 });
  }
}