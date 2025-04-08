class MastercamWebApp {
    constructor() {
        // Initialize core systems
        this.geometryKernel = new GeometryKernel();
        this.cadEngine = new CADEngine();
        this.camEngine = new CAMEngine(this.cadEngine);
        this.fileIO = new MastercamFileIO();
        this.toolLibrary = new ToolLibrary();
        this.postProcessor = new PostProcessor();
        
        // Initialize UI components
        this.ribbonUI = new RibbonUI();
        this.cadViewer = new CADViewer();
        this.treeView = new TreeView();
        this.propertyEditor = new PropertyEditor();
        this.toolpathVisualizer = new ToolpathVisualizer();
        
        // Setup default tools
        this.toolLibrary.createDefaultLibrary();
        
        // Current state
        this.currentFile = null;
        this.undoStack = [];
        this.redoStack = [];
        
        // Initialize event listeners
        this._setupEventListeners();
        this._setupKeyboardShortcuts();
        
        // Start render loop
        this._render();
    }

    async openFile(file) {
        try {
            const fileData = await this.fileIO.importFile(file);
            this.currentFile = fileData;
            
            // Process geometry
            const threeGeometry = this.geometryKernel.convertToThreeJS(fileData.geometry);
            this.cadViewer.addGeometry(threeGeometry);
            
            // Update UI
            this.treeView.update(fileData);
            this.propertyEditor.update(fileData.metadata);
            
            // Process toolpaths if any
            if (fileData.toolpaths && fileData.toolpaths.length > 0) {
                this.toolpathVisualizer.showToolpaths(fileData.toolpaths);
            }
            
        } catch (error) {
            console.error('Error opening file:', error);
            this._showError(`Failed to open file: ${error.message}`);
        }
    }

    async saveFile(filename = 'untitled.mcam') {
        if (!this.currentFile) {
            this._showError('No file to save');
            return;
        }
        
        try {
            const exportData = {
                geometry: this.cadEngine.getCurrentGeometry(),
                toolpaths: this.camEngine.toolpaths,
                metadata: this.currentFile.metadata
            };
            
            const blob = await this.fileIO.exportFile(exportData, 'mcam');
            this._downloadFile(blob, filename);
            
        } catch (error) {
            console.error('Error saving file:', error);
            this._showError(`Failed to save file: ${error.message}`);
        }
    }

    generateGCode(controllerType = 'generic') {
        if (!this.camEngine.toolpaths || this.camEngine.toolpaths.length === 0) {
            this._showError('No toolpaths to generate');
            return;
        }
        
        const gcode = this.postProcessor.generate(
            this.camEngine.toolpaths,
            this.camEngine.machineSetup,
            controllerType
        );
        
        this._downloadFile(
            new Blob([gcode], { type: 'text/plain' }),
            `program_${new Date().toISOString().slice(0, 10)}.nc`
        );
    }

    _render() {
        requestAnimationFrame(() => this._render());
        this.cadViewer.render();
        
        if (this.toolpathVisualizer.isVisible) {
            this.toolpathVisualizer.render();
        }
    }

    _setupEventListeners() {
        // File operations
        document.getElementById('open-file').addEventListener('change', (e) => {
            if (e.target.files[0]) this.openFile(e.target.files[0]);
        });
        
        document.getElementById('save-file').addEventListener('click', () => this.saveFile());
        
        // Toolpath generation
        document.getElementById('generate-gcode').addEventListener('click', () => {
            const controllerType = document.getElementById('post-processor').value;
            this.generateGCode(controllerType);
        });
    }

    _downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MastercamWebApp();
});
