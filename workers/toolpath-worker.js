self.onmessage = function(event) {
    const { operation, data } = event.data;

    let result;
    switch (operation) {
        case "generateContour":
            result = generateContourToolpath(data.points);
            break;
        case "optimizePath":
            result = optimizeToolpath(data.toolpath);
            break;
        case "calculateFeedRate":
            result = adjustFeedRate(data.material, data.cuttingParams);
            break;
        default:
            result = { error: "Unknown operation" };
    }

    self.postMessage(result);
};

function generateContourToolpath(points) {
    return points.map((point, index) => ({
        from: points[index - 1] || point,
        to: point
    }));
}

function optimizeToolpath(toolpath) {
    return toolpath.filter((move, index, arr) => 
        index === 0 || move.to.x !== arr[index - 1].to.x || move.to.y !== arr[index - 1].to.y
    ); // Simplified optimization logic
}

function adjustFeedRate(material, cuttingParams) {
    const baseRate = material.hardness * cuttingParams.depth / cuttingParams.toolDiameter;
    return Math.max(baseRate, cuttingParams.minFeedRate);
}

