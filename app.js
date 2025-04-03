class WebCAM {
    constructor() {
        this.initScene();
        this.loadToolLibrary();
        this.setupEventListeners();
    }

    initScene() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('renderCanvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(ambientLight, directionalLight);
        
        // Grid
        const gridHelper = new THREE.GridHelper(100, 100);
        this.scene.add(gridHelper);
        
        // Animation loop
        this.animate();
    }

    async loadToolLibrary() {
        const response = await fetch('assets/tools.json');
        this.tools = await response.json();
        
        const select = document.getElementById('tool-select');
        this.tools.forEach(tool => {
            const option = document.createElement('option');
            option.value = tool.id;
            option.textContent = `${tool.name} (${tool.diameter}mm)`;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        document.getElementById('model-upload').addEventListener('change', (e) => {
            this.loadModel(e.target.files[0]);
        });
        
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateToolpath();
        });
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    async loadModel(file) {
        const loader = file.name.endsWith('.stl') 
            ? new THREE.STLLoader() 
            : new DxfParser();
        
        const model = await loader.loadAsync(URL.createObjectURL(file));
        const mesh = new THREE.Mesh(model, new THREE.MeshStandardMaterial({
            color: 0x00aaff,
            metalness: 0.5,
            roughness: 0.7
        }));
        
        // Center model
        model.computeBoundingBox();
        const center = model.boundingBox.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
        
        this.scene.add(mesh);
        this.currentModel = mesh;
    }

    async generateToolpath() {
        const toolId = document.getElementById('tool-select').value;
        const selectedTool = this.tools.find(t => t.id === toolId);
        
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = '0%';
        
        // Simulate progress
        for (let i = 0; i <= 100; i++) {
            await new Promise(resolve => setTimeout(resolve, 20));
            progressBar.style.width = `${i}%`;
        }
        
        // Generate toolpath
        const toolpath = CAMCore.generateAdaptiveClearing(
            this.currentModel,
            selectedTool
        );
        
        // Post-process
        const gcode = PostProcessor.haas(toolpath);
        document.getElementById('gcode-editor').value = gcode;
        
        // Visualize
        this.visualizeToolpath(toolpath);
    }

    visualizeToolpath(toolpath) {
        // Implementation for toolpath visualization
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize
new WebCAM();
