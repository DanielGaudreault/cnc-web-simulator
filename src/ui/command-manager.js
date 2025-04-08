class CommandManager {
    constructor() {
        this.commandStack = [];
        this.undoStack = [];
        this.maxHistory = 100;
    }

    execute(command) {
        command.execute();
        this.commandStack.push(command);
        
        // Truncate if too long
        if (this.commandStack.length > this.maxHistory) {
            this.commandStack.shift();
        }
        
        // Clear redo stack when new command is executed
        this.undoStack = [];
    }

    undo() {
        if (this.commandStack.length === 0) return;
        
        const command = this.commandStack.pop();
        command.undo();
        this.undoStack.push(command);
    }

    redo() {
        if (this.undoStack.length === 0) return;
        
        const command = this.undoStack.pop();
        command.execute();
        this.commandStack.push(command);
    }

    clear() {
        this.commandStack = [];
        this.undoStack = [];
    }
}

class CreateBoxCommand {
    constructor(cadEngine, params) {
        this.cadEngine = cadEngine;
        this.params = params;
        this.createdObject = null;
    }

    execute() {
        this.createdObject = this.cadEngine.createPrimitive('box', this.params);
    }

    undo() {
        if (this.createdObject) {
            this.cadEngine.removeObject(this.createdObject.id);
        }
    }
}
