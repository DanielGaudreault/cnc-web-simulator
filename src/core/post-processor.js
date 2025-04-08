class PostProcessor {
    constructor() {
        this.controllers = {
            'generic': this._genericController,
            'fanuc': this._fanucController,
            'haas': this._haasController,
            'heidenhain': this._heidenhainController,
            'mazak': this._mazakController
        };
    }

    generate(toolpaths, machineSetup, controllerType = 'generic') {
        const controller = this.controllers[controllerType];
        if (!controller) {
            throw new Error(`Unsupported controller type: ${controllerType}`);
        }

        let gcode = [];
        
        // Add header
        gcode.push(...controller.header(machineSetup));
        
        // Process each toolpath
        toolpaths.forEach(toolpath => {
            gcode.push(...this._processToolpath(toolpath, controller));
        });
        
        // Add footer
        gcode.push(...controller.footer(machineSetup));
        
        return gcode.join('\n');
    }

    _processToolpath(toolpath, controller) {
        let gcode = [];
        
        // Tool change
        gcode.push(...controller.toolChange(toolpath.tool));
        
        // Coolant commands
        if (toolpath.parameters.coolant) {
            gcode.push(...controller.coolantOn(toolpath.parameters.coolant));
        }
        
        // Process operations
        toolpath.operations.forEach(op => {
            gcode.push(...this._processOperation(op, controller));
        });
        
        // Coolant off
        if (toolpath.parameters.coolant) {
            gcode.push(...controller.coolantOff());
        }
        
        return gcode;
    }

    _genericController = {
        header: (setup) => [
            '%',
            `(PROGRAM NAME: ${setup.programName || 'UNNAMED'})`,
            `(POST: GENERIC ${new Date().toLocaleDateString()})`,
            `(UNITS: ${setup.units.toUpperCase()})`,
            'G90 G94 G17 G40 G49 G80',
            `G53 G00 Z${setup.safetyHeight || 50.0}`
        ],
        
        toolChange: (tool) => [
            `(TOOL: ${tool.number} - ${tool.description})`,
            `T${tool.number} M06`,
            `G43 H${tool.number}`,
            `S${tool.rpm} M03`
        ],
        
        coolantOn: (type) => [
            type === 'flood' ? 'M08' : 'M07'
        ],
        
        coolantOff: () => [
            'M09'
        ],
        
        footer: () => [
            'M05',
            'G53 G00 Z0',
            'M30',
            '%'
        ]
    };

    _fanucController = {
        // Fanuc-specific implementation
    };

    addCustomController(name, definition) {
        if (this.controllers[name]) {
            throw new Error(`Controller ${name} already exists`);
        }
        
        this.controllers[name] = definition;
    }
}
