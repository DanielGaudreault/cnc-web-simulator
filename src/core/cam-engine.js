class CAMEngine {
    constructor(cadEngine) {
        this.cad = cadEngine;
        this.toolpaths = [];
        this.machineSetup = {
            units: 'mm',
            stock: null,
            workOffset: { x: 0, y: 0, z: 0 },
            rapidHeight: 10,
            safetyHeight: 5
        };
    }

    createToolpath(type, geometryIds, params) {
        const geometries = geometryIds.map(id => this.cad.objects.find(o => o.id === id));
        if (geometries.some(g => !g)) throw new Error('Invalid geometry ID');

        const toolpath = {
            id: `tp_${this.toolpaths.length}`,
            type,
            geometries: geometryIds,
            tool: params.tool,
            parameters: params,
            operations: this._generateOperations(type, geometries, params)
        };

        this.toolpaths.push(toolpath);
        return toolpath;
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
                    tool: tool.id
                });
            }
        });
        
        return operations;
    }

    simulateToolpath(toolpathId) {
        const toolpath = this.toolpaths.find(tp => tp.id === toolpathId);
        if (!toolpath) throw new Error('Toolpath not found');

        const stock = this.machineSetup.stock ? 
            this.cad.objects.find(o => o.id === this.machineSetup.stock) : 
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
}
