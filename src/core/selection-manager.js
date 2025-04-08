class SelectionManager {
    constructor(cadEngine) {
        this.cadEngine = cadEngine;
        this.selectedObjects = new Set();
        this.listeners = [];
    }

    selectObject(objectId) {
        this.selectedObjects.clear();
        this.selectedObjects.add(objectId);
        this._triggerUpdate();
    }

    toggleSelection(objectId) {
        if (this.selectedObjects.has(objectId)) {
            this.selectedObjects.delete(objectId);
        } else {
            this.selectedObjects.add(objectId);
        }
        this._triggerUpdate();
    }

    clearSelection() {
        this.selectedObjects.clear();
        this._triggerUpdate();
    }

    getSelection() {
        return Array.from(this.selectedObjects);
    }

    onSelectionChange(callback) {
        this.listeners.push(callback);
    }

    _triggerUpdate() {
        this.listeners.forEach(callback => callback(this.getSelection()));
    }
}

export default SelectionManager;

