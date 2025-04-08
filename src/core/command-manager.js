class CommandManager {
    constructor() {
        this.history = [];
        this.redoStack = [];
    }

    execute(command) {
        command.execute();
        this.history.push(command);
        this.redoStack = []; // Clear redo stack on new action
    }

    undo() {
        if (this.history.length === 0) return;
        
        const command = this.history.pop();
        command.undo();
        this.redoStack.push(command);
    }

    redo() {
        if (this.redoStack.length === 0) return;
        
        const command = this.redoStack.pop();
        command.execute();
        this.history.push(command);
    }

    clearHistory() {
        this.history = [];
        this.redoStack = [];
    }
}

class Command {
    constructor(executeFn, undoFn) {
        this.executeFn = executeFn;
        this.undoFn = undoFn;
    }

    execute() {
        this.executeFn();
    }

    undo() {
        this.undoFn();
    }
}

export { CommandManager, Command };

