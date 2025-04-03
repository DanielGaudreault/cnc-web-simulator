// Main application controller
class WebMastercamApp {
    constructor() {
        this.camCore = new CamCore();
        this.currentFile = null;
        this.isFileModified = false;
        
        this.initUI();
        this.initEventListeners();
        this.updateUI();
    }
    
    initUI() {
        // Initialize tab system
        const tabs = document.querySelectorAll('.sidebar-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.classList.remove('active'));
                
                const tabId = tab.id.replace('-tab', '-list');
                if (tabId === 'properties-tab') {
                    document.getElementById('properties-panel').classList.add('active');
                } else {
                    document.getElementById(tabId).classList.add('active');
                }
            });
        });
    }
    
    initEventListeners() {
        // File operations
        document.getElementById('file-new').addEventListener('click', () => this.newFile());
        document.getElementById('file-open').addEventListener('click', () => this.openFileDialog());
        document.getElementById('file-save').addEventListener('click', () => this.saveFile());
        document.getElementById('file-export').addEventListener('click', () => this.exportGCode());
        
        document.getElementById('file-input').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.loadFile(e.target.files[0]);
            }
        });
        
        // Window events
        window.addEventListener('beforeunload', (e) => {
            if (this.isFileModified) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }
    
    openFileDialog() {
        document.getElementById('file-input').click();
    }
    
    async loadFile(file) {
        try {
            this.currentFile = file;
            document.getElementById('file-info').textContent = file.name;
            
            // Read file based on extension
            const extension = file.name.split('.').pop().toLowerCase();
            
            if (extension === 'mcx' || extension === 'mcam') {
                await this.camCore.loadMastercamFile(file);
            } else {
                throw new Error(`Unsupported file format: .${extension}`);
            }
            
            this.isFileModified = false;
            this.updateUI();
            
        } catch (error) {
            console.error('Error loading file:', error);
            alert(`Error loading file: ${error.message}`);
        }
    }
    
    newFile() {
        if (this.isFileModified && !confirm('You have unsaved changes. Create new file anyway?')) {
            return;
        }
        
        this.currentFile = null;
        this.isFileModified = false;
        this.camCore.reset();
        document.getElementById('file-info').textContent = 'New File';
        this.updateUI();
    }
    
    async saveFile() {
        if (!this.currentFile) {
            this.saveAs();
            return;
        }
        
        try {
            // In a real app, this would generate the actual Mastercam file format
            const blob = await this.camCore.generateMastercamFile();
            saveAs(blob, this.currentFile.name || 'untitled.mcx');
            this.isFileModified = false;
            this.updateUI();
        } catch (error) {
            console.error('Error saving file:', error);
            alert(`Error saving file: ${error.message}`);
        }
    }
    
    saveAs() {
        const filename = prompt('Enter file name:', 'untitled.mcx');
        if (filename) {
            this.currentFile = { name: filename };
            this.saveFile();
        }
    }
    
    async exportGCode() {
        if (!this.camCore.hasToolpaths()) {
            alert('No toolpaths to export');
            return;
        }
        
        const postProcessor = prompt('Select post processor (fanuc, haas, grbl):', 'grbl').toLowerCase();
        let gcode;
        
        try {
            switch (postProcessor) {
                case 'fanuc':
                    gcode = this.camCore.generateGCode(FanucPostProcessor);
                    break;
                case 'haas':
                    gcode = this.camCore.generateGCode(HaasPostProcessor);
                    break;
                case 'grbl':
                default:
                    gcode = this.camCore.generateGCode(GrblPostProcessor);
            }
            
            const blob = new Blob([gcode], { type: 'text/plain' });
            const filename = (this.currentFile?.name || 'untitled').replace(/\.[^/.]+$/, '') + '.nc';
            saveAs(blob, filename);
            
        } catch (error) {
            console.error('Error exporting G-code:', error);
            alert(`Error exporting G-code: ${error.message}`);
        }
    }
    
    updateUI() {
        // Update toolpaths list
        const toolpathsList = document.getElementById('toolpaths-list');
        toolpathsList.innerHTML = '';
        
        this.camCore.toolpaths.forEach((tp, index) => {
            const div = document.createElement('div');
            div.className = 'toolpath-item';
            div.textContent = tp.name;
            div.addEventListener('click', () => this.selectToolpath(index));
            toolpathsList.appendChild(div);
        });
        
        // Update operations list
        const operationsList = document.getElementById('operations-list');
        operationsList.innerHTML = '';
        
        this.camCore.operations.forEach((op, index) => {
            const div = document.createElement('div');
            div.className = 'toolpath-item';
            div.textContent = `${op.type}: ${op.tool}`;
            div.addEventListener('click', () => this.selectOperation(index));
            operationsList.appendChild(div);
        });
        
        // Update properties panel
        const propertiesPanel = document.getElementById('properties-panel');
        propertiesPanel.innerHTML = '<h3>Properties</h3>';
        
        // Update file modified indicator
        document.title = `WebMastercam${this.isFileModified ? ' *' : ''}`;
    }
    
    selectToolpath(index) {
        this.camCore.highlightToolpath(index);
        this.updateUI();
    }
    
    selectOperation(index) {
        this.camCore.highlightOperation(index);
        this.updateUI();
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WebMastercamApp();
});
