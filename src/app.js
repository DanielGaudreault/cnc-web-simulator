class MastercamWebApp {
    constructor() {
        // Initialize core systems
        this.geometryKernel = new GeometryKernel();
        this.cadEngine = new CADEngine(this.geometryKernel);
        this.camEngine = new CAMEngine(this.cadEngine);
        this.fileIO = new MastercamFileIO();
        this.toolLibrary = new ToolLibrary();
        this.postProcessor = new PostProcessor();
        this.workerManager = new WorkerManager();
        
        // Register workers
        this.workerManager.registerWorker('toolpath', 'workers/toolpath-worker.js');
        this.workerManager.registerWorker('geometry', 'workers/geometry-worker.js');
        
        // Initialize UI components
        this.ribbonUI = new RibbonUI();
        this.cadViewer = new CADViewer('cad-viewer');
        this.treeView = new TreeView('geometry-tree', this.cadEngine);
        this.propertyEditor = new PropertyEditor('property-editor');
        this.toolpathVisualizer = new ToolpathVisualizer('toolpath-visualizer', this.cadViewer);
        this.statusBar = new StatusBar();
        
        // Setup default tools
        this.toolLibrary.createDefaultLibrary();
        
        // Current state
        this.currentFile = null;
        this.undoRedo = new UndoRedoSystem(this.cadEngine, this.camEngine);
        
        // Initialize event listeners
        this._setupEventListeners();
        this._setupKeyboardShortcuts();
        
        // Start render loop
        this._render();
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
        
        // View controls
        document.getElementById('view-top').addEventListener('click', () => 
            this.cadViewer.setView('top'));
        document.getElementById('view-front').addEventListener('click', () => 
            this.cadViewer.setView('front'));
        document.getElementById('view-side').addEventListener('click', () => 
            this.cadViewer.setView('side'));
        document.getElementById('view-iso').addEventListener('click', () => 
            this.cadViewer.setView('iso'));
        document.getElementById('zoom-fit').addEventListener('click', () => 
            this.cadViewer.fitToView());
        
        // Toolpath generation
        document.getElementById('generate-gcode').addEventListener('click', () => {
            const controllerType = document.getElementById('post-processor').value;
            this.generateGCode(controllerType);
        });
        
        // Tree view selection
        this.treeView.onItemSelected = (id, isToolpath) => {
            if (isToolpath) {
                this.toolpathVisualizer.highlightToolpath(id);
            } else {
                this.cadViewer.selectObject(id);
                const obj = this.cadEngine.getObject(id);
                this.propertyEditor.update(obj);
            }
        };
    }

    _setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Undo/Redo
            if (e.ctrlKey && e.key === 'z') {
                this.undoRedo.undo();
                e.preventDefault();
            } else if (e.ctrlKey && e.key === 'y') {
                this.undoRedo.redo();
                e.preventDefault();
            }
            
            // Delete selected
            if (e.key === 'Delete') {
                this.deleteSelected();
                e.preventDefault();
            }
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MastercamWebApp();
});
