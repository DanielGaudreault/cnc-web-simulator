class WorkerHandler {
    constructor(workerScript) {
        this.worker = new Worker(workerScript);
    }

    postMessage(task, payload) {
        return new Promise((resolve, reject) => {
            this.worker.onmessage = (event) => resolve(event.data);
            this.worker.onerror = (error) => reject(error);
            this.worker.postMessage({ task, payload });
        });
    }

    terminate() {
        this.worker.terminate();
    }
}

export default WorkerHandler;

