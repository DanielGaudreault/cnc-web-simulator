class NCGenerator {
    constructor() {
        this.postProcessors = {
            'generic': this._genericPostProcessor,
            'fanuc': this._fanucPostProcessor,
            'haas': this._haasPostProcessor
        };
    }

    generateGCode(toolpaths, machineSetup, postProcessor = 'generic') {
        if (!this.postProcessors[postProcessor]) {
            throw new Error(`Unknown post processor: ${postProcessor}`);
        }
        
        let gcode = [];
        
        // Add header
        gcode.push(`%`);
        gcode.push(`(Program: ${machineSetup.programName || 'Untitled'})`);
        gcode.push(`(Post processor: ${postProcessor})`);
        gcode.push(`(Date: ${new Date().toLocaleString()})`);
        gcode.push('');
        
        // Initialize machine
        gcode.push(...this.postProcessors[postProcessor].init(machineSetup));
        
        // Generate toolpaths
        for (const toolpath of toolpaths) {
            gcode.push(...this._generateToolpathGCode(toolpath, postProcessor));
        }
        
        // Add footer
        gcode.push(...this.postProcessors[postProcessor].end());
        gcode.push(`%`);
        
        return gcode.join('\n');
    }

    _generateToolpathGCode(toolpath, postProcessor) {
        const processor = this.postProcessors[postProcessor];
        let gcode = [];
        
        // Tool change
        gcode.push(...processor.toolChange(toolpath.tool));
        
        // Generate movement commands based on toolpath type
        switch (toolpath.type) {
            case 'contour':
                gcode.push(...this._generateContourPath(toolpath, processor));
                break;
            case 'pocket':
                gcode.push(...this._generatePocketPath(toolpath, processor));
                break;
            case 'drill':
                gcode.push(...this._generateDrillCycle(toolpath, processor));
                break;
            default:
                console.warn(`Unknown toolpath type: ${toolpath.type}`);
        }
        
        return gcode;
    }

    _genericPostProcessor = {
        init: (setup) => [
            'G90 G94 G17 G40 G49 G80',
            'G21 (Metric)',
            `G53 G00 Z${setup.safeZ || 50.0}`
        ],
        
        toolChange: (tool) => [
            `T${tool.number} M06`,
            `G43 H${tool.number}`,
            `S${tool.rpm} M03`
        ],
        
        end: () => [
            'M05',
            'G53 G00 Z0',
            'M30'
        ]
    };
}
