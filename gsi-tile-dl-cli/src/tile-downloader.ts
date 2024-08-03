import { download } from "./util";

declare let self: Worker;

export interface RequestMsg {
  id: string;
  url: string;
  tilePath: string;
}

export interface ResponseMsg {
  id: string;
  tilePath: string;
}

self.addEventListener('message', async (e: MessageEvent<RequestMsg>) => {
  const { id, url, tilePath } = e.data;
  await download({
    url,
    filePath: tilePath,
    overwrite: true
  });

  self.postMessage({ id, tilePath });
})
