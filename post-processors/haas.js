class HAASPostProcessor {
    static generate(toolpath) {
        if (!toolpath || !toolpath.operations) {
            throw new Error('Invalid toolpath');
        }
        
        const gcode = [];
        
        // Program header
        gcode.push('%');
        gcode.push(`O1000 (WEB-CAM PRO - ${new Date().toLocaleDateString()})`);
        gcode.push('G20 G17 G40 G49 G80 G90'); // Safety block
        gcode.push(`T${toolpath.tool.id} M6`);  // Tool change
        gcode.push(`G43 H${toolpath.tool.id}`); // Tool length compensation
        gcode.push(`S${toolpath.tool.rpm} M3`); // Spindle on
        gcode.push('G54');                      // Work coordinate system
        gcode.push('G0 Z5.0');                  // Safe Z
        
        // Toolpath operations
        toolpath.operations.forEach((op, idx) => {
            if (op.points.length < 2) return;
            
            // Rapid move to start
            gcode.push(`G0 X${op.points[0].x.toFixed(3)} Y${op.points[0].y.toFixed(3)}`);
            
            // Plunge
            gcode.push(`G1 Z${op.points[0].z.toFixed(3)} F${toolpath.tool.plunge}`);
            
            // Cutting moves
            for (let i = 1; i < op.points.length; i++) {
                gcode.push(
                    `G1 X${op.points[i].x.toFixed(3)} ` +
                    `Y${op.points[i].y.toFixed(3)} ` +
                    `Z${op.points[i].z.toFixed(3)} ` +
                    `F${op.feedrate}`
                );
            }
            
            // Retract every 10 operations
            if (idx % 10 === 0) {
                gcode.push('G0 Z5.0');
            }
        });
        
        // Program footer
        gcode.push('G0 Z5.0');  // Final retract
        gcode.push('M5');       // Spindle off
        gcode.push('G28 G91 Z0'); // Return to Z home
        gcode.push('G90');      // Absolute positioning
        gcode.push('M30');      // Program end
        gcode.push('%');        // End of file
        
        return gcode.join('\n');
    }
}
