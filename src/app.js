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
        this.commandManager = new CommandManager();
        
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
        this.selectionManager = new SelectionManager(this.cadEngine, this.cadViewer);
        this.transformationManager = new TransformationManager(this.cadEngine, this.selectionManager);
        
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
        
        // Show welcome message
        this.statusBar.showMessage('Mastercam Web Clone ready', 'info');
    }

    async openFile(file) {
        try {
            this.statusBar.showMessage('Loading file...', 'info');
            
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
            
            // Record initial state
            this.undoRedo.record(this.undoRedo.getCurrentState());
            
            this.statusBar.showMessage(`File loaded: ${file.name}`, 'info');
            
        } catch (error) {
            console.error('Error opening file:', error);
            this.statusBar.showMessage(`Failed to open file: ${error.message}`, 'error');
        }
    }

    async saveFile(filename = 'untitled.mcam') {
        if (!this.currentFile) {
            this.statusBar.showMessage('No file to save', 'warning');
            return;
        }
        
        try {
            this.statusBar.showMessage('Saving file...', 'info');
            
            const exportData = {
                geometry: this.cadEngine.getCurrentGeometry(),
                toolpaths: this.camEngine.toolpaths,
                metadata: this.currentFile.metadata
            };
            
            const blob = await this.fileIO.exportFile(exportData, 'mcam');
            FileUtils.downloadBlob(blob, filename);
            
            this.statusBar.showMessage(`File saved: ${filename}`, 'info');
            
        } catch (error) {
            console.error('Error saving file:', error);
            this.statusBar.showMessage(`Failed to save file: ${error.message}`, 'error');
        }
    }

    generateGCode(controllerType = 'generic') {
        if (!this.camEngine.toolpaths || this.camEngine.toolpaths.length === 0) {
            this.statusBar.showMessage('No toolpaths to generate', 'warning');
            return;
        }
        
        try {
            this.statusBar.showMessage('Generating G-code...', 'info');
            
            const gcode = this.postProcessor.generate(
                this.camEngine.toolpaths,
                this.camEngine.machineSetup,
                controllerType
            );
            
            const filename = `program_${new Date().toISOString().slice(0, 10)}.nc`;
            FileUtils.downloadText(gcode, filename);
            
            this.statusBar.showMessage(`G-code generated: ${filename}`, 'info');
            
        } catch (error) {
            console.error('Error generating G-code:', error);
            this.statusBar.showMessage(`Failed to generate G-code: ${error.message}`, 'error');
        }
    }

    createBox() {
        const params = {
            width: 10,
            height: 10,
            depth: 10,
            position: { x: 0, y: 0, z: 0 }
        };
        
        const command = new CreateBoxCommand(this.cadEngine, params);
        this.commandManager.execute(command);
        
        // Update UI
        this.treeView.update({ geometry: this.cadEngine.objects });
        this.undoRedo.record(this.undoRedo.getCurrentState());
    }

    createContourToolpath() {
        if (this.selectionManager.selection.length === 0) {
            this.statusBar.showMessage('Select geometry first', 'warning');
            return;
        }
        
        const tool = this.toolLibrary.findTools({ type: 'endmill' })[0];
        if (!tool) {
            this.statusBar.showMessage('No suitable tool found', 'warning');
            return;
        }
        
        const params = {
            tool: tool,
            stepdown: tool.diameter * 0.5,
            stepover: 0.7,
            direction: 'climb'
        };
        
        this.camEngine.createToolpath('contour', this.selectionManager.selection, params);
        
        // Update UI
        this.treeView.update({ 
            geometry: this.cadEngine.objects,
            toolpaths: this.camEngine.toolpaths 
        });
        
        this.toolpathVisualizer.showToolpaths(this.camEngine.toolpaths);
        this.undoRedo.record(this.undoRedo.getCurrentState());
        
        this.statusBar.showMessage('Contour toolpath created', 'info');
    }

    deleteSelected() {
        if (this.selectionManager.selection.length === 0) {
            this.statusBar.showMessage('Nothing selected', 'warning');
            return;
        }
        
        const command = new DeleteCommand(
            this.cadEngine, 
            this.camEngine, 
            this.selectionManager.selection
        );
        
        this.commandManager.execute(command);
        this.selectionManager.clearSelection();
        
        // Update UI
        this.treeView.update({ 
            geometry: this.cadEngine.objects,
            toolpaths: this.camEngine.toolpaths 
        });
        
        this.undoRedo.record(this.undoRedo.getCurrentState());
    }

    _render() {
        requestAnimationFrame(() => this._render());
        
        // Update CAD viewer
        this.cadViewer.render();
        
        // Update toolpath visualizer if visible
        if (this.toolpathVisualizer.isVisible) {
            this.toolpathVisualizer.render();
        }
        
        // Update status bar coordinates
        const cursorPos = this.cadViewer.getCursorPosition();
        if (cursorPos) {
            this.statusBar.updateCoordinates(cursorPos.x, cursorPos.y, cursorPos.z);
        }
    }

    _setupEventListeners() {
        // File operations
        document.getElementById('open-file').addEventListener('change', (e) => {
            if (e.target.files[0]) this.openFile(e.target.files[0]);
        });
        
        document.getElementById('save-file').addEventListener('click', () => this.saveFile());
        document.getElementById('export-stl').addEventListener('click', () => this.exportSTL());
        
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
        
        // Creation tools
        document.getElementById('create-box').addEventListener('click', () => this.createBox());
        document.getElementById('create-cylinder').addEventListener('click', () => 
            this.createCylinder());
        document.getElementById('create-sphere').addEventListener('click', () => 
            this.createSphere());
        
        // Toolpath operations
        document.getElementById('toolpath-contour').addEventListener('click', () => 
            this.createContourToolpath());
        document.getElementById('toolpath-pocket').addEventListener('click', () => 
            this.createPocketToolpath());
        document.getElementById('toolpath-drill').addEventListener('click', () => 
            this.createDrillToolpath());
        
        // G-code generation
        document.getElementById('generate-gcode').addEventListener('click', () => {
            const controllerType = document.getElementById('post-processor').value;
            this.generateGCode(controllerType);
        });
        
        // Tree view selection
        this.treeView.onItemSelected = (id, isToolpath) => {
            if (isToolpath) {
                this.toolpathVisualizer.highlightToolpath(id);
                this.propertyEditor.update(this.camEngine.getToolpath(id));
            } else {
                this.selectionManager.select([id]);
                const obj = this.cadEngine.getObject(id);
                this.propertyEditor.update(obj);
            }
        };
        
        // CAD viewer selection
        this.cadViewer.onObjectSelected = (id) => {
            this.selectionManager.select([id]);
            this.treeView.selectItem(id);
            const obj = this.cadEngine.getObject(id);
            this.propertyEditor.update(obj);
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
            
            // Transformation shortcuts
            if (e.key === 'm') {
                this.transformationManager.transformMode = 'move';
                this.statusBar.showMessage('Move mode activated', 'info');
            } else if (e.key === 'r') {
                this.transformationManager.transformMode = 'rotate';
                this.statusBar.showMessage('Rotate mode activated', 'info');
            } else if (e.key === 's') {
                this.transformationManager.transformMode = 'scale';
                this.statusBar.showMessage('Scale mode activated', 'info');
            }
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MastercamWebApp();
});
