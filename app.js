class WebCAMPro {
    constructor() {
        this.currentModel = null;
        this.selectedTool = null;
        this.selectedMaterial = null;
        this.toolpath = null;
        
        this.initThreeJS();
        this.loadToolLibrary();
        this.loadMaterialLibrary();
        this.setupEventListeners();
        this.animate();
    }

    initThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e1e1e);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(50, 50, 50);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('renderCanvas'),
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(ambientLight, directionalLight);
        
        // Helpers
        const gridHelper = new THREE.GridHelper(100, 100);
        this.scene.add(gridHelper);
        
        // Axes helper (toggle with key)
        this.axesHelper = new THREE.AxesHelper(20);
        this.axesHelper.visible = false;
        this.scene.add(this.axesHelper);
    }

    async loadToolLibrary() {
        try {
            const response = await fetch('assets/tools.json');
            this.tools = await response.json();
            
            const select = document.getElementById('tool-select');
            select.innerHTML = '<option value="">Select Tool</option>';
            
            this.tools.forEach(tool => {
                const option = document.createElement('option');
                option.value = tool.id;
                option.textContent = `${tool.name} (Ø${tool.diameter}mm)`;
                select.appendChild(option);
            });
            
            select.addEventListener('change', (e) => {
                this.selectedTool = this.tools.find(t => t.id === e.target.value);
                document.getElementById('current-tool').textContent = 
                    this.selectedTool ? this.selectedTool.name : 'None';
            });
        } catch (error) {
            console.error('Failed to load tool library:', error);
        }
    }

    async loadMaterialLibrary() {
        try {
            const response = await fetch('assets/materials.json');
            this.materials = await response.json();
            
            const select = document.getElementById('material-select');
            select.innerHTML = '<option value="">Select Material</option>';
            
            Object.keys(this.materials).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
                select.appendChild(option);
            });
            
            select.addEventListener('change', (e) => {
                this.selectedMaterial = this.materials[e.target.value];
                document.getElementById('current-material').textContent = 
                    e.target.value || 'None';
            });
        } catch (error) {
            console.error('Failed to load material library:', error);
        }
    }

    setupEventListeners() {
        // Model upload
        document.getElementById('model-upload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.showLoading(true, `Loading ${file.name}...`);
            
            try {
                await this.loadModel(file);
                this.showLoading(false);
            } catch (error) {
                console.error('Error loading model:', error);
                this.showLoading(false);
                alert(`Failed to load model: ${error.message}`);
            }
        });
        
        // Toolpath generation
        document.getElementById('generate-adaptive').addEventListener('click', async () => {
            if (!this.validateSelection()) return;
            
            this.showLoading(true, 'Generating adaptive toolpath...');
            
            try {
                this.toolpath = await CAMCore.generateAdaptiveClearing(
                    this.currentModel,
                    this.selectedTool,
                    this.selectedMaterial
                );
                
                const gcode = HAASPostProcessor.generate(this.toolpath);
                document.getElementById('gcode-output').value = gcode;
                this.visualizeToolpath(this.toolpath);
                this.updateStats();
                this.showLoading(false);
            } catch (error) {
                console.error('Error generating toolpath:', error);
                this.showLoading(false);
                alert(`Toolpath generation failed: ${error.message}`);
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    async loadModel(file) {
        // Clear previous model
        this.scene.children = this.scene.children.filter(
            obj => obj.type !== 'Mesh' || obj.isHelper
        );
        
        let geometry;
        
        if (file.name.endsWith('.stl')) {
            const loader = new THREE.STLLoader();
            geometry = await loader.loadAsync(URL.createObjectURL(file));
        } else if (file.name.endsWith('.dxf')) {
            const parser = new DxfParser();
            const text = await file.text();
            const dxf = parser.parseSync(text);
            geometry = this.convertDxfToGeometry(dxf);
        } else {
            throw new Error('Unsupported file format');
        }
        
        // Create mesh
        const material = new THREE.MeshStandardMaterial({
            color: 0x00aaff,
            metalness: 0.3,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Center model
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        mesh.position.sub(center);
        
        this.scene.add(mesh);
        this.currentModel = mesh;
        
        // Adjust camera
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        this.camera.position.z = maxDim * 2;
        this.controls.target.copy(center);
        this.controls.update();
    }

    convertDxfToGeometry(dxf) {
        // Convert DXF entities to Three.js geometry
        const shapes = [];
        
        dxf.entities.forEach(entity => {
            if (entity.type === 'LINE') {
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(entity.start.x, entity.start.y, 0),
                    new THREE.Vector3(entity.end.x, entity.end.y, 0)
                ]);
                shapes.push(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff })));
            }
            // Add support for other entity types (ARC, CIRCLE, etc.)
        });
        
        return shapes.length > 0 ? shapes : new THREE.BufferGeometry();
    }

    visualizeToolpath(toolpath) {
        // Clear previous toolpath visualization
        this.scene.children = this.scene.children.filter(
            obj => !obj.isToolpath
        );
        
        // Visualize each operation
        toolpath.operations.forEach(op => {
            const points = op.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const material = new THREE.LineBasicMaterial({
                color: op.type === 'cut' ? 0xff0000 : 0x00ff00,
                linewidth: 2
            });
            
            const line = new THREE.Line(geometry, material);
            line.isToolpath = true;
            this.scene.add(line);
        });
    }

    updateStats() {
        if (!this.toolpath) return;
        
        // Calculate cycle time (simplified)
        const totalDistance = this.toolpath.operations.reduce((sum, op) => {
            if (op.points.length < 2) return sum;
            let distance = 0;
            for (let i = 1; i < op.points.length; i++) {
                const a = op.points[i-1];
                const b = op.points[i];
                distance += Math.sqrt(
                    Math.pow(b.x - a.x, 2) + 
                    Math.pow(b.y - a.y, 2) + 
                    Math.pow(b.z - a.z, 2)
                );
            }
            return sum + distance;
        }, 0);
        
        const feedrate = this.toolpath.operations[0]?.feedrate || 1000;
        const timeMinutes = totalDistance / feedrate;
        const minutes = Math.floor(timeMinutes);
        const seconds = Math.floor((timeMinutes % 1) * 60);
        
        document.getElementById('cycle-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    showLoading(show, message = '') {
        const overlay = document.getElementById('loading-overlay');
        const progress = overlay.querySelector('.progress-bar');
        const status = document.getElementById('status-text');
        
        if (show) {
            overlay.style.display = 'flex';
            status.textContent = message;
            progress.style.width = '0%';
            
            // Animate progress bar
            let progressValue = 0;
            const interval = setInterval(() => {
                progressValue += 1;
                progress.style.width = `${progressValue}%`;
                
                if (progressValue >= 100) {
                    clearInterval(interval);
                }
            }, 50);
            
            this.loadingInterval = interval;
        } else {
            clearInterval(this.loadingInterval);
            overlay.style.display = 'none';
        }
    }

    validateSelection() {
        if (!this.currentModel) {
            alert('Please load a model first');
            return false;
        }
        
        if (!this.selectedTool) {
            alert('Please select a tool');
            return false;
        }
        
        if (!this.selectedMaterial) {
            alert('Please select a material');
            return false;
        }
        
        return true;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WebCAMPro();
});
