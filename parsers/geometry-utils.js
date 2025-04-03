class GeometryUtils {
    static calculateBoundingBox(entities) {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        entities.forEach(entity => {
            switch(entity.type) {
                case 'LINE':
                    minX = Math.min(minX, entity.data.start.x, entity.data.end.x);
                    minY = Math.min(minY, entity.data.start.y, entity.data.end.y);
                    minZ = Math.min(minZ, entity.data.start.z, entity.data.end.z);
                    maxX = Math.max(maxX, entity.data.start.x, entity.data.end.x);
                    maxY = Math.max(maxY, entity.data.start.y, entity.data.end.y);
                    maxZ = Math.max(maxZ, entity.data.start.z, entity.data.end.z);
                    break;
                case 'ARC':
                    const arcPoints = this.generateArcPoints(entity.data, 8);
                    arcPoints.forEach(point => {
                        minX = Math.min(minX, point.x);
                        minY = Math.min(minY, point.y);
                        minZ = Math.min(minZ, point.z);
                        maxX = Math.max(maxX, point.x);
                        maxY = Math.max(maxY, point.y);
                        maxZ = Math.max(maxZ, point.z);
                    });
                    break;
            }
        });

        return {
            min: { x: minX, y: minY, z: minZ },
            max: { x: maxX, y: maxY, z: maxZ },
            size: { 
                x: maxX - minX, 
                y: maxY - minY, 
                z: maxZ - minZ 
            }
        };
    }

    static generateArcPoints(arcData, segments = 32) {
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

    static convertToThreeJSMesh(geometryData, materialParams = {}) {
        const group = new THREE.Group();
        
        // Create materials
        const defaultMaterial = new THREE.MeshStandardMaterial({
            color: 0x00aaff,
            metalness: 0.3,
            roughness: 0.7,
            side: THREE.DoubleSide,
            ...materialParams
        });

        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            linewidth: 2
        });

        // Process geometry data
        geometryData.forEach(entity => {
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
                    group.add(new THREE.Line(lineGeometry, lineMaterial));
                    break;
                    
                case 'ARC':
                    const arcPoints = this.generateArcPoints(entity.data).map(
                        p => new THREE.Vector3(p.x, p.y, p.z)
                    );
                    const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
                    group.add(new THREE.Line(arcGeometry, lineMaterial));
                    break;
                    
                case 'FACE':
                    const shape = new THREE.Shape();
                    // Convert face data to Three.js shape
                    // (Implementation depends on your face data structure)
                    const faceGeometry = new THREE.ShapeGeometry(shape);
                    group.add(new THREE.Mesh(faceGeometry, defaultMaterial));
                    break;
            }
        });

        return group;
    }
}
