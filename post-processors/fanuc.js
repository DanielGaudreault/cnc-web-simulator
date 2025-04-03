class FanucPostProcessor {
    static generate(toolpath) {
        const gcode = [];
        
        // Fanuc-specific header
        gcode.push('%');
        gcode.push(`O2000 (FANUC POST)`);
        gcode.push('G20 G17 G40 G49 G80 G90');
        gcode.push(`T${toolpath.tool.id} M6`);
        gcode.push(`G43 H${toolpath.tool.id}`);
        gcode.push(`S${toolpath.tool.rpm} M3`);
        gcode.push('G54');
        gcode.push('G0 Z5.0');
        
        // Toolpath (Fanuc often uses different formatting)
        toolpath.operations.forEach(op => {
            if (op.points.length < 2) return;
            
            gcode.push(`G0 X${op.points[0].x.toFixed(3)} Y${op.points[0].y.toFixed(3)}`);
            gcode.push(`G1 Z${op.points[0].z.toFixed(3)} F${toolpath.tool.plunge}`);
            
            for (let i = 1; i < op.points.length; i++) {
                gcode.push(
                    `X${op.points[i].x.toFixed(3)} ` +
                    `Y${op.points[i].y.toFixed(3)} ` +
                    `Z${op.points[i].z.toFixed(3)} ` +
                    `F${op.feedrate}`
                );
            }
        });
        
        // Fanuc footer
        gcode.push('G0 Z5.0');
        gcode.push('M5');
        gcode.push('G91 G28 Z0');
        gcode.push('G90');
        gcode.push('M30');
        gcode.push('%');
        
        return gcode.join('\n');
    }
}
