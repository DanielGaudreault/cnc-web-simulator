class CamCore {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.toolpaths = [];
        this.operations = [];
        this.geometry = [];
        this.materials = [];
        this.tools = [];
        
        this.selectedToolpath = null;
        this.selectedOperation = null;
        
        this.initRenderer();
        this.loadDefaults();
        this.startAnimationLoop();
    }
    
    initRenderer() {
        const canvas = document.getElementById('renderCanvas');
        
        // Setup Three.js scene
        this.scene.background = new THREE.Color(0x333333);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            canvas.clientWidth / canvas.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 50);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas,
            antialias: true,
            preserveDrawingBuffer: true // For screenshot functionality
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Grid helper
        const gridHelper = new THREE.GridHelper(100, 100);
        this.scene.add(gridHelper);
        
        // Axes helper
        const axesHelper = new THREE.AxesHelper(10);
        this.scene.add(axesHelper);
        
        // Window resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        });
    }
    
    async loadDefaults() {
        try {
            // Load default materials
            const materialsResponse = await fetch('assets/materials.json');
            this.materials = await materialsResponse.json();
            
            // Load default tools
            const toolsResponse = await fetch('assets/tools.json');
            this.tools = await toolsResponse.json();
            
        } catch (error) {
            console.error('Error loading default assets:', error);
        }
    }
    
    startAnimationLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }
    
    async loadMastercamFile(file) {
        // Reset current state
        this.reset();
        
        // Parse the Mastercam file
        const fileData = await MastercamReader.parse(file);
        
        // Process geometry
        if (fileData.geometry && fileData.geometry.length > 0) {
            for (const geomData of fileData.geometry) {
                const geometry = GeometryUtils.createGeometryFromData(geomData);
                if (geometry) {
                    const material = new THREE.MeshStandardMaterial({ 
                        color: 0x888888,
                        side: THREE.DoubleSide
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    this.scene.add(mesh);
                    this.geometry.push(mesh);
                }
            }
        }
        
        // Process toolpaths
        if (fileData.toolpaths && fileData.toolpaths.length > 0) {
            this.toolpaths = fileData.toolpaths.map(tp => ({
                ...tp,
                visible: true,
                color: new THREE.Color(Math.random() * 0xffffff)
            }));
        }
        
        // Process operations
        if (fileData.operations && fileData.operations.length > 0) {
            this.operations = fileData.operations;
        }
        
        // Fit view to all objects
        this.fitViewToObjects();
    }
    
    async generateMastercamFile() {
        // This would generate an actual Mastercam file in a real implementation
        // For demo purposes, we'll create a simple JSON structure and zip it
        
        const fileData = {
            metadata: {
                created: new Date().toISOString(),
                version: "1.0"
            },
            geometry: this.geometry.map(geom => GeometryUtils.extractGeometryData(geom)),
            toolpaths: this.toolpaths,
            operations: this.operations
        };
        
        const zip = new JSZip();
        zip.file("data.json", JSON.stringify(fileData));
        
        // Add required Mastercam file structure files
        zip.file("header.info", "Mastercam File\nVersion: 1.0");
        
        return await zip.generateAsync({ type: "blob" });
    }
    
    generateGCode(postProcessor) {
        if (!this.toolpaths || this.toolpaths.length === 0) {
            throw new Error("No toolpaths to generate G-code from");
        }
        
        const gcodeGenerator = new GCodeGenerator({
            postProcessor,
            tools: this.tools,
            materials: this.materials
        });
        
        return gcodeGenerator.generate(this.toolpaths, this.operations);
    }
    
    highlightToolpath(index) {
        if (index >= 0 && index < this.toolpaths.length) {
            this.selectedToolpath = index;
            // In a real app, this would highlight the toolpath in the 3D view
        }
    }
    
    highlightOperation(index) {
        if (index >= 0 && index < this.operations.length) {
            this.selectedOperation = index;
            // In a real app, this would highlight the operation in the 3D view
        }
    }
    
    fitViewToObjects() {
        const bbox = new THREE.Box3();
        
        // Add all geometry to bounding box
        this.geometry.forEach(obj => {
            if (obj.geometry) {
                obj.geometry.computeBoundingBox();
                bbox.union(obj.geometry.boundingBox);
            }
        });
        
        // Add toolpath bounds if available
        if (bbox.isEmpty()) {
            bbox.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(10, 10, 10));
        }
        
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
        
        // Adjust for larger objects
        cameraZ *= 1.5;
        
        this.camera.position.copy(center);
        this.camera.position.z += cameraZ;
        this.camera.lookAt(center);
        
        this.controls.target.copy(center);
        this.controls.update();
    }
    
    hasToolpaths() {
        return this.toolpaths && this.toolpaths.length > 0;
    }
    
    reset() {
        // Remove all geometry from scene
        this.geometry.forEach(obj => this.scene.remove(obj));
        
        // Clear arrays
        this.geometry = [];
        this.toolpaths = [];
        this.operations = [];
        
        // Reset selections
        this.selectedToolpath = null;
        this.selectedOperation = null;
    }
}
