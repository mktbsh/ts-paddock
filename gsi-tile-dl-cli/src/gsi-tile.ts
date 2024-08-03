import { mapDir, tileFilePath, tileURL } from "./const";
import { mkdir } from "node:fs/promises";
import { prepareMd5Dict } from "./util";
import { NippoManager } from "./nippo-manager";
import { loadMokuroku } from "./mokuroku";
import type { RequestMsg, ResponseMsg } from "./tile-downloader";
import { createWorkerPool } from "./worker-manager";
import { processQueueConcurrently } from "./queue";

interface Options {
  type: string;
  zoomLevels: number[];
  forceDownload?: boolean;
  workerThreads?: number;
}

const debug = true;

export async function downloadGsiTile({
  type,
  zoomLevels,
  forceDownload = true,
  workerThreads = 10,
}: Options): Promise<ReadonlyArray<string>> {
  const mapDirPath = mapDir(type);

  await mkdir(mapDirPath, { recursive: true });

  console.log('Preparing nippo files');
  const nippoManager = new NippoManager(type, forceDownload);

  const [md5Local, nippo, mokuroku] = await Promise.all([
    prepareMd5Dict(mapDirPath, true),
    nippoManager.getMergedLatestNippoDict(),
    loadMokuroku(type, forceDownload)
  ])

  if (debug) return [];

  console.log('Checking mokuroku and find files to download');

  const workerPool = createWorkerPool<RequestMsg, ResponseMsg>({
    threads: workerThreads,
    initWorkerFn: () => new Worker('./tile-downloader.ts')
  });

  const queue: (() => Promise<string>)[] = [];

  let nFilesToDownload = 0;
  for await (const entry of mokuroku.stream) {
    const [path, , , md5Sum] = entry;
    const [z, x, y] = path.split('/');

    if (!zoomLevels.includes(Number.parseInt(z))) continue;

    const md5 = path in nippo ? nippo[path] : md5Sum;
    if (path in md5Local && md5Local[path] === md5) continue;

    const url = tileURL({ type, z, x, y });
    const tilePath = tileFilePath(type, path);
    queue.push(async () => {
      return (await workerPool.request({ url, tilePath })).tilePath
    })
    nFilesToDownload++;
    if (nFilesToDownload % 1_000) {
      console.log(`Queueに${nFilesToDownload}件追加`)
    }
  }

  return await processQueueConcurrently(queue, 30)
}
