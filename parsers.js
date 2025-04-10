class GcodeParser {
    constructor(text) {
        this.text = text;
    }

    parse() {
        const lines = this.text.split('\n');
        const toolpaths = [];
        let currentTool = 'T1';
        let points = [];
        let lastPos = { x: 0, y: 0, z: 0, a: 0, feedRate: 0 };
        let units = 'mm';

        lines.forEach(line => {
            line = line.trim().toUpperCase();
            if (!line || line.startsWith(';') || line.startsWith('(')) return;
            if (line.includes('G20')) units = 'inch';
            if (line.includes('G21')) units = 'mm';
            if (line.startsWith('T')) {
                if (points.length) toolpaths.push({ toolNumber: currentTool, points });
                points = [];
                currentTool = line.match(/T(\d+)/)?.[0] || 'T1';
            } else if (line.match(/G[0-3]/) || line.includes('G254') || line.includes('G605')) { // Haas/Okuma specific
                const coords = line.match(/[XYZA][-\d.]+|F[\d.]+/g) || [];
                const point = { ...lastPos };
                coords.forEach(c => {
                    const value = parseFloat(c.substring(1));
                    if (c[0] === 'X') point.x = value;
                    if (c[0] === 'Y') point.y = value;
                    if (c[0] === 'Z') point.z = value;
                    if (c[0] === 'A') point.a = value;
                    if (c[0] === 'F') point.feedRate = value;
                });
                points.push(point);
                lastPos = { ...point };
            }
        });

        if (points.length) toolpaths.push({ toolNumber: currentTool, points });
        return { success: true, toolpaths, units };
    }
}

class McamParser {
    constructor(buffer) {
        this.buffer = buffer;
        this.dataView = new DataView(buffer);
        this.offset = 0;
        this.littleEndian = true;
    }

    parse() {
        try {
            const magic = this.readString(4);
            if (!['MCAM', 'MMC2'].includes(magic)) throw new Error('Invalid MCAM header');
            const version = this.readUint32();
            const toolpaths = this.parseToolpaths();
            return { success: true, toolpaths, units: 'mm' };
        } catch (error) {
            console.error('MCAM parsing failed:', error);
            return { success: false, error: error.message };
        }
    }

    parseToolpaths() {
        const pathCount = this.readUint16();
        const toolpaths = [];
        for (let i = 0; i < pathCount; i++) {
            const toolNumber = `T${this.readUint16()}`;
            const points = this.readPathPoints();
            toolpaths.push({ toolNumber, points });
        }
        return toolpaths;
    }

    readPathPoints() {
        const pointCount = this.readUint32();
        const points = [];
        for (let i = 0; i < pointCount; i++) {
            points.push({
                x: this.readFloat(),
                y: this.readFloat(),
                z: this.readFloat(),
                feedRate: this.readFloat(),
                a: 0
            });
        }
        return points;
    }

    readUint32() { const v = this.dataView.getUint32(this.offset, this.littleEndian); this.offset += 4; return v; }
    readUint16() { const v = this.dataView.getUint16(this.offset, this.littleEndian); this.offset += 2; return v; }
    readFloat() { const v = this.dataView.getFloat32(this.offset, this.littleEndian); this.offset += 4; return v; }
    readString(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            const char = this.dataView.getUint8(this.offset++);
            if (char !== 0) result += String.fromCharCode(char);
        }
        return result;
    }
}
