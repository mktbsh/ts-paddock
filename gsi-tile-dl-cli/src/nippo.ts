import { nippoFilePath, nippoURL } from "./const";
import { fileToCSVStream, type ReadableStream } from "./stream";
import { download, yyyymmddFormat } from "./util";

interface Nippo {
  stream: ReadableStream<string[]>;
}

export async function loadNippo(date: Date, type = "std", forceDownload = true): Promise<Nippo | null> {
  const yyyymmdd = yyyymmddFormat(date);
  const filePath = nippoFilePath(type, yyyymmdd);
  const file = Bun.file(filePath);

  if (forceDownload || !(await file.exists())) {
    const result = await download({
      url: nippoURL(yyyymmdd),
      filePath: file,
      overwrite: true
    })
    if (!result) return null;
  }

  const arr = await file.arrayBuffer()
  const stream = fileToCSVStream(arr);

  return {
    stream
  }
}
