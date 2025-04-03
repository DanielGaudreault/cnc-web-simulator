class GeometryUtils {
    static createGeometryFromData(data) {
        try {
            switch (data.type) {
                case "cube":
                    const cubeGeo = new THREE.BoxGeometry(
                        data.dimensions.x,
                        data.dimensions.y,
                        data.dimensions.z
                    );
                    cubeGeo.translate(
                        data.position?.x || 0,
                        data.position?.y || 0,
                        data.position?.z || 0
                    );
                    return cubeGeo;
                    
                case "cylinder":
                    const cylGeo = new THREE.CylinderGeometry(
                        data.radius,
                        data.radius,
                        data.height,
                        32
                    );
                    cylGeo.translate(
                        data.position?.x || 0,
                        data.position?.y || 0,
                        (data.position?.z || 0) + data.height/2
                    );
                    return cylGeo;
                    
                case "sphere":
                    const sphereGeo = new THREE.SphereGeometry(
                        data.radius,
                        32,
                        32
                    );
                    sphereGeo.translate(
                        data.position?.x || 0,
                        data.position?.y || 0,
                        data.position?.z || 0
                    );
                    return sphereGeo;
                    
                default:
                    console.warn(`Unknown geometry type: ${data.type}`);
                    return null;
            }
        } catch (error) {
            console.error("Error creating geometry:", error);
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
                },
                position: {
                    x: geometry.parameters.width / 2,
                    y: geometry.parameters.height / 2,
                    z: geometry.parameters.depth / 2
                }
            };
        }
        else if (geometry instanceof THREE.CylinderGeometry) {
            return {
                type: "cylinder",
                radius: geometry.parameters.radiusTop,
                height: geometry.parameters.height,
                position: {
                    x: 0,
                    y: 0,
                    z: -geometry.parameters.height / 2
                }
            };
        }
        else if (geometry instanceof THREE.SphereGeometry) {
            return {
                type: "sphere",
                radius: geometry.parameters.radius,
                position: {
                    x: 0,
                    y: 0,
                    z: 0
                }
            };
        }
        
        console.warn(`Unsupported geometry type for extraction: ${geometry.type}`);
        return null;
    }
}
