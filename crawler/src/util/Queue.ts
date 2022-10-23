import { QueueItem } from './types';

class Queue {
  private maxConcurrent = 1;
  private running = 0;

  private queue: QueueItem[] = [];

  private resolver: (value?: unknown) => void = () => undefined;

  public stop = false;

  constructor (concurrentCount = 1) {
    this.maxConcurrent = concurrentCount;
  }

  enqueue(promise: () => Promise<any>) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        promise,
        resolve,
        reject,
      });
      this.dequeue();
    });
  }

  dequeue() {
    if ((!this.running && !this.queue.length) || this.stop) {
      this.queue = [];
      this.running = 0;
      this.stop = false;
      this.resolver();
      return false;
    }
    if (this.running >= this.maxConcurrent || !this.queue.length) {
      return false;
    }
    const item = this.queue.shift();
    if (!item) {
      return false;
    }
    try {
      this.running++;
      item.promise()
        .then((value) => {
          this.running--;
          item.resolve(value);
          this.dequeue();
        })
        .catch(err => {
          this.running--;
          item.reject(err);
          this.dequeue();
        });
    } catch (err) {
      this.running--;
      item.reject(err);
      this.dequeue();
    }
    return true;
  }

  async isRunning() {
    return new Promise(resolve => {
      this.resolver = resolve;
    });
  }
}


export default Queue;