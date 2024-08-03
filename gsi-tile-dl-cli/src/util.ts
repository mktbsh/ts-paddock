import type { BunFile } from "bun";
import { unlink, readdir, readFile } from "node:fs/promises";
import path from "node:path";

interface DLOptions {
  url: string;
  filePath: string | BunFile;
  overwrite?: boolean;
}

export async function download({ url, filePath, overwrite = false }: DLOptions): Promise<boolean> {
  const file = typeof filePath === "string" ? Bun.file(filePath) : filePath;

  if (!overwrite && (await file.exists())) {
    return false;
  }

  const response = await fetch(url)
  if (!response.ok) {
    return false;
  }

  const bytes = await Bun.write(file, response);
  return bytes > 0;
}

export function fsRemove(path: string | Buffer | URL) {
  return unlink(path)
}

export function yyyymmddFormat(date: Date): string {
  const pad = (n: number): string => `${n}`.padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('')
}

export function createArray(size: number): number[];
export function createArray<T>(size: number, fill: (index: number) => T): T[];
export function createArray<T>(size: number, fill?: (index: number) => T): number[] | T[] {
  const initial: number[] = new Array(size).fill(0);
  if (fill === undefined) return initial;
  return initial.map((_, i) => fill(i));
}

export async function prepareMd5Dict(mapDir: string, verbose = false): Promise<Record<string, string>> {
  const dict: Record<string, string> = {};
  const subDictPs: Promise<Record<string, string>>[] = []

  const files = await readdir(mapDir, { withFileTypes: true });
  for (const file of files) {
    const entryPath = path.join(mapDir, file.name);

    if (file.isDirectory()) {
      subDictPs.push(prepareMd5Dict(entryPath, verbose));
      continue;
    }
    if (!file.isFile()) continue;

    if (file.name.endsWith('.png')) {
      const buffer = await readFile(entryPath);
      const hash = new Bun.CryptoHasher("md5");
      hash.update(buffer);
      const checksum = hash.digest("hex");
      dict[entryPath] = checksum;
    }
  }

  for (const subDict of await Promise.all(subDictPs)) {
    Object.assign(dict, subDict);
  }

  return dict;
}
