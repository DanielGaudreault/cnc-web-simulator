class GRBLPostProcessor {
    static generate(toolpath) {
        if (!toolpath?.operations) throw new Error('Invalid toolpath');
        
        const gcode = [];
        const formatNumber = (num) => num.toFixed(3);
        
        // GRBL header
        gcode.push('(GRBL Post Processor)');
        gcode.push('G21 G90 G40'); // Metric, absolute, cutter comp off
        gcode.push(`S${toolpath.tool.rpm} M3`);
        
        // Toolpath operations optimized for GRBL
        toolpath.operations.forEach(op => {
            if (op.points.length < 2) return;
            
            // Rapid move to start
            gcode.push(
                `G0 X${formatNumber(op.points[0].x)} ` +
                `Y${formatNumber(op.points[0].y)}`
            );
            
            // Plunge
            gcode.push(`G1 Z${formatNumber(op.points[0].z)} F${toolpath.tool.plunge}`);
            
            // Cutting moves (explicit G1 for each move)
            for (let i = 1; i < op.points.length; i++) {
                gcode.push(
                    `G1 X${formatNumber(op.points[i].x)} ` +
                    `Y${formatNumber(op.points[i].y)} ` +
                    `Z${formatNumber(op.points[i].z)} ` +
                    `F${op.feedrate}`
                );
            }
            
            // Retract
            gcode.push('G0 Z5.0');
        });
        
        // GRBL footer
        gcode.push('M5');
        gcode.push('M30');
        
        return gcode.join('\n');
    }

    static optimizeForGRBL(gcode) {
        // GRBL-specific optimizations:
        // 1. Remove redundant G commands
        // 2. Limit line length to 128 characters
        // 3. Add mandatory pauses for buffer control
        
        let lines = gcode.split('\n');
        let optimized = [];
        let lastG = '';
        
        lines.forEach(line => {
            // Skip empty lines
            if (!line.trim()) return;
            
            // Handle G-command redundancy
            if (line.startsWith('G')) {
                const gCode = line.split(' ')[0];
                if (gCode === lastG) {
                    line = line.substring(gCode.length).trim();
                } else {
                    lastG = gCode;
                }
            }
            
            // Split long lines
            if (line.length > 120) {
                const parts = [];
                while (line.length > 0) {
                    parts.push(line.substring(0, 120));
                    line = line.substring(120);
                }
                optimized.push(...parts);
            } else {
                optimized.push(line);
            }
        });
        
        return optimized.join('\n');
    }
}
