class FanucPostProcessor {
    static generate(toolpath) {
        if (!toolpath?.operations) throw new Error('Invalid toolpath');
        
        const gcode = [];
        const formatNumber = (num) => num.toFixed(3).replace(/\.?0+$/, '');
        
        // Program header
        gcode.push('%');
        gcode.push(`O2000 (FANUC POST - ${new Date().toLocaleDateString()})`);
        gcode.push('G20 G17 G40 G49 G80 G90');
        gcode.push(`T${toolpath.tool.id} M6`);
        gcode.push(`G43 H${toolpath.tool.id}`);
        gcode.push(`S${toolpath.tool.rpm} M3`);
        gcode.push('G54');
        gcode.push('G0 Z5.0');
        
        // Toolpath operations
        toolpath.operations.forEach((op, idx) => {
            if (op.points.length < 2) return;
            
            // Rapid positioning
            gcode.push(
                `G0 X${formatNumber(op.points[0].x)} ` +
                `Y${formatNumber(op.points[0].y)}`
            );
            
            // Plunge
            gcode.push(`G1 Z${formatNumber(op.points[0].z)} F${toolpath.tool.plunge}`);
            
            // Cutting moves (Fanuc often omits G1 after first move)
            gcode.push(
                `X${formatNumber(op.points[1].x)} ` +
                `Y${formatNumber(op.points[1].y)} ` +
                `Z${formatNumber(op.points[1].z)} ` +
                `F${op.feedrate}`
            );
            
            for (let i = 2; i < op.points.length; i++) {
                gcode.push(
                    `X${formatNumber(op.points[i].x)} ` +
                    `Y${formatNumber(op.points[i].y)} ` +
                    `Z${formatNumber(op.points[i].z)}`
                );
            }
            
            // Retract every 5 operations for chip clearance
            if (idx % 5 === 0) {
                gcode.push('G0 Z5.0');
            }
        });
        
        // Program footer
        gcode.push('G0 Z5.0');
        gcode.push('M5');
        gcode.push('G91 G28 Z0');
        gcode.push('G90');
        gcode.push('M30');
        gcode.push('%');
        
        return gcode.join('\n');
    }
}
