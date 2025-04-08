class UndoRedoSystem {
    constructor(cadEngine, camEngine) {
        this.cadEngine = cadEngine;
        this.camEngine = camEngine;
        this.history = [];
        this.currentIndex = -1;
        this.limit = 50;
    }

    record(state) {
        // Truncate any redo history
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        // Add new state
        this.history.push(JSON.parse(JSON.stringify(state)));
        this.currentIndex++;
        
        // Enforce limit
        if (this.history.length > this.limit) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    undo() {
        if (this.currentIndex <= 0) return false;
        
        this.currentIndex--;
        this._restoreState(this.history[this.currentIndex]);
        return true;
    }

    redo() {
        if (this.currentIndex >= this.history.length - 1) return false;
        
        this.currentIndex++;
        this._restoreState(this.history[this.currentIndex]);
        return true;
    }

    _restoreState(state) {
        // Restore CAD state
        this.cadEngine.objects = state.cad.objects;
        this.cadEngine.selection = state.cad.selection;
        
        // Restore CAM state
        this.camEngine.toolpaths = state.cam.toolpaths;
        this.camEngine.machineSetup = state.cam.machineSetup;
        
        // Trigger UI updates
        this._notifyStateChange();
    }

    getCurrentState() {
        return {
            cad: {
                objects: this.cadEngine.objects,
                selection: this.cadEngine.selection
            },
            cam: {
                toolpaths: this.camEngine.toolpaths,
                machineSetup: this.camEngine.machineSetup
            }
        };
    }
}
