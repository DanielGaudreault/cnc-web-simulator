class WebMastercamApp {
    constructor() {
        this.camCore = new CamCore();
        this.currentFile = null;
        this.isFileModified = false;
        
        this.initUI();
        this.initEventListeners();
        this.updateUI();
        
        // Load default sample file
        this.loadSampleFile();
    }
    
    initUI() {
        // Initialize tab system
        document.querySelectorAll('.sidebar-tabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sidebar-tabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabName = tab.getAttribute('data-tab');
                document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
                document.getElementById(`${tabName}-panel`).classList.add('active');
            });
        });
        
        // Initialize menu system
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target === item) {
                    document.querySelectorAll('.submenu').forEach(menu => menu.style.display = 'none');
                    const submenu = item.querySelector('.submenu');
                    if (submenu) submenu.style.display = 'block';
                }
            });
        });
        
        // Close menus when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item')) {
                document.querySelectorAll('.submenu').forEach(menu => menu.style.display = 'none');
            }
        });
    }
    
    initEventListeners() {
        // File operations
        document.getElementById('file-new').addEventListener('click', () => this.newFile());
        document.getElementById('file-open').addEventListener('click', () => this.openFileDialog());
        document.getElementById('file-save').addEventListener('click', () => this.saveFile());
        document.getElementById('file-export').addEventListener('click', () => this.exportGCode());
        document.getElementById('file-exit').addEventListener('click', () => window.close());
        
        // Toolbar buttons
        document.getElementById('btn-new').addEventListener('click', () => this.newFile());
        document.getElementById('btn-open').addEventListener('click', () => this.openFileDialog());
        document.getElementById('btn-save').addEventListener('click', () => this.saveFile());
        document.getElementById('btn-zoom-fit').addEventListener('click', () => this.camCore.fitViewToObjects());
        document.getElementById('btn-simulate').addEventListener('click', () => this.simulateToolpath());
        document.getElementById('btn-post').addEventListener('click', () => this.exportGCode());
        
        // View controls
        document.getElementById('btn-top-view').addEventListener('click', () => this.camCore.setView('top'));
        document.getElementById('btn-front-view').addEventListener('click', () => this.camCore.setView('front'));
        document.getElementById('btn-side-view').addEventListener('click', () => this.camCore.setView('side'));
        document.getElementById('btn-iso-view').addEventListener('click', () => this.camCore.setView('iso'));
        
        // File input
        document.getElementById('file-input').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.loadFile(e.target.files[0]);
            }
        });
        
        // Add toolpath button
        document.getElementById('btn-add-toolpath').addEventListener('click', () => this.showAddToolpathDialog());
        
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
    
    async loadSampleFile() {
        try {
            const response = await fetch('assets/sample-parts/sample.mcx');
            if (!response.ok) throw new Error("Sample file not found");
            
            const blob = await response.blob();
            const file = new File([blob], "sample.mcx", { type: "application/octet-stream" });
            await this.loadFile(file);
        } catch (error) {
            console.error("Error loading sample file:", error);
        }
    }
    
    async loadFile(file) {
        this.showLoading(true, `Loading ${file.name}...`);
        
        try {
            this.currentFile = file;
            document.getElementById('status-file').textContent = file.name;
            
            await this.camCore.loadMastercamFile(file);
            
            this.isFileModified = false;
            this.updateUI();
            this.showStatusMessage(`File loaded: ${file.name}`);
            
        } catch (error) {
            console.error('Error loading file:', error);
            this.showErrorMessage(`Error loading file: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    newFile() {
        if (this.isFileModified && !confirm('You have unsaved changes. Create new file anyway?')) {
            return;
        }
        
        this.currentFile = null;
        this.isFileModified = false;
        this.camCore.reset();
        document.getElementById('status-file').textContent = 'New File';
        this.updateUI();
        this.showStatusMessage('New file created');
    }
    
    async saveFile() {
        if (!this.currentFile) {
            this.saveAs();
            return;
        }
        
        this.showLoading(true, `Saving ${this.currentFile.name}...`);
        
        try {
            const blob = await this.camCore.generateMastercamFile();
            saveAs(blob, this.currentFile.name || 'untitled.mcx');
            
            this.isFileModified = false;
            this.updateUI();
            this.showStatusMessage(`File saved: ${this.currentFile.name}`);
            
        } catch (error) {
            console.error('Error saving file:', error);
            this.showErrorMessage(`Error saving file: ${error.message}`);
        } finally {
            this.showLoading(false);
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
            this.showErrorMessage('No toolpaths to export');
            return;
        }
        
        const postProcessor = prompt('Select post processor (fanuc, haas, grbl):', 'grbl').toLowerCase();
        if (!['fanuc', 'haas', 'grbl'].includes(postProcessor)) {
            this.showErrorMessage('Invalid post processor selected');
            return;
        }
        
        this.showLoading(true, 'Generating G-code...');
        
        try {
            let gcode;
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
            
            this.showStatusMessage(`G-code exported using ${postProcessor} post processor`);
            
        } catch (error) {
            console.error('Error exporting G-code:', error);
            this.showErrorMessage(`Error exporting G-code: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    simulateToolpath() {
        if (!this.camCore.hasToolpaths()) {
            this.showErrorMessage('No toolpaths to simulate');
            return;
        }
        
        this.showStatusMessage('Starting simulation...');
        // In a real app, this would start the toolpath simulation
        setTimeout(() => {
            this.showStatusMessage('Simulation completed');
        }, 2000);
    }
    
    showAddToolpathDialog() {
        const modal = this.createModal('Add New Toolpath', `
            <div class="property-group">
                <div class="property-row">
                    <div class="property-label">Toolpath Type:</div>
                    <div class="property-value">
                        <select id="toolpath-type">
                            <option value="contour">Contour</option>
                            <option value="pocket">Pocket</option>
                            <option value="drill">Drill</option>
                            <option value="surface">Surface</option>
                        </select>
                    </div>
                </div>
                <div class="property-row">
                    <div class="property-label">Tool:</div>
                    <div class="property-value">
                        <select id="toolpath-tool">
                            ${this.camCore.tools.map(tool => 
                                `<option value="${tool.id}">${tool.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="property-row">
                    <div class="property-label">Name:</div>
                    <div class="property-value">
                        <input type="text" id="toolpath-name" value="New Toolpath">
                    </div>
                </div>
            </div>
        `);
        
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.innerHTML = `
            <button class="btn btn-secondary" id="cancel-toolpath">Cancel</button>
            <button class="btn btn-primary" id="create-toolpath">Create</button>
        `;
        modal.querySelector('.modal-body').appendChild(footer);
        
        modal.querySelector('#cancel-toolpath').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        modal.querySelector('#create-toolpath').addEventListener('click', () => {
            const type = modal.querySelector('#toolpath-type').value;
            const toolId = modal.querySelector('#toolpath-tool').value;
            const name = modal.querySelector('#toolpath-name').value || 'New Toolpath';
            
            const tool = this.camCore.tools.find(t => t.id === toolId);
            
            this.camCore.addToolpath({
                name,
                type,
                tool: tool.name,
                toolId,
                parameters: this.getDefaultParameters(type, tool)
            });
            
            this.isFileModified = true;
            this.updateUI();
            this.closeModal(modal);
            this.showStatusMessage(`Added new ${type} toolpath`);
        });
        
        this.showModal(modal);
    }
    
    getDefaultParameters(type, tool) {
        const baseParams = {
            feedrate: 100,
            spindleSpeed: 2000,
            plungeRate: 50,
            stepover: tool.diameter * 0.5,
            coolant: 'none'
        };
        
        switch (type) {
            case 'contour':
                return {
                    ...baseParams,
                    depthPerPass: 0.5,
                    finalDepth: -5,
                    stockToLeave: 0.1
                };
            case 'pocket':
                return {
                    ...baseParams,
                    depthPerPass: 0.5,
                    finalDepth: -5,
                    stockToLeave: 0.1,
                    clearingMethod: 'zigzag'
                };
            case 'drill':
                return {
                    ...baseParams,
                    peckDepth: 0.2,
                    retractHeight: 1.0,
                    dwellTime: 0
                };
            case 'surface':
                return {
                    ...baseParams,
                    depthPerPass: 0.5,
                    finalDepth: -2,
                    stepover: tool.diameter * 0.3,
                    cuttingDirection: 'climb'
                };
            default:
                return baseParams;
        }
    }
    
    updateUI() {
        // Update toolpaths list
        const toolpathsList = document.getElementById('toolpaths-list');
        toolpathsList.innerHTML = '';
        
        this.camCore.toolpaths.forEach((tp, index) => {
            const div = document.createElement('div');
            div.className = 'toolpath-item';
            if (index === this.camCore.selectedToolpath) {
                div.classList.add('active');
            }
            
            div.innerHTML = `
                <span class="toolpath-icon">${this.getToolpathIcon(tp.type)}</span>
                <span class="toolpath-name">${tp.name}</span>
                <span class="toolpath-visibility">👁️</span>
            `;
            
            div.addEventListener('click', () => {
                this.camCore.selectToolpath(index);
                this.updateUI();
            });
            
            toolpathsList.appendChild(div);
        });
        
        // Update operations list
        const operationsList = document.getElementById('operations-list');
        operationsList.innerHTML = '';
        
        this.camCore.operations.forEach((op, index) => {
            const div = document.createElement('div');
            div.className = 'toolpath-item';
            if (index === this.camCore.selectedOperation) {
                div.classList.add('active');
            }
            
            div.innerHTML = `
                <span class="toolpath-icon">${this.getOperationIcon(op.type)}</span>
                <span class="toolpath-name">${op.name}</span>
            `;
            
            div.addEventListener('click', () => {
                this.camCore.selectOperation(index);
                this.updateUI();
            });
            
            operationsList.appendChild(div);
        });
        
        // Update geometry list
        const geometryList = document.getElementById('geometry-list');
        geometryList.innerHTML = '';
        
        this.camCore.geometry.forEach((geom, index) => {
            const div = document.createElement('div');
            div.className = 'toolpath-item';
            
            div.innerHTML = `
                <span class="toolpath-icon">📐</span>
                <span class="toolpath-name">Geometry ${index + 1}</span>
            `;
            
            geometryList.appendChild(div);
        });
        
        // Update properties panel
        this.updatePropertiesPanel();
        
        // Update file modified indicator
        document.title = `WebMastercam${this.isFileModified ? ' *' : ''}`;
    }
    
    updatePropertiesPanel() {
        const propertiesContent = document.getElementById('properties-content');
        propertiesContent.innerHTML = '';
        
        if (this.camCore.selectedToolpath !== null) {
            const tp = this.camCore.toolpaths[this.camCore.selectedToolpath];
            this.createPropertiesForm(propertiesContent, tp);
        } else if (this.camCore.selectedOperation !== null) {
            const op = this.camCore.operations[this.camCore.selectedOperation];
            this.createPropertiesForm(propertiesContent, op);
        } else {
            propertiesContent.innerHTML = '<p>Select an item to view properties</p>';
        }
    }
    
    createPropertiesForm(container, item) {
        const group = document.createElement('div');
        group.className = 'property-group';
        
        const title = document.createElement('div');
        title.className = 'property-group-title';
        title.textContent = item.name || 'Properties';
        group.appendChild(title);
        
        // Common properties
        this.addPropertyRow(group, 'Name', 'text', item.name || '', 'name');
        
        if (item.type) {
            this.addPropertyRow(group, 'Type', 'text', item.type, 'type', true);
        }
        
        if (item.tool) {
            this.addPropertyRow(group, 'Tool', 'text', item.tool, 'tool', true);
        }
        
        // Parameters
        if (item.parameters) {
            const paramsGroup = document.createElement('div');
            paramsGroup.className = 'property-group';
            
            const paramsTitle = document.createElement('div');
            paramsTitle.className = 'property-group-title';
            paramsTitle.textContent = 'Parameters';
            paramsGroup.appendChild(paramsTitle);
            
            for (const [key, value] of Object.entries(item.parameters)) {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                this.addPropertyRow(paramsGroup, label, 'number', value, `param-${key}`);
            }
            
            group.appendChild(paramsGroup);
        }
        
        container.appendChild(group);
    }
    
    addPropertyRow(container, label, type, value, name, readOnly = false) {
        const row = document.createElement('div');
        row.className = 'property-row';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'property-label';
        labelDiv.textContent = label;
        row.appendChild(labelDiv);
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'property-value';
        
        if (readOnly) {
            valueDiv.textContent = value;
        } else {
            const input = document.createElement('input');
            input.type = type;
            input.value = value;
            input.setAttribute('data-property', name);
            input.addEventListener('change', (e) => {
                this.handlePropertyChange(name, e.target.value);
            });
            valueDiv.appendChild(input);
        }
        
        row.appendChild(valueDiv);
        container.appendChild(row);
    }
    
    handlePropertyChange(property, value) {
        if (this.camCore.selectedToolpath !== null) {
            const tp = this.camCore.toolpaths[this.camCore.selectedToolpath];
            
            if (property === 'name') {
                tp.name = value;
            } 
            else if (property.startsWith('param-')) {
                const paramName = property.replace('param-', '');
                if (tp.parameters && tp.parameters[paramName] !== undefined) {
                    tp.parameters[paramName] = parseFloat(value) || 0;
                }
            }
            
            this.isFileModified = true;
            this.updateUI();
        }
    }
    
    getToolpathIcon(type) {
        const icons = {
            contour: '✏️',
            pocket: '🔄',
            drill: '🔽',
            surface: '🌊'
        };
        return icons[type] || '⚙️';
    }
    
    getOperationIcon(type) {
        const icons = {
            rough: '🔨',
            finish: '✨',
            drill: '🕳️',
            tap: '🔩'
        };
        return icons[type] || '⚙️';
    }
    
    showLoading(show, message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.style.display = 'flex';
            overlay.querySelector('.loading-text').textContent = message;
        } else {
            overlay.style.display = 'none';
        }
    }
    
    showStatusMessage(message) {
        document.getElementById('status-message').textContent = message;
    }
    
    showErrorMessage(message) {
        this.showStatusMessage(message);
        // In a real app, you might show a more prominent error message
        console.error(message);
    }
    
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-header">
                <span>${title}</span>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        `;
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        return modal;
    }
    
    showModal(modal) {
        document.getElementById('modal-container').appendChild(modal);
        modal.style.display = 'block';
    }
    
    closeModal(modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WebMastercamApp();
});
