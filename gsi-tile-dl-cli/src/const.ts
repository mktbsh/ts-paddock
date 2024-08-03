import path from 'node:path';
import pkg from '../package.json';

const BASE_DIR = path.resolve(process.cwd(), pkg.name);
export const DATA_DIR = path.resolve(BASE_DIR, "data");

const GSI_BASE_URL = "https://cyberjapandata.gsi.go.jp";

const MOKUROKU_CSV_GZ = 'mokuroku.csv.gz'

export const NIPPO_CSV_GZ = "nippo.csv.gz"

export function mokurokuDir(type: string): string {
  return path.resolve(DATA_DIR, `mokuroku/${type}`);
}

export function mokurokuFilePath(type: string): string {
  return path.resolve(mokurokuDir(type), MOKUROKU_CSV_GZ);
}

export function mokurokuURL(type: string): string {
  return [GSI_BASE_URL, "xyz", type, MOKUROKU_CSV_GZ].join('/');
}

export function nippoDir(type: string): string {
  return path.resolve(DATA_DIR, `nippo/${type}`);
}

function nippoCsvGz(yyyymmdd: string): string {
  return `${yyyymmdd}-${NIPPO_CSV_GZ}`;
}

export function nippoFilePath(type: string, yyyymmdd: string): string {
  return path.resolve(nippoDir(type), nippoCsvGz(yyyymmdd));
}

export function nippoURL(yyyymmdd: string): string {
  return `${GSI_BASE_URL}/nippo/${nippoCsvGz(yyyymmdd)}`;
}

interface TileURLInit {
  type: string;
  z: string | number;
  x: string | number;
  y: string | number;
}

export function tileURL(init: TileURLInit): string {
  const { type, z, x, y } = init;
  return [GSI_BASE_URL, "xyz", type, z, x, `${y}.png`].join('/');
}

export function mapDir(type: string): string {
  return path.resolve(DATA_DIR, `map/${type}`);
}

export function tileFilePath(type: string, filePath: string): string {
  return path.resolve(mapDir(type), filePath);
}
