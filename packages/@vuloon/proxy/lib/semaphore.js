var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
__export(exports, {
  Semaphore: () => Semaphore
});
class Semaphore {
  tasks = [];
  count;
  constructor(count) {
    this.count = count;
  }
  acquire() {
    return new Promise((resolve) => {
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
  use(func) {
    return this.acquire().then((release) => {
      return func().then((res) => {
        release();
        return res;
      }).catch((err) => {
        release();
        throw err;
      });
    });
  }
  #sched() {
    if (this.count > 0 && this.tasks.length > 0) {
      this.count--;
      const next = this.tasks.shift();
      next();
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Semaphore
});
