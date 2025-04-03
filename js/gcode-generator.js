class GCodeGenerator {
    constructor(options = {}) {
        this.postProcessor = options.postProcessor || GrblPostProcessor;
        this.tools = options.tools || [];
        this.materials = options.materials || [];
        this.defaultFeedrate = 100;
        this.defaultSpindleSpeed = 1000;
    }
    
    generate(toolpaths, operations) {
        let gcode = "";
        
        // Add header
        gcode += this.postProcessor.getHeader();
        gcode += "\n";
        
        // Add setup commands
        gcode += this.postProcessor.getSetupCommands();
        gcode += "\n";
        
        // Process each toolpath
        toolpaths.forEach((toolpath, index) => {
            const operation = operations.find(op => op.toolpathId === toolpath.id);
            if (!operation && index === 0) {
                // If no operations, just use the first toolpath
                operation = { type: "custom" };
            }
            if (!operation) return;
            
            // Tool change
            const tool = this.tools.find(t => t.name === toolpath.tool) || {
                diameter: 0.5,
                length: 2.0
            };
            
            gcode += this.postProcessor.getToolChangeCommand(
                index + 1,
                tool.diameter,
                tool.length
            );
            
            // Spindle on
            gcode += this.postProcessor.getSpindleOnCommand(
                toolpath.parameters?.spindleSpeed || this.defaultSpindleSpeed,
                toolpath.parameters?.spindleDirection || "CW"
            );
            
            // Feedrate
            const feedrate = toolpath.parameters?.feedrate || this.defaultFeedrate;
            gcode += this.postProcessor.getFeedrateCommand(feedrate);
            
            // Coolant (if specified)
            if (toolpath.parameters?.coolant) {
                gcode += this.postProcessor.getCoolantCommand(toolpath.parameters.coolant);
            }
            
            // Toolpath moves
            if (toolpath.paths && toolpath.paths.length > 0) {
                // Rapid to start position
                const firstPoint = toolpath.paths[0];
                gcode += this.postProcessor.getRapidMoveCommand(
                    firstPoint.x,
                    firstPoint.y,
                    firstPoint.z + 5 // Safe Z
                );
                
                // Move to start position
                gcode += this.postProcessor.getLinearMoveCommand(
                    firstPoint.x,
                    firstPoint.y,
                    firstPoint.z
                );
                
                // Process all points
                for (let i = 1; i < toolpath.paths.length; i++) {
                    const point = toolpath.paths[i];
                    gcode += this.postProcessor.getLinearMoveCommand(
                        point.x,
                        point.y,
                        point.z
                    );
                }
            }
            
            // Retract
            if (toolpath.paths && toolpath.paths.length > 0) {
                const lastPoint = toolpath.paths[toolpath.paths.length - 1];
                gcode += this.postProcessor.getRapidMoveCommand(
                    lastPoint.x,
                    lastPoint.y,
                    lastPoint.z + 5 // Safe Z
                );
            }
            
            // Spindle off
            gcode += this.postProcessor.getSpindleOffCommand();
            
            // Add a separator between toolpaths
            gcode += "\n";
        });
        
        // Add footer
        gcode += this.postProcessor.getFooter();
        
        return gcode;
    }
}
