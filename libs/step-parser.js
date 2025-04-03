class STEPParser {
    constructor() {
        this.entityMap = new Map();
        this.headerData = {};
    }

    parse(stepText) {
        const lines = stepText.split('\n');
        let currentEntity = null;
        
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;
            
            // Parse header section
            if (line.startsWith('HEADER')) {
                this.parseHeaderSection(lines);
                return;
            }
            
            // Parse entity
            if (line.startsWith('#')) {
                const match = line.match(/^#(\d+)/);
                if (match) {
                    currentEntity = { id: parseInt(match[1]), type: '', data: {} };
                    this.entityMap.set(currentEntity.id, currentEntity);
                }
                return;
            }
            
            if (currentEntity) {
                if (line.includes('=')) {
                    const [key, value] = line.split('=').map(s => s.trim());
                    if (!currentEntity.type && key === '') {
                        currentEntity.type = value.split('(')[0];
                    }
                    this.parseEntityData(currentEntity, key, value);
                }
            }
        });
        
        return this.convertToGeometry();
    }

    parseHeaderSection(lines) {
        let inHeader = false;
        for (const line of lines) {
            if (line.startsWith('HEADER')) {
                inHeader = true;
                continue;
            }
            if (line.startsWith('ENDSEC')) {
                break;
            }
            if (inHeader && line.includes(';')) {
                const [key, value] = line.split(';').map(s => s.trim());
                this.headerData[key] = value;
            }
        }
    }

    parseEntityData(entity, key, value) {
        // Simple value
        if (value.startsWith('.')) {
            entity.data[key] = parseFloat(value);
        } 
        // Reference to another entity
        else if (value.startsWith('#')) {
            const refId = parseInt(value.substring(1));
            entity.data[key] = { type: 'ref', id: refId };
        }
        // Enumeration
        else if (value.includes('.')) {
            entity.data[key] = value.split('.')[1];
        }
        // String
        else if (value.startsWith("'")) {
            entity.data[key] = value.substring(1, value.length - 1);
        }
    }

    convertToGeometry() {
        const geometries = [];
        
        this.entityMap.forEach(entity => {
            switch(entity.type) {
                case 'LINE':
                    const start = this.resolvePoint(entity.data.start);
                    const end = this.resolvePoint(entity.data.end);
                    if (start && end) {
                        geometries.push({
                            type: 'line',
                            start: start,
                            end: end
                        });
                    }
                    break;
                    
                case 'CIRCLE':
                    const center = this.resolvePoint(entity.data.center);
                    if (center && entity.data.radius) {
                        geometries.push({
                            type: 'circle',
                            center: center,
                            radius: entity.data.radius,
                            normal: this.resolveDirection(entity.data.axis)
                        });
                    }
                    break;
            }
        });
        
        return {
            format: 'STEP',
            header: this.headerData,
            entities: geometries
        };
    }

    resolvePoint(ref) {
        if (!ref || ref.type !== 'ref') return null;
        const entity = this.entityMap.get(ref.id);
        if (!entity) return null;
        
        if (entity.type === 'CARTESIAN_POINT') {
            return {
                x: entity.data.x || 0,
                y: entity.data.y || 0,
                z: entity.data.z || 0
            };
        }
        return null;
    }

    resolveDirection(ref) {
        // Similar to resolvePoint but for vectors
    }
}
