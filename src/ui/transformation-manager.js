class TransformationManager {
    constructor(cadEngine, selectionManager) {
        this.cadEngine = cadEngine;
        this.selection = selectionManager;
        this.transformMode = 'move'; // 'move', 'rotate', 'scale'
        this.pivotPoint = 'center'; // 'center', 'origin', 'cursor'
        this.snapEnabled = true;
        this.snapValues = {
            move: 1.0,
            rotate: 15.0,
            scale: 0.1
        };
    }

    move(offset, relative = true) {
        const selected = this.selection.selection;
        
        selected.forEach(id => {
            const obj = this.cadEngine.getObject(id);
            if (obj) {
                if (relative) {
                    obj.position.x += offset.x;
                    obj.position.y += offset.y;
                    obj.position.z += offset.z;
                } else {
                    obj.position.x = offset.x;
                    obj.position.y = offset.y;
                    obj.position.z = offset.z;
                }
                
                // Apply snapping if enabled
                if (this.snapEnabled) {
                    obj.position.x = this._snapValue(obj.position.x, this.snapValues.move);
                    obj.position.y = this._snapValue(obj.position.y, this.snapValues.move);
                    obj.position.z = this._snapValue(obj.position.z, this.snapValues.move);
                }
            }
        });
    }

    rotate(rotation, relative = true) {
        const selected = this.selection.selection;
        
        selected.forEach(id => {
            const obj = this.cadEngine.getObject(id);
            if (obj) {
                if (relative) {
                    obj.rotation.x += rotation.x;
                    obj.rotation.y += rotation.y;
                    obj.rotation.z += rotation.z;
                } else {
                    obj.rotation.x = rotation.x;
                    obj.rotation.y = rotation.y;
                    obj.rotation.z = rotation.z;
                }
                
                // Apply snapping if enabled
                if (this.snapEnabled) {
                    obj.rotation.x = this._snapValue(obj.rotation.x, this.snapValues.rotate);
                    obj.rotation.y = this._snapValue(obj.rotation.y, this.snapValues.rotate);
                    obj.rotation.z = this._snapValue(obj.rotation.z, this.snapValues.rotate);
                }
            }
        });
    }

    scale(scale, relative = true) {
        const selected = this.selection.selection;
        
        selected.forEach(id => {
            const obj = this.cadEngine.getObject(id);
            if (obj) {
                if (relative) {
                    obj.scale.x *= scale.x;
                    obj.scale.y *= scale.y;
                    obj.scale.z *= scale.z;
                } else {
                    obj.scale.x = scale.x;
                    obj.scale.y = scale.y;
                    obj.scale.z = scale.z;
                }
                
                // Apply snapping if enabled
                if (this.snapEnabled) {
                    obj.scale.x = this._snapValue(obj.scale.x, this.snapValues.scale);
                    obj.scale.y = this._snapValue(obj.scale.y, this.snapValues.scale);
                    obj.scale.z = this._snapValue(obj.scale.z, this.snapValues.scale);
                }
            }
        });
    }

    _snapValue(value, increment) {
        return Math.round(value / increment) * increment;
    }

    getPivotPoint() {
        switch (this.pivotPoint) {
            case 'center':
                const bb = this.selection.getBoundingBox();
                if (bb) {
                    return {
                        x: (bb.min.x + bb.max.x) / 2,
                        y: (bb.min.y + bb.max.y) / 2,
                        z: (bb.min.z + bb.max.z) / 2
                    };
                }
                return { x: 0, y: 0, z: 0 };
                
            case 'origin':
                return { x: 0, y: 0, z: 0 };
                
            case 'cursor':
                // Would come from mouse position in 3D space
                return this.cadEngine.cursorPosition || { x: 0, y: 0, z: 0 };
                
            default:
                return { x: 0, y: 0, z: 0 };
        }
    }
}
