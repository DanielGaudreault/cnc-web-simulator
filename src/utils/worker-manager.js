class WorkerManager {
    constructor() {
        this.workers = {};
        this.taskQueue = [];
        this.activeTasks = 0;
        this.maxWorkers = navigator.hardwareConcurrency || 4;
    }

    registerWorker(name, scriptPath) {
        if (this.workers[name]) {
            console.warn(`Worker ${name} already registered`);
            return;
        }
        
        this.workers[name] = {
            instances: [],
            scriptPath,
            taskQueue: []
        };
    }

    async executeTask(workerName, taskData) {
        if (!this.workers[workerName]) {
            throw new Error(`Worker ${workerName} not registered`);
        }
        
        return new Promise((resolve, reject) => {
            const task = {
                taskData,
                resolve,
                reject
            };
            
            this.workers[workerName].taskQueue.push(task);
            this._processTaskQueue(workerName);
        });
    }

    async _processTaskQueue(workerName) {
        const workerInfo = this.workers[workerName];
        
        if (workerInfo.taskQueue.length === 0) return;
        
        // Check if we can start a new worker
        if (workerInfo.instances.length < this.maxWorkers) {
            const worker = new Worker(workerInfo.scriptPath);
            const workerId = workerInfo.instances.length;
            
            worker.onmessage = (e) => {
                const task = workerInfo.taskQueue.shift();
                if (e.data.error) {
                    task.reject(e.data.error);
                } else {
                    task.resolve(e.data.result);
                }
                
                // Process next task
                this._processTaskQueue(workerName);
            };
            
            worker.onerror = (e) => {
                const task = workerInfo.taskQueue.shift();
                task.reject(e.message);
                this._processTaskQueue(workerName);
            };
            
            workerInfo.instances.push(worker);
            worker.postMessage(workerInfo.taskQueue[0].taskData);
        }
    }

    terminateAll() {
        Object.values(this.workers).forEach(workerInfo => {
            workerInfo.instances.forEach(worker
