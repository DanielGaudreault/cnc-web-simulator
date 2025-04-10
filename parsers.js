class GcodeParser {
    constructor(gcode) {
        this.gcode = gcode;
    }

    parse() {
        const lines = this.gcode.split('\n');
        const toolpaths = [];
        let currentPath = { points: [], toolNumber: 'T1' };
        let x = 0, y = 0, z = 0;

        lines.forEach(line => {
            if (line.startsWith('G00') || line.startsWith('G01') || line.startsWith('G02')) {
                const parts = line.split(' ');
                parts.forEach(part => {
                    if (part.startsWith('X')) x = parseFloat(part.slice(1));
                    if (part.startsWith('Y')) y = parseFloat(part.slice(1));
                    if (part.startsWith('Z')) z = parseFloat(part.slice(1));
                });
                currentPath.points.push({ x, y, z });
            } else if (line.startsWith('T')) {
                currentPath.toolNumber = line.split(' ')[0];
            } else if (line.startsWith('M30') && currentPath.points.length) {
                toolpaths.push(currentPath);
                currentPath = { points: [], toolNumber: currentPath.toolNumber };
            }
        });

        if (currentPath.points.length) toolpaths.push(currentPath);
        return { success: true, toolpaths, units: 'mm' };
    }
}
