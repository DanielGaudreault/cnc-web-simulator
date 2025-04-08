class PropertyEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentObject = null;
    }

    update(object) {
        this.currentObject = object;
        this.container.innerHTML = '';
        
        if (!object) {
            this.container.innerHTML = '<p>No object selected</p>';
            return;
        }
        
        const title = document.createElement('h3');
        title.textContent = object.name || `Object ${object.id}`;
        this.container.appendChild(title);
        
        // Create property table
        const table = document.createElement('table');
        table.className = 'property-table';
        
        // Add position properties
        this._addPropertyRow(table, 'Position X', object.position.x, (value) => {
            object.position.x = parseFloat(value);
        });
        
        this._addPropertyRow(table, 'Position Y', object.position.y, (value) => {
            object.position.y = parseFloat(value);
        });
        
        this._addPropertyRow(table, 'Position Z', object.position.z, (value) => {
            object.position.z = parseFloat(value);
        });
        
        // Add rotation properties if applicable
        if (object.rotation) {
            this._addPropertyRow(table, 'Rotation X', object.rotation.x, (value) => {
                object.rotation.x = parseFloat(value);
            });
            
            this._addPropertyRow(table, 'Rotation Y', object.rotation.y, (value) => {
                object.rotation.y = parseFloat(value);
            });
            
            this._addPropertyRow(table, 'Rotation Z', object.rotation.z, (value) => {
                object.rotation.z = parseFloat(value);
            });
        }
        
        // Add type-specific properties
        if (object.type === 'primitive') {
            this._addPrimitiveProperties(table, object);
        } else if (object.type === 'extrusion') {
            this._addExtrusionProperties(table, object);
        }
        
        this.container.appendChild(table);
    }

    _addPropertyRow(table, label, value, onChange) {
        const row = document.createElement('tr');
        
        const labelCell = document.createElement('td');
        labelCell.className = 'property-label';
        labelCell.textContent = label;
        row.appendChild(labelCell);
        
        const valueCell = document.createElement('td');
        valueCell.className = 'property-value';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.value = value;
        input.addEventListener('change', (e) => onChange(e.target.value));
        
        valueCell.appendChild(input);
        row.appendChild(valueCell);
        
        table.appendChild(row);
    }

    _addPrimitiveProperties(table, object) {
        switch (object.primitiveType) {
            case 'box':
                this._addPropertyRow(table, 'Width', object.parameters.width, (value) => {
                    object.parameters.width = parseFloat(value);
                    object.geometry = new THREE.BoxGeometry(
                        object.parameters.width,
                        object.parameters.height,
                        object.parameters.depth
                    );
                });
                
                this._addPropertyRow(table, 'Height', object.parameters.height, (value) => {
                    object.parameters.height = parseFloat(value);
                    object.geometry = new THREE.BoxGeometry(
                        object.parameters.width,
                        object.parameters.height,
                        object.parameters.depth
                    );
                });
                
                this._addPropertyRow(table, 'Depth', object.parameters.depth, (value) => {
                    object.parameters.depth = parseFloat(value);
                    object.geometry = new THREE.BoxGeometry(
                        object.parameters.width,
                        object.parameters.height,
                        object.parameters.depth
                    );
                });
                break;
                
            case 'cylinder':
                // Add cylinder-specific properties
                break;
        }
    }

    _addExtrusionProperties(table, object) {
        this._addPropertyRow(table, 'Distance', object.distance, (value) => {
            object.distance = parseFloat(value);
            // Regenerate extrusion
        });
    }
}
