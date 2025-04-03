class GeometryUtils {
    static createGeometryFromData(data) {
        switch (data.type) {
            case "cube":
                return new THREE.BoxGeometry(
                    data.dimensions.x,
                    data.dimensions.y,
                    data.dimensions.z
                );
                
            case "cylinder":
                return new THREE.CylinderGeometry(
                    data.radius,
                    data.radius,
                    data.height,
                    32
                );
                
            case "sphere":
                return new THREE.SphereGeometry(
                    data.radius,
                    32,
                    32
                );
                
            default:
                console.warn(`Unknown geometry type: ${data.type}`);
                return null;
        }
    }
    
    static extractGeometryData(geometry) {
        if (geometry instanceof THREE.BoxGeometry) {
            return {
                type: "cube",
                dimensions: {
                    x: geometry.parameters.width,
                    y: geometry.parameters.height,
                    z: geometry.parameters.depth
                }
            };
        }
        else if (geometry instanceof THREE.CylinderGeometry) {
            return {
                type: "cylinder",
                radius: geometry.parameters.radiusTop,
                height: geometry.parameters.height
            };
        }
        else if (geometry instanceof THREE.SphereGeometry) {
            return {
                type: "sphere",
                radius: geometry.parameters.radius
            };
        }
        
        console.warn(`Unsupported geometry type for extraction: ${geometry.type}`);
        return null;
    }
    
    static createToolpathVisualization(toolpath) {
        // Create a visual representation of a toolpath
        const points = toolpath.paths.map(p => 
            new THREE.Vector3(p.x, p.y, p.z)
        );
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: toolpath.color || 0xff0000,
            linewidth: 2
        });
        
        return new THREE.Line(geometry, material);
    }
}
