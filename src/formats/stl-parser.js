class STLParser {
    constructor() {
        this.fileData = null;
    }

    async loadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.fileData = event.target.result;
                resolve(this.parseData());
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    parseData() {
        if (!this.fileData) {
            throw new Error("No file data loaded.");
        }

        const isAscii = this._isAsciiFormat(this.fileData);
        return isAscii ? this._parseAsciiSTL() : this._parseBinarySTL();
    }

    _isAsciiFormat(buffer) {
        const header = new TextDecoder().decode(buffer.slice(0, 80));
        return header.includes("solid");
    }

    _parseAsciiSTL() {
        const text = new TextDecoder().decode(this.fileData);
        const lines = text.split("\n");
        const vertices = [];
        let currentFace = [];

        lines.forEach((line) => {
            const parts = line.trim().split(/\s+/);
            if (parts[0] === "vertex") {
                currentFace.push({ x: parseFloat(parts[1]), y: parseFloat(parts[2]), z: parseFloat(parts[3]) });
            }
            if (currentFace.length === 3) {
                vertices.push([...currentFace]);
                currentFace = [];
            }
        });

        return { vertices };
    }

    _parseBinarySTL() {
        const view = new DataView(this.fileData);
        const numTriangles = view.getUint32(80, true);
        const vertices = [];

        let offset = 84;
        for (let i = 0; i < numTriangles; i++) {
            const triangle = [];
            for (let j = 0; j < 3; j++) {
                triangle.push({
                    x: view.getFloat32(offset, true),
                    y: view.getFloat32(offset + 4, true),
                    z: view.getFloat32(offset + 8, true),
                });
                offset += 12;
            }
            vertices.push(triangle);
            offset += 2; // Skip attribute byte count
        }

        return { vertices };
    }
}

export default STLParser;

