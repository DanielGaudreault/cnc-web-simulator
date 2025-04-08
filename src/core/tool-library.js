class ToolLibrary {
    constructor() {
        this.tools = [];
        this.categories = {
            'endmill': [],
            'drill': [],
            'facemill': [],
            'tap': [],
            'chamfer': [],
            'slotmill': []
        };
    }

    addTool(tool) {
        if (!tool.type || !this.categories[tool.type]) {
            throw new Error(`Invalid tool type: ${tool.type}`);
        }

        tool.id = `tool_${this.tools.length}`;
        this.tools.push(tool);
        this.categories[tool.type].push(tool.id);
        return tool.id;
    }

    getTool(id) {
        return this.tools.find(t => t.id === id);
    }

    findTools(filter) {
        return this.tools.filter(tool => {
            return Object.keys(filter).every(key => {
                if (key === 'diameter') {
                    return Math.abs(tool[key] - filter[key]) < 0.001;
                }
                return tool[key] === filter[key];
            });
        });
    }

    importFromLibrary(libraryData) {
        if (libraryData.version !== 1) {
            throw new Error('Unsupported library version');
        }

        libraryData.tools.forEach(tool => {
            this.addTool(tool);
        });
    }

    exportLibrary() {
        return {
            version: 1,
            date: new Date().toISOString(),
            count: this.tools.length,
            tools: this.tools
        };
    }

    createDefaultLibrary() {
        // Metric end mills
        [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25].forEach(dia => {
            this.addTool({
                type: 'endmill',
                number: this.tools.length + 1,
                diameter: dia,
                description: `${dia}mm End Mill`,
                fluteLength: dia * 3,
                shoulderLength: dia * 5,
                flutes: dia <= 3 ? 2 : 4,
                material: 'carbide',
                coating: 'TiAlN'
            });
        });

        // Drills
        [1.5, 2.5, 3.3, 4.2, 5, 6, 6.8, 8.5, 10.5, 12.5].forEach(dia => {
            this.addTool({
                type: 'drill',
                number: this.tools.length + 1,
                diameter: dia,
                description: `${dia}mm Drill`,
                pointAngle: 118,
                length: dia * 10,
                material: 'HSS',
                coating: 'none'
            });
        });
    }
}
