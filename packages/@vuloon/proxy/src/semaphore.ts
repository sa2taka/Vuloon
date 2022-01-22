export class Semaphore {
  private tasks: (() => void)[] = [];
  count: number;

  constructor(count: number) {
    this.count = count;
  }

  acquire(): Promise<() => void> {
    return new Promise<() => void>((resolve) => {
      const task = () => {
        let released = false;
        resolve(() => {
          if (!released) {
            released = true;
            this.count++;
            this.#sched();
          }
        });
      };
      this.tasks.push(task);
      if (process && process.nextTick) {
        process.nextTick(this.#sched.bind(this));
      } else {
        setImmediate(this.#sched.bind(this));
      }
    });
  }

  use<T>(func: () => Promise<T>): Promise<T> {
    return this.acquire().then((release) => {
      return func()
        .then((res) => {
          release();
          return res;
        })
        .catch((err) => {
          release();
          throw err;
        });
    });
  }

  #sched(): void {
    if (this.count > 0 && this.tasks.length > 0) {
      this.count--;
      const next = this.tasks.shift()!;
      next();
    }
  }
}
