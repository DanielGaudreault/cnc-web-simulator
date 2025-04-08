self.onmessage = function(event) {
    const { operation, data } = event.data;

    let result;
    switch (operation) {
        case "computeBoundingBox":
            result = computeBoundingBox(data.vertices);
            break;
        case "transformGeometry":
            result = applyTransformation(data.geometry, data.transform);
            break;
        case "calculateIntersections":
            result = findIntersections(data.shapes);
            break;
        default:
            result = { error: "Unknown operation" };
    }

    self.postMessage(result);
};

function computeBoundingBox(vertices) {
    return {
        min: {
            x: Math.min(...vertices.map(v => v.x)),
            y: Math.min(...vertices.map(v => v.y)),
            z: Math.min(...vertices.map(v => v.z)),
        },
        max: {
            x: Math.max(...vertices.map(v => v.x)),
            y: Math.max(...vertices.map(v => v.y)),
            z: Math.max(...vertices.map(v => v.z)),
        }
    };
}

function applyTransformation(geometry, transform) {
    return geometry.map(vertex => ({
        x: vertex.x * transform.scale.x + transform.translate.x,
        y: vertex.y * transform.scale.y + transform.translate.y,
        z: vertex.z * transform.scale.z + transform.translate.z,
    }));
}

function findIntersections(shapes) {
    return shapes.filter(shape => shape.intersects); // Simplified intersection logic
}

