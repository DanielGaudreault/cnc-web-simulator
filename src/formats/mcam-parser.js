class MCAMParser {
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
            reader.readAsText(file);
        });
    }

    parseData() {
        if (!this.fileData) {
            throw new Error("No file data loaded.");
        }

        const lines = this.fileData.split("\n");
        const toolpaths = [];
        const geometry = [];

        lines.forEach((line) => {
            if (line.startsWith("TOOLPATH")) {
                toolpaths.push(this._parseToolpath(line));
            } else if (line.startsWith("GEOMETRY")) {
                geometry.push(this._parseGeometry(line));
            }
        });

        return { toolpaths, geometry };
    }

    _parseToolpath(line) {
        const parts = line.split(",");
        return {
            id: parts[1],
            type: parts[2],
            feedRate: parseFloat(parts[3]),
            spindleSpeed: parseFloat(parts[4]),
            tool: parts[5],
            coordinates: parts.slice(6).map(coord => parseFloat(coord))
        };
    }

    _parseGeometry(line) {
        const parts = line.split(",");
        return {
            id: parts[1],
            type: parts[2],
            parameters: parts.slice(3).map(param => parseFloat(param))
        };
    }
}

export default MCAMParser;

