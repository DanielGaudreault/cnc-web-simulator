class WebCAMPro {
    constructor() {
        this.currentModel = null;
        this.selectedTool = null;
        this.selectedMaterial = null;
        this.toolpath = null;
        this.mastercamParser = null;
        
        this.initThreeJS();
        this.initUI();
        this.initMastercamSupport();
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
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(ambientLight, directionalLight);
        
        // Helpers
        const gridHelper = new THREE.GridHelper(200, 50);
        this.scene.add(gridHelper);
        
        // Axes helper
        this.axesHelper = new THREE.AxesHelper(50);
        this.axesHelper.visible = false;
        this.scene.add(this.axesHelper);
    }

    initUI() {
        // Initialize any UI components
    }

    async initMastercamSupport() {
        try {
            // Load Mastercam parser
            this.mastercamParser = new MastercamParser();
            console.log("Mastercam support initialized");
        } catch (error) {
            console.error("Failed to initialize Mastercam support:", error);
        }
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
        } catch (error) {
            console.error('Failed to load material library:', error);
        }
    }

    setupEventListeners() {
        // File upload
        document.getElementById('model-upload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.showLoading(true, `Loading ${file.name}...`);
            try {
                await this.loadModel(file);
            } catch (error) {
                console.error('Error loading model:', error);
                alert(`Error: ${error.message}`);
            } finally {
                this.showLoading(false);
            }
        });
        
        // Toolpath generation
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateToolpath();
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
        
        const extension = file.name.split('.').pop().toLowerCase();
        
        try {
            if (['mcx', 'mcam'].includes(extension)) {
                await this.loadMastercamFile(file);
            } else if (['stl'].includes(extension)) {
                await this.loadSTLFile(file);
            } else if (['dxf'].includes(extension)) {
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
        if (!this.mastercamParser) {
            throw new Error('Mastercam parser not initialized');
        }
        
        const parsedData = await this.mastercamParser.parse(file);
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
            roughness: 0.7
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.currentModel = mesh;
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
            // Add support for other entity types
        });
        
        this.scene.add(group);
        this.currentModel = group;
    }

    generateToolpath() {
        if (!this.currentModel) {
            alert('Please load a model first');
            return;
        }
        
        if (!this.selectedTool) {
            alert('Please select a tool');
            return;
        }
        
        this.showLoading(true, 'Generating toolpath...');
        
        setTimeout(() => {
            try {
                // Generate sample toolpath
                const sampleGcode = [
                    'G20 G17 G40 G49 G80 G90',
                    `T${this.selectedTool.id} M6`,
                    `G43 H${this.selectedTool.id}`,
                    `S${this.selectedTool.rpm} M3`,
                    'G54',
                    'G0 X0 Y0 Z5.0',
                    'G1 Z-1.0 F100',
                    'G1 X10 Y10 F200',
                    'G0 Z5.0',
                    'M5',
                    'G28 G91 Z0',
                    'G90',
                    'M30'
                ].join('\n');
                
                document.getElementById('gcode-output').value = sampleGcode;
                this.showLoading(false);
            } catch (error) {
                console.error('Error generating toolpath:', error);
                this.showLoading(false);
            }
        }, 1000);
    }

    showLoading(show, message = '') {
        const overlay = document.getElementById('loading-overlay');
        const status = document.getElementById('status-text');
        
        if (show) {
            overlay.style.display = 'flex';
            status.textContent = message;
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WebCAMPro();
});
