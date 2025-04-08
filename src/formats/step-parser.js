import { Parser } from 'step-parser'; // Assuming you're using an external STEP parser

class STEPParser {
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

        const stepEntities = new Parser(this.fileData).parse();
        const geometry = stepEntities.map(entity => this._parseEntity(entity));

        return { geometry };
    }

    _parseEntity(entity) {
        return {
            id: entity.id,
            type: entity.type,
            parameters: entity.parameters
        };
    }
}

export default STEPParser;

