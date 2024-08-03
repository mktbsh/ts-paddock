type TaskFn<T> = () => Promise<T>;

type TaskList<T> = Array<TaskFn<T>>;

export async function processQueueConcurrently<T>(
  tasks: TaskList<T>,
  maxConcurrent = 1
): Promise<ReadonlyArray<T>> {
  return _processQueueConcurrently(tasks, maxConcurrent, tasks.length).then(
    (res) => {
      return res
        .sort((a, b) => (a.index < b.index ? -1 : 1))
        .map((r) => r.result);
    }
  );
}

interface QueueResult<T> {
  index: number;
  result: T;
}

type QueueResults<T> = Array<QueueResult<T>>;

async function _processQueueConcurrently<T>(
  tasks: TaskList<T>,
  maxConcurrent: number,
  taskCount: number
): Promise<QueueResults<T>> {
  const promises: Promise<QueueResults<T>>[] = [];

  const processRemainTasks = <T>(
    tasks: TaskList<T>,
    taskCount: number,
    prevResult: QueueResult<T>
  ): Promise<QueueResult<T>[]> => {
    return _processQueueConcurrently(tasks, 1, taskCount).then((results) => {
      results.push(prevResult);
      return results.flat(1);
    });
  };

  while (tasks.length > 0 && promises.length < maxConcurrent) {
    const i = taskCount - tasks.length;

    const taskFn = tasks.shift();
    if (taskFn === undefined) continue;

    const ps = taskFn()
      .then((r: T) => toQueueResult(r, i))
      .then((r) => processRemainTasks(tasks, taskCount, r));

    promises.push(ps);
  }

  return Promise.all(promises).then((r) => r.flat(1));
}

function toQueueResult<T>(result: T, index: number): QueueResult<T> {
  return { index, result };
}
