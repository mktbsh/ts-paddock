import { createArray } from "./util";

interface WorkerMessage {
  id: string;
}

interface WorkerPoolInit<Req extends WorkerMessage, Res extends WorkerMessage> {
  threads: number;
  initWorkerFn: () => Worker;
}

export function createWorkerPool<Req extends WorkerMessage, Res extends WorkerMessage>({
  threads,
  initWorkerFn,
}: WorkerPoolInit<Req, Res>) {
  const workers = createArray(threads, initWorkerFn);
  const pending = new Map<string, (value: Res | PromiseLike<Res>) => void>();

  let currentWorkerIndex = 0;
  function getExecutableWorkerIndex(): number {
    if (currentWorkerIndex === workers.length - 1) {
      currentWorkerIndex = 0;
    } else {
      currentWorkerIndex++;
    }
    return currentWorkerIndex
  }

  function applyAll(fn: (worker: Worker) => void) {
    for (const worker of workers) {
      fn(worker);
    }
  }

  applyAll((worker) => {
    worker.addEventListener('message', ({ data }: MessageEvent<Res>) => {
      const resolve = pending.get(data.id);
      if (resolve === undefined) return;
      pending.delete(data.id);
      resolve(data);
    })
  });


  async function request(data: Omit<Req, "id">) {
    return new Promise<Res>((resolve) => {
      const index = getExecutableWorkerIndex();
      const worker = workers[index];

      const id = crypto.randomUUID();
      pending.set(id, resolve);

      worker.postMessage({
        ...data,
        id
      })
    });
  }



  return {
    destroy: () => applyAll((w) => w.terminate()),
    request
  }
}
