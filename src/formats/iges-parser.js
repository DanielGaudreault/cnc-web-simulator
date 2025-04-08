class IGESParser {
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
        const entities = [];

        lines.forEach(line => {
            if (line.startsWith("100")) {
                entities.push(this._parseCircularArc(line));
            } else if (line.startsWith("110")) {
                entities.push(this._parseLineEntity(line));
            } else if (line.startsWith("126")) {
                entities.push(this._parseBSplineCurve(line));
            }
        });

        return { entities };
    }

    _parseCircularArc(line) {
        const parts = line.split(",");
        return {
            type: "arc",
            center: { x: parseFloat(parts[1]), y: parseFloat(parts[2]), z: parseFloat(parts[3]) },
            radius: parseFloat(parts[4]),
            startAngle: parseFloat(parts[5]),
            endAngle: parseFloat(parts[6])
        };
    }

    _parseLineEntity(line) {
        const parts = line.split(",");
        return {
            type: "line",
            start: { x: parseFloat(parts[1]), y: parseFloat(parts[2]), z: parseFloat(parts[3]) },
            end: { x: parseFloat(parts[4]), y: parseFloat(parts[5]), z: parseFloat(parts[6]) }
        };
    }

    _parseBSplineCurve(line) {
        const parts = line.split(",");
        return {
            type: "bspline",
            controlPoints: parts.slice(1).map(coord => parseFloat(coord))
        };
    }
}

export default IGESParser;

