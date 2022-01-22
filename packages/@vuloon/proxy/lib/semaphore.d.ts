export declare class Semaphore {
    #private;
    private tasks;
    count: number;
    constructor(count: number);
    acquire(): Promise<() => void>;
    use<T>(func: () => Promise<T>): Promise<T>;
}
