class SelectionManager {
    constructor(cadEngine, cadViewer) {
        this.cadEngine = cadEngine;
        this.cadViewer = cadViewer;
        this.selection = [];
        this.highlighted = [];
        this.selectionMode = 'object'; // 'object', 'vertex', 'edge', 'face'
    }

    select(objectIds, additive = false) {
        if (!additive) {
            this.clearSelection();
        }
        
        objectIds.forEach(id => {
            if (!this.selection.includes(id)) {
                this.selection.push(id);
            }
        });
        
        this._updateHighlight();
    }

    clearSelection() {
        this.selection = [];
        this._updateHighlight();
    }

    highlight(objectIds) {
        this.highlighted = objectIds;
        this._updateHighlight();
    }

    clearHighlight() {
        this.highlighted = [];
        this._updateHighlight();
    }

    _updateHighlight() {
        // Clear all highlights first
        this.cadViewer.clearHighlights();
        
        // Apply new highlights
        this.highlighted.forEach(id => {
            this.cadViewer.highlightObject(id, 0xffff00); // Yellow highlight
        });
        
        // Apply selection highlights
        this.selection.forEach(id => {
            this.cadViewer.highlightObject(id, 0x00aaff); // Blue selection
        });
    }

    getBoundingBox() {
        if (this.selection.length === 0) return null;
        
        let min = { x: Infinity, y: Infinity, z: Infinity };
        let max = { x: -Infinity, y: -Infinity, z: -Infinity };
        
        this.selection.forEach(id => {
            const obj = this.cadEngine.getObject(id);
            if (obj && obj.geometry.boundingBox) {
                const bb = obj.geometry.boundingBox;
                min.x = Math.min(min.x, bb.min.x);
                min.y = Math.min(min.y, bb.min.y);
                min.z = Math.min(min.z, bb.min.z);
                max.x = Math.max(max.x, bb.max.x);
                max.y = Math.max(max.y, bb.max.y);
                max.z = Math.max(max.z, bb.max.z);
            }
        });
        
        return { min, max };
    }
}
