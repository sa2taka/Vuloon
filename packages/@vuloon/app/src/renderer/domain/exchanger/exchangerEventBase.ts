type EventTargetListener = Parameters<EventTarget['addEventListener']>[1];

export abstract class ExchangerEventBase<T> {
  protected abstract key: string;
  #eventTarget = new EventTarget();

  register(callback: (event: CustomEvent<T>) => void | Promise<void>): () => void {
    this.#eventTarget.addEventListener(this.key, callback as EventTargetListener);

    return () => this.#eventTarget.removeEventListener(this.key, callback as EventTargetListener);
  }

  protected send(event: CustomEvent<T>): void {
    this.#eventTarget.dispatchEvent(event);
  }
}
