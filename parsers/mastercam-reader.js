class MastercamParser {
    constructor() {
        this.geometryTypes = {
            0x01: 'LINE',
            0x02: 'ARC',
            0x03: 'SPLINE',
            0x04: 'POINT'
        };
    }

    async parse(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        
        // Validate header
        const signature = String.fromCharCode(
            view.getUint8(0),
            view.getUint8(1),
            view.getUint8(2),
            view.getUint8(3)
        );
        
        if (signature !== 'MCAX') {
            throw new Error('Invalid Mastercam file signature');
        }
        
        const version = view.getUint16(4, true);
        const units = view.getUint8(6) === 0 ? 'inches' : 'mm';
        const headerSize = 32;
        
        const entities = [];
        let offset = headerSize;
        
        while (offset < arrayBuffer.byteLength) {
            const entityType = view.getUint8(offset);
            offset += 1;
            
            if (!this.geometryTypes[entityType]) {
                offset = this.skipUnknownEntity(view, offset);
                continue;
            }
            
            const entity = {
                type: this.geometryTypes[entityType],
                data: this.parseEntity(view, offset, entityType)
            };
            
            entities.push(entity);
            offset += entity.data.byteLength;
        }
        
        return {
            format: 'Mastercam',
            version: version,
            units: units,
            entities: entities
        };
    }

    parseEntity(view, offset, type) {
        switch(type) {
            case 0x01: // LINE
                return {
                    start: {
                        x: view.getFloat32(offset, true),
                        y: view.getFloat32(offset+4, true),
                        z: view.getFloat32(offset+8, true)
                    },
                    end: {
                        x: view.getFloat32(offset+12, true),
                        y: view.getFloat32(offset+16, true),
                        z: view.getFloat32(offset+20, true)
                    },
                    byteLength: 24
                };
                
            case 0x02: // ARC
                return {
                    center: {
                        x: view.getFloat32(offset, true),
                        y: view.getFloat32(offset+4, true),
                        z: view.getFloat32(offset+8, true)
                    },
                    radius: view.getFloat32(offset+12, true),
                    startAngle: view.getFloat32(offset+16, true),
                    endAngle: view.getFloat32(offset+20, true),
                    normal: {
                        x: view.getFloat32(offset+24, true),
                        y: view.getFloat32(offset+28, true),
                        z: view.getFloat32(offset+32, true)
                    },
                    byteLength: 36
                };
                
            default:
                return { byteLength: 0 };
        }
    }

    skipUnknownEntity(view, offset) {
        // Skip 4 bytes (default for unknown entities)
        return offset + 4;
    }

    convertToThreeJS(parsedData) {
        const group = new THREE.Group();
        
        parsedData.entities.forEach(entity => {
            switch(entity.type) {
                case 'LINE':
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(
                            entity.data.start.x,
                            entity.data.start.y,
                            entity.data.start.z
                        ),
                        new THREE.Vector3(
                            entity.data.end.x,
                            entity.data.end.y,
                            entity.data.end.z
                        )
                    ]);
                    const lineMaterial = new THREE.LineBasicMaterial({ 
                        color: 0x00ff00,
                        linewidth: 2
                    });
                    group.add(new THREE.Line(lineGeometry, lineMaterial));
                    break;
                    
                case 'ARC':
                    const arcPoints = this.generateArcPoints(entity.data);
                    const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
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
            points.push(new THREE.Vector3(
                arcData.center.x + arcData.radius * Math.cos(angle),
                arcData.center.y + arcData.radius * Math.sin(angle),
                arcData.center.z
            ));
        }
        
        return points;
    }
}
