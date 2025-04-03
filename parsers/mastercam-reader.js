class MastercamParser {
    constructor() {
        this.debug = true;
    }

    async parse(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        
        // 1. Verify Header
        const signature = this.readChars(view, 0, 4);
        if (signature !== 'MCAX') {
            throw new Error(`Invalid Mastercam file signature: ${signature}`);
        }
        
        const version = view.getUint16(4, true);
        const units = view.getUint8(6) === 0 ? 'inches' : 'mm';
        const headerSize = 32;

        // 2. Parse Entities
        const entities = [];
        let offset = headerSize;
        
        while (offset < arrayBuffer.byteLength) {
            const entityType = view.getUint8(offset);
            offset += 1;
            
            try {
                const entity = this.parseEntity(view, offset, entityType);
                entities.push(entity);
                offset += entity.byteLength;
            } catch (e) {
                console.warn(`Skipping unrecognized entity at offset ${offset}:`, e);
                offset += 4;
            }
        }

        return {
            format: 'Mastercam',
            version,
            units,
            entities
        };
    }

    parseEntity(view, offset, type) {
        switch(type) {
            case 0x01: // LINE
                return {
                    type: 'LINE',
                    start: this.readVector(view, offset),
                    end: this.readVector(view, offset + 12),
                    byteLength: 24
                };
                
            case 0x02: // ARC
                return {
                    type: 'ARC',
                    center: this.readVector(view, offset),
                    radius: view.getFloat32(offset + 12, true),
                    startAngle: view.getFloat32(offset + 16, true),
                    endAngle: view.getFloat32(offset + 20, true),
                    normal: this.readVector(view, offset + 24),
                    byteLength: 36
                };
                
            default:
                throw new Error(`Unknown entity type: 0x${type.toString(16)}`);
        }
    }

    convertToThreeJS(parsedData) {
        const group = new THREE.Group();
        
        parsedData.entities.forEach(entity => {
            switch(entity.type) {
                case 'LINE':
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(
                            entity.start.x,
                            entity.start.y,
                            entity.start.z
                        ),
                        new THREE.Vector3(
                            entity.end.x,
                            entity.end.y,
                            entity.end.z
                        )
                    ]);
                    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
                    group.add(new THREE.Line(lineGeometry, lineMaterial));
                    break;
                    
                case 'ARC':
                    const arcPoints = this.generateArcPoints(entity);
                    const arcGeometry = new THREE.BufferGeometry().setFromPoints(
                        arcPoints.map(p => new THREE.Vector3(p.x, p.y, p.z))
                    );
                    group.add(new THREE.Line(
                        arcGeometry,
                        new THREE.LineBasicMaterial({ color: 0xff0000 })
                    ));
                    break;
            }
        });
        
        return group;
    }

    generateArcPoints(arcData, segments = 32) {
        const points = [];
        const angleRange = arcData.endAngle - arcData.startAngle;
        
        for (let i = 0; i <= segments; i++) {
            const angle = arcData.startAngle + (angleRange * i / segments);
            points.push({
                x: arcData.center.x + arcData.radius * Math.cos(angle),
                y: arcData.center.y + arcData.radius * Math.sin(angle),
                z: arcData.center.z
            });
        }
        
        return points;
    }

    // Helper methods
    readChars(view, offset, length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += String.fromCharCode(view.getUint8(offset + i));
        }
        return str;
    }

    readVector(view, offset) {
        return {
            x: view.getFloat32(offset, true),
            y: view.getFloat32(offset + 4, true),
            z: view.getFloat32(offset + 8, true)
        };
    }
}
