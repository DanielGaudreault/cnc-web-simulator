class ToolpathVisualizer {
    constructor(containerId, cadViewer) {
        this.container = document.getElementById(containerId);
        this.cadViewer = cadViewer;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        
        this.toolpaths = {};
        this.isVisible = false;
        this.currentSimulation = null;
        this.simulationFrame = 0;
        
        this._setupRender();
    }

    showToolpaths(toolpathData) {
        this.clear();
        
        toolpathData.forEach(tp => {
            this._visualizeToolpath(tp);
        });
        
        this.isVisible = true;
    }

    _visualizeToolpath(toolpath) {
        const colorMap = {
            'contour': 0x00ff00,
            'pocket': 0x0000ff,
            'drill': 0xff0000,
            'surface': 0xffff00
        };
        
        const color = colorMap[toolpath.type] || 0xffffff;
        const material = new THREE.LineBasicMaterial({ color });
        
        toolpath.operations.forEach(op => {
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            
            op.movements.forEach(move => {
                positions.push(move.from.x, move.from.y, move.from.z);
                positions.push(move.to.x, move.to.y, move.to.z);
            });
            
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            const line = new THREE.LineSegments(geometry, material);
            
            this.scene.add(line);
            if (!this.toolpaths[toolpath.id]) {
                this.toolpaths[toolpath.id] = [];
            }
            this.toolpaths[toolpath.id].push(line);
        });
    }

    simulateToolpath(toolpathId, speed = 1) {
        this.clearSimulation();
        
        const toolpath = this.toolpaths[toolpathId];
        if (!toolpath) return;
        
        this.currentSimulation = {
            toolpath: toolpathId,
            speed,
            currentOperation: 0,
            currentSegment: 0,
            startTime: Date.now()
        };
        
        this._animateSimulation();
    }

    _animateSimulation() {
        if (!this.currentSimulation) return;
        
        const toolpath = this.toolpaths[this.currentSimulation.toolpath];
        const operation = toolpath[this.currentSimulation.currentOperation];
        
        // Update simulation frame
        this.simulationFrame++;
        
        // Render
        this.render();
        
        // Continue animation
        requestAnimationFrame(() => this._animateSimulation());
    }

    clear() {
        Object.values(this.toolpaths).forEach(lines => {
            lines.forEach(line => this.scene.remove(line));
        });
        this.toolpaths = {};
        this.clearSimulation();
    }

    clearSimulation() {
        this.currentSimulation = null;
        this.simulationFrame = 0;
    }

    render() {
        // First render the CAD view to a texture
        this.cadViewer.render();
        
        // Then render the toolpaths on top
        this.renderer.autoClear = false;
        this.renderer.clearDepth();
        this.renderer.render(this.scene, this.cadViewer.camera);
    }

    _setupRender() {
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.pointerEvents = 'none';
        this.container.appendChild(this.renderer.domElement);
    }
}
