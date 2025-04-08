class CAMEngine {
    constructor(cadEngine) {
        this.cad = cadEngine;
        this.toolpaths = [];
        this.machineSetup = {
            units: 'mm',
            stock: null,
            workOffset: { x: 0, y: 0, z: 0 },
            rapidHeight: 10,
            safetyHeight: 5,
            programName: 'UNTITLED'
        };
    }

    createToolpath(type, geometryIds, params) {
        const geometries = geometryIds.map(id => this.cad.getObject(id));
        if (geometries.some(g => !g)) throw new Error('Invalid geometry ID');

        const toolpath = {
            id: `tp_${this.toolpaths.length}`,
            type,
            geometries: geometryIds,
            tool: params.tool,
            parameters: params,
            operations: this._generateOperations(type, geometries, params),
            name: params.name || `${type}_${this.toolpaths.length}`
        };

        this.toolpaths.push(toolpath);
        return toolpath;
    }

    getToolpath(id) {
        return this.toolpaths.find(tp => tp.id === id);
    }

    _generateOperations(type, geometries, params) {
        switch (type) {
            case 'contour':
                return this._generateContourOperations(geometries, params);
            case 'pocket':
                return this._generatePocketOperations(geometries, params);
            case 'drill':
                return this._generateDrillOperations(geometries, params);
            case 'surface':
                return this._generateSurfaceOperations(geometries, params);
            default:
                throw new Error(`Unknown toolpath type: ${type}`);
        }
    }

    _generateContourOperations(geometries, params) {
        const operations = [];
        const { tool, stepdown, stepover, direction } = params;
        
        geometries.forEach(geometry => {
            const profile = this._extractProfile(geometry);
            const levels = Math.ceil(profile.depth / stepdown);
            
            for (let level = 0; level < levels; level++) {
                const z = profile.top - (level * stepdown);
                const offset = (level % 2 === 0) ? tool.diameter * stepover : -tool.diameter * stepover;
                
                operations.push({
                    type: 'contour_pass',
                    geometryId: geometry.id,
                    z,
                    offset,
                    direction,
                    tool: tool.id,
                    movements: this._calculateContourMovements(profile, z, offset)
                });
            }
        });
        
        return operations;
    }

    _calculateContourMovements(profile, z, offset) {
        // Calculate actual tool movements
        const movements = [];
        
        // Simplified - would actually calculate tool engagement
        profile.points.forEach((point, i) => {
            if (i === 0) {
                movements.push({
                    type: 'rapid',
                    from: { x: point.x, y: point.y, z: this.machineSetup.rapidHeight },
                    to: { x: point.x, y: point.y, z: z + 1 }
                });
                
                movements.push({
                    type: 'feed',
                    from: { x: point.x, y: point.y, z: z + 1 },
                    to: { x: point.x, y: point.y, z: z }
                });
            } else {
                movements.push({
                    type: 'feed',
                    from: profile.points[i-1],
                    to: point
                });
            }
        });
        
        // Close the loop
        movements.push({
            type: 'feed',
            from: profile.points[profile.points.length - 1],
            to: profile.points[0]
        });
        
        // Retract
        movements.push({
            type: 'rapid',
            from: profile.points[0],
            to: { x: profile.points[0].x, y: profile.points[0].y, z: this.machineSetup.rapidHeight }
        });
        
        return movements;
    }

    simulateToolpath(toolpathId) {
        const toolpath = this.getToolpath(toolpathId);
        if (!toolpath) throw new Error('Toolpath not found');

        const stock = this.machineSetup.stock ? 
            this.cad.getObject(this.machineSetup.stock) : 
            null;

        const simulation = {
            toolpath: toolpathId,
            steps: [],
            remainingMaterial: stock ? this._cloneGeometry(stock.geometry) : null
        };

        toolpath.operations.forEach(op => {
            const opResult = this._simulateOperation(op, simulation.remainingMaterial);
            simulation.steps.push(opResult);
            
            if (simulation.remainingMaterial) {
                this._updateRemainingMaterial(simulation.remainingMaterial, opResult.materialRemoved);
            }
        });

        return simulation;
    }

    _extractProfile(geometry) {
        // Extract 2D profile from geometry
        // Simplified for example
        return {
            points: [
                { x: -5, y: -5, z: 0 },
                { x: 5, y: -5, z: 0 },
                { x: 5, y: 5, z: 0 },
                { x: -5, y: 5, z: 0 }
            ],
            top: 0,
            depth: 10
        };
    }
}
