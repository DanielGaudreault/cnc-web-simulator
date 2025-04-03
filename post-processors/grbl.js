class GRBLPostProcessor {
    static generate(toolpath) {
        const gcode = [];
        
        // GRBL header (simplified)
        gcode.push('(GRBL Post Processor)');
        gcode.push('G21 G90 G40'); // Metric, absolute, cutter comp off
        gcode.push(`S${toolpath.tool.rpm} M3`);
        
        // Toolpath optimized for GRBL
        toolpath.operations.forEach(op => {
            if (op.points.length < 2) return;
            
            gcode.push(`G0 X${op.points[0].x.toFixed(3)} Y${op.points[0].y.toFixed(3)}`);
            gcode.push(`G1 Z${op.points[0].z.toFixed(3)} F${toolpath.tool.plunge}`);
            
            for (let i = 1; i < op.points.length; i++) {
                gcode.push(
                    `G1 X${op.points[i].x.toFixed(3)} ` +
                    `Y${op.points[i].y.toFixed(3)} ` +
                    `Z${op.points[i].z.toFixed(3)} ` +
                    `F${op.feedrate}`
                );
            }
        });
        
        // GRBL footer
        gcode.push('G0 Z5.0');
        gcode.push('M5');
        gcode.push('M30');
        
        return gcode.join('\n');
    }
}
