import { mokurokuFilePath, mokurokuURL } from "./const";
import { fileToCSVStream, type ReadableStream } from "./stream";
import { download, fsRemove } from "./util";

interface Mokuroku {
  stream: ReadableStream<string[]>;
}

export async function loadMokuroku(
  type = "std",
  forceDownload = true
): Promise<Mokuroku> {
  const filePath = mokurokuFilePath(type);
  const file = Bun.file(filePath);

  if (forceDownload || !(await file.exists())) {
    const url = mokurokuURL(type);
    await download({ url, filePath: file, overwrite: true });
  }

  const stream = fileToCSVStream(await file.arrayBuffer());
  return {
    stream,
  }
}

export async function removeMokurokuFile(type: string) {
  const filePath = mokurokuFilePath(type);
  const file = Bun.file(filePath);

  if (await file.exists()) {
    await fsRemove(filePath);
  }
}
