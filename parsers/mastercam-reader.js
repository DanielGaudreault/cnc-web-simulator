class MastercamParser {
    constructor() {
        this.debug = true;
        this.geometryTypes = {
            0x01: 'LINE',
            0x02: 'ARC',
            0x03: 'NURBS',
            0x04: 'POINT'
        };
    }

    async parse(arrayBuffer) {
        console.log("[Mastercam] Starting file parsing...");
        const view = new DataView(arrayBuffer);
        
        // 1. Verify File Signature
        const signature = String.fromCharCode(
            view.getUint8(0),
            view.getUint8(1),
            view.getUint8(2),
            view.getUint8(3)
        );
        
        if (signature !== 'MCAX') {
            throw new Error(`Invalid Mastercam file signature: ${signature}`);
        }
        console.log("[Mastercam] Valid signature found");

        // 2. Read Header
        const version = view.getUint16(4, true);
        const units = view.getUint8(6) === 0 ? 'inches' : 'mm';
        const headerSize = 32; // Typical Mastercam header size
        
        console.log(`[Mastercam] Version: ${version}, Units: ${units}, Header size: ${headerSize} bytes`);

        // 3. Parse Entities
        const entities = [];
        let offset = headerSize;
        let entityCount = 0;

        while (offset < arrayBuffer.byteLength) {
            const entityType = view.getUint8(offset);
            offset += 1;
            
            if (!this.geometryTypes[entityType]) {
                console.warn(`[Mastercam] Unknown entity type at offset ${offset}: 0x${entityType.toString(16)}`);
                offset = this.skipUnknownEntity(view, offset);
                continue;
            }

            const entityName = this.geometryTypes[entityType];
            console.log(`[Mastercam] Found ${entityName} at offset ${offset}`);
            
            try {
                const entity = {
                    type: entityName,
                    data: this.parseEntity(view, offset, entityType)
                };
                entities.push(entity);
                offset += entity.data.byteLength;
                entityCount++;
            } catch (e) {
                console.error(`[Mastercam] Error parsing entity at offset ${offset}:`, e);
                break;
            }
        }

        console.log(`[Mastercam] Parsed ${entityCount} entities successfully`);
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
                const lineData = {
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
                console.log(`[Mastercam] Line from (${lineData.start.x},${lineData.start.y},${lineData.start.z}) to (${lineData.end.x},${lineData.end.y},${lineData.end.z})`);
                return lineData;
                
            case 0x02: // ARC
                const arcData = {
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
                console.log(`[Mastercam] Arc at (${arcData.center.x},${arcData.center.y}) R=${arcData.radius} from ${arcData.startAngle} to ${arcData.endAngle}°`);
                return arcData;
                
            default:
                return { byteLength: 0 };
        }
    }

    skipUnknownEntity(view, offset) {
        // Skip 4 bytes by default (adjust based on your file format)
        return offset + 4;
    }

    convertToThreeJS(parsedData) {
        console.log("[Mastercam] Converting to Three.js geometry...");
        const group = new THREE.Group();
        
        parsedData.entities.forEach((entity, index) => {
            try {
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
                        const line = new THREE.Line(lineGeometry, lineMaterial);
                        line.name = `line_${index}`;
                        group.add(line);
                        break;
                        
                    case 'ARC':
                        const arcPoints = this.generateArcPoints(entity.data);
                        const arcGeometry = new THREE.BufferGeometry().setFromPoints(
                            arcPoints.map(p => new THREE.Vector3(p.x, p.y, p.z))
                        );
                        const arcMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
                        const arc = new THREE.Line(arcGeometry, arcMaterial);
                        arc.name = `arc_${index}`;
                        group.add(arc);
                        break;
                }
            } catch (e) {
                console.error(`[Mastercam] Error converting entity ${index}:`, e);
            }
        });
        
        console.log("[Mastercam] Conversion complete");
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
}
