class CAMCore {
    static generateAdaptiveClearing(model, tool, material) {
        if (!model || !tool || !material) {
            throw new Error('Missing required parameters');
        }
        
        // Get model bounding box
        model.geometry.computeBoundingBox();
        const bbox = model.geometry.boundingBox;
        
        // Calculate parameters
        const stepover = tool.diameter * 0.4;
        const stepdown = tool.stepdown;
        const feedrate = this.calculateFeedrate(tool, material);
        
        const toolpath = {
            type: 'adaptive',
            tool: tool,
            material: material,
            operations: []
        };
        
        // Generate toolpath layers
        for (let z = bbox.max.z; z >= bbox.min.z; z -= stepdown) {
            const layerOps = this.generateLayerToolpath(bbox, z, stepover, feedrate);
            toolpath.operations.push(...layerOps);
        }
        
        return toolpath;
    }
    
    static generateLayerToolpath(bbox, z, stepover, feedrate) {
        const operations = [];
        const direction = z % (stepover * 2) === 0 ? 1 : -1;
        const xStart = direction === 1 ? bbox.min.x : bbox.max.x;
        const xEnd = direction === 1 ? bbox.max.x : bbox.min.x;
        
        for (let x = xStart; 
             direction === 1 ? x <= xEnd : x >= xEnd; 
             x += stepover * direction) {
            
            operations.push({
                type: 'cut',
                points: [
                    { x: x, y: bbox.min.y, z: z },
                    { x: x, y: bbox.max.y, z: z }
                ],
                feedrate: feedrate
            });
        }
        
        return operations;
    }
    
    static calculateFeedrate(tool, material) {
        return tool.flutes * material.feedPerTooth * tool.rpm;
    }
}
