class WebCAMPro {
    constructor() {
        this.currentModel = null;
        this.selectedTool = null;
        this.selectedMaterial = null;
        this.toolpath = null;
        this.mastercamParser = new MastercamParser();
        
        this.initThreeJS();
        this.initUI();
        this.loadToolLibrary();
        this.loadMaterialLibrary();
        this.setupEventListeners();
        this.animate();
    }

    initThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(100, 100, 100);
        
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
        this.controls.dampingFactor = 0.05;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(ambientLight, directionalLight);
        
        // Helpers
        const gridHelper = new THREE.GridHelper(200, 50, 0x555555, 0x333333);
        this.scene.add(gridHelper);
        
        // Axes helper
        this.axesHelper = new THREE.AxesHelper(50);
        this.axesHelper.visible = false;
        this.scene.add(this.axesHelper);
    }

    initUI() {
        // Initialize tab system
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const tabId = btn.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
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
                document.getElementById('tool-info').textContent = 
                    this.selectedTool ? `${this.selectedTool.name}` : 'No tool selected';
            });
        } catch (error) {
            console.error('Failed to load tool library:', error);
        }
    }

    async loadMastercamFile(file) {
    console.groupCollapsed(`Loading Mastercam file: ${file.name}`);
    try {
        // 1. Read file
        console.log("Reading file contents...");
        const arrayBuffer = await file.arrayBuffer();
        
        // 2. Parse with debug
        console.log("Parsing Mastercam data...");
        const parsedData = await this.mastercamParser.parse(arrayBuffer);
        console.log("Parsed data:", parsedData);
        
        // 3. Convert to Three.js
        console.log("Converting to Three.js...");
        const model = this.mastercamParser.convertToThreeJS(parsedData);
        
        // 4. Center model
        console.log("Centering model...");
        model.geometry.computeBoundingBox();
        const center = model.geometry.boundingBox.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // 5. Add to scene
        console.log("Adding to scene...");
        this.scene.add(model);
        this.currentModel = model;
        
        // 6. Adjust camera
        console.log("Adjusting camera...");
        const size = model.geometry.boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        this.camera.position.z = maxDim * 2;
        this.controls.target.copy(center);
        this.controls.update();
        
        console.log("Mastercam file loaded successfully");
    } catch (error) {
        console.error("Failed to load Mastercam file:", error);
        throw error;
    } finally {
        console.groupEnd();
    }
}

    setupEventListeners() {
        // File upload
        document.getElementById('model-upload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.showLoading(true, `Loading ${file.name}...`);
            document.getElementById('file-info').textContent = file.name;
            
            try {
                await this.loadModel(file);
            } catch (error) {
                console.error('Error loading model:', error);
                alert(`Error loading file: ${error.message}`);
            } finally {
                this.showLoading(false);
            }
        });
        
        // Toolpath generation
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateToolpath();
        });
        
        // Simulation
        document.getElementById('simulate-btn').addEventListener('click', () => {
            this.simulateToolpath();
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
            obj => obj.type !== 'Mesh' && !obj.isToolpath
        );
        
        const extension = file.name.split('.').pop().toLowerCase();
        
        try {
            if (['mcx', 'mcam'].includes(extension)) {
                await this.loadMastercamFile(file);
            } else if (extension === 'stl') {
                await this.loadSTLFile(file);
            } else if (extension === 'dxf') {
                await this.loadDXFFile(file);
            } else {
                throw new Error('Unsupported file format');
            }
        } catch (error) {
            console.error(`Error loading ${extension} file:`, error);
            throw error;
        }
    }

    async loadMastercamFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        const parsedData = await this.mastercamParser.parse(arrayBuffer);
        const model = this.mastercamParser.convertToThreeJS(parsedData);
        
        // Center model
        model.geometry.computeBoundingBox();
        const center = model.geometry.boundingBox.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        this.scene.add(model);
        this.currentModel = model;
        
        // Adjust camera
        const size = model.geometry.boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        this.camera.position.z = maxDim * 2;
        this.controls.target.copy(center);
        this.controls.update();
    }

    async loadSTLFile(file) {
        const loader = new THREE.STLLoader();
        const geometry = await loader.loadAsync(URL.createObjectURL(file));
        const material = new THREE.MeshStandardMaterial({
            color: 0x00aaff,
            metalness: 0.3,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Center model
        geometry.computeBoundingBox();
        const center = geometry.boundingBox.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
        
        this.scene.add(mesh);
        this.currentModel = mesh;
        
        // Adjust camera
        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        this.camera.position.z = maxDim * 2;
        this.controls.target.copy(center);
        this.controls.update();
    }

    async loadDXFFile(file) {
        const text = await file.text();
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);
        
        const group = new THREE.Group();
        
        dxf.entities.forEach(entity => {
            if (entity.type === 'LINE') {
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(entity.start.x, entity.start.y, 0),
                    new THREE.Vector3(entity.end.x, entity.end.y, 0)
                ]);
                const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
                group.add(line);
            }
            // Add support for other entity types (ARC, CIRCLE, etc.)
        });
        
        this.scene.add(group);
        this.currentModel = group;
    }

    async generateToolpath() {
        if (!this.validateSelection()) return;
        
        this.showLoading(true, 'Generating toolpath...');
        
        try {
            // Simulate toolpath generation
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate sample toolpath
            const toolpath = CAMCore.generateAdaptiveClearing(
                this.currentModel,
                this.selectedTool,
                this.selectedMaterial
            );
            
            // Post-process
            const gcode = HAASPostProcessor.generate(toolpath);
            document.getElementById('gcode-output').value = gcode;
            
            // Visualize
            this.visualizeToolpath(toolpath);
            this.updateStatistics(toolpath);
            
        } catch (error) {
            console.error('Error generating toolpath:', error);
            alert(`Toolpath generation failed: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    visualizeToolpath(toolpath) {
        // Clear previous toolpath
        this.scene.children = this.scene.children.filter(
            obj => !obj.isToolpath
        );
        
        const toolpathGroup = new THREE.Group();
        toolpathGroup.isToolpath = true;
        
        toolpath.operations.forEach(op => {
            const points = op.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const material = new THREE.LineBasicMaterial({
                color: op.type === 'cut' ? 0xff0000 : 0x00ff00,
                linewidth: 2
            });
            
            const line = new THREE.Line(geometry, material);
            toolpathGroup.add(line);
        });
        
        this.scene.add(toolpathGroup);
    }

    simulateToolpath() {
        if (!document.getElementById('gcode-output').value) {
            alert('Generate toolpath first');
            return;
        }
        
        alert('Simulation would run here');
        // Implement simulation logic
    }

    updateStatistics(toolpath) {
        if (!toolpath) return;
        
        // Calculate cycle time (simplified)
        let totalDistance = 0;
        toolpath.operations.forEach(op => {
            for (let i = 1; i < op.points.length; i++) {
                const a = op.points[i-1];
                const b = op.points[i];
                totalDistance += Math.sqrt(
                    Math.pow(b.x - a.x, 2) + 
                    Math.pow(b.y - a.y, 2) + 
                    Math.pow(b.z - a.z, 2)
                );
            }
        });
        
        const feedrate = toolpath.operations[0]?.feedrate || 1000;
        const timeMinutes = totalDistance / feedrate;
        const minutes = Math.floor(timeMinutes);
        const seconds = Math.floor((timeMinutes % 1) * 60);
        
        document.getElementById('cycle-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('toolpath-length').textContent = 
            `${totalDistance.toFixed(1)} mm`;
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

    showLoading(show, message = '') {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        
        if (show) {
            overlay.style.display = 'flex';
            text.textContent = message;
        } else {
            overlay.style.display = 'none';
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const app = new WebCAMPro();
    window.app = app; // For debugging
});
