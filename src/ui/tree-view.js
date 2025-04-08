class TreeView {
    constructor(containerId, cadEngine) {
        this.container = document.getElementById(containerId);
        this.cadEngine = cadEngine;
        this.selectedItem = null;
        
        this._setupEventListeners();
    }

    update(data) {
        this.container.innerHTML = '';
        
        // Geometry tree
        const geometryTree = this._createTreeItem('Geometry', 'geometry');
        data.geometry.forEach(obj => {
            const item = this._createTreeItem(obj.name || `Object ${obj.id}`, obj.id, 'object');
            geometryTree.appendChild(item);
        });
        this.container.appendChild(geometryTree);
        
        // Toolpath tree
        if (data.toolpaths && data.toolpaths.length > 0) {
            const toolpathTree = this._createTreeItem('Toolpaths', 'toolpaths');
            data.toolpaths.forEach(tp => {
                const item = this._createTreeItem(tp.name || `Toolpath ${tp.id}`, tp.id, 'toolpath');
                toolpathTree.appendChild(item);
            });
            this.container.appendChild(toolpathTree);
        }
    }

    _createTreeItem(label, id, type = 'folder') {
        const item = document.createElement('div');
        item.className = `tree-item ${type}`;
        item.setAttribute('data-id', id);
        
        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.innerHTML = this._getIcon(type);
        item.appendChild(icon);
        
        const text = document.createElement('span');
        text.className = 'tree-text';
        text.textContent = label;
        item.appendChild(text);
        
        return item;
    }

    _getIcon(type) {
        const icons = {
            'folder': '📁',
            'object': '🟦',
            'toolpath': '🛠️',
            'geometry': '📐'
        };
        return icons[type] || '';
    }

    _setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            const item = e.target.closest('.tree-item');
            if (item) {
                // Deselect previous
                if (this.selectedItem) {
                    this.selectedItem.classList.remove('selected');
                }
                
                // Select new
                item.classList.add('selected');
                this.selectedItem = item;
                
                // Trigger selection in CAD engine
                const id = item.getAttribute('data-id');
                this.onItemSelected(id, item.classList.contains('toolpath'));
            }
        });
    }
}
