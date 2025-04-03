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
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas,
            antialias: true,
            preserveDrawingBuffer: true
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
            this.renderer.render(this.scene, this.renderer);
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
                        side: THREE.DoubleSide,
                        flatShading: true
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
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
                color: new THREE.Color(Math.random() * 0xffffff),
                object: this.createToolpathVisualization(tp)
            }));
            
            // Add toolpath visuals to scene
            this.toolpaths.forEach(tp => {
                if (tp.object) this.scene.add(tp.object);
            });
        }
        
        // Process operations
        if (fileData.operations && fileData.operations.length > 0) {
            this.operations = fileData.operations;
        }
        
        // Fit view to all objects
        this.fitViewToObjects();
    }
    
    createToolpathVisualization(toolpath) {
        if (!toolpath.paths || toolpath.paths.length < 2) return null;
        
        const points = toolpath.paths.map(p => 
            new THREE.Vector3(p.x, p.y, p.z)
        );
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: toolpath.color || 0xff0000,
            linewidth: 2
        });
        
        return new THREE.Line(geometry, material);
    }
    
    async generateMastercamFile() {
        // This would generate an actual Mastercam file in a real implementation
        // For demo purposes, we'll create a simple JSON structure and zip it
        
        const fileData = {
            metadata: {
                created: new Date().toISOString(),
                version: "1.0",
                generator: "WebMastercam"
            },
            geometry: this.geometry.map(geom => GeometryUtils.extractGeometryData(geom)),
            toolpaths: this.toolpaths.map(tp => ({
                name: tp.name,
                type: tp.type,
                tool: tp.tool,
                parameters: tp.parameters,
                paths: tp.paths || []
            })),
            operations: this.operations
        };
        
        const zip = new JSZip();
        zip.file("header.info", "Mastercam File\nVersion: 1.0");
        zip.file("data.json", JSON.stringify(fileData, null, 2));
        
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
    
    selectToolpath(index) {
        if (index >= 0 && index < this.toolpaths.length) {
            this.selectedToolpath = index;
            this.selectedOperation = null;
            
            // Highlight the toolpath in the 3D view
            this.toolpaths.forEach((tp, i) => {
                if (tp.object) {
                    tp.object.material.color.setHex(i === index ? 0x00ff00 : 0xff0000);
                }
            });
        }
    }
    
    selectOperation(index) {
        if (index >= 0 && index < this.operations.length) {
            this.selectedOperation = index;
            this.selectedToolpath = null;
        }
    }
    
    addToolpath(toolpath) {
        const newToolpath = {
            ...toolpath,
            visible: true,
            color: new THREE.Color(Math.random() * 0xffffff),
            paths: this.generateSampleToolpath(toolpath)
        };
        
        newToolpath.object = this.createToolpathVisualization(newToolpath);
        if (newToolpath.object) this.scene.add(newToolpath.object);
        
        this.toolpaths.push(newToolpath);
        this.selectToolpath(this.toolpaths.length - 1);
    }
    
    generateSampleToolpath(toolpath) {
        // Generate a simple sample toolpath based on type
        const paths = [];
        const zDepth = toolpath.parameters?.finalDepth || -5;
        
        switch (toolpath.type) {
            case 'contour':
                // Square contour
                paths.push({ x: 0, y: 0, z: 0 });
                paths.push({ x: 20, y: 0, z: zDepth });
                paths.push({ x: 20, y: 20, z: zDepth });
                paths.push({ x: 0, y: 20, z: zDepth });
                paths.push({ x: 0, y: 0, z: zDepth });
                break;
                
            case 'pocket':
                // Square pocket with zigzag
                for (let x = 0; x <= 20; x += 2) {
                    paths.push({ x, y: 0, z: zDepth });
                    paths.push({ x, y: 20, z: zDepth });
                    x += 2;
                    if (x <= 20) {
                        paths.push({ x, y: 20, z: zDepth });
                        paths.push({ x, y: 0, z: zDepth });
                    }
                }
                break;
                
            case 'drill':
                // Drill points
                for (let x = 5; x <= 15; x += 5) {
                    for (let y = 5; y <= 15; y += 5) {
                        paths.push({ x, y, z: 0 });
                        paths.push({ x, y, z: zDepth });
                        paths.push({ x, y, z: 0 });
                    }
                }
                break;
                
            case 'surface':
                // Surface raster pattern
                for (let y = 0; y <= 20; y += 2) {
                    paths.push({ x: 0, y, z: zDepth });
                    paths.push({ x: 20, y, z: zDepth });
                }
                break;
        }
        
        return paths;
    }
    
    setView(view) {
        const center = new THREE.Vector3(10, 10, 0);
        const distance = 50;
        
        switch (view) {
            case 'top':
                this.camera.position.set(center.x, center.y, center.z + distance);
                this.camera.lookAt(center);
                break;
                
            case 'front':
                this.camera.position.set(center.x, center.y - distance, center.z);
                this.camera.lookAt(center);
                break;
                
            case 'side':
                this.camera.position.set(center.x - distance, center.y, center.z);
                this.camera.lookAt(center);
                break;
                
            case 'iso':
                this.camera.position.set(
                    center.x + distance * 0.7,
                    center.y + distance * 0.7,
                    center.z + distance * 0.7
                );
                this.camera.lookAt(center);
                break;
        }
        
        this.controls.target.copy(center);
        this.controls.update();
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
        if (this.toolpaths.length > 0) {
            this.toolpaths.forEach(tp => {
                if (tp.paths) {
                    tp.paths.forEach(p => {
                        bbox.expandByPoint(new THREE.Vector3(p.x, p.y, p.z));
                    });
                }
            });
        }
        
        if (bbox.isEmpty()) {
            bbox.setFromCenterAndSize(new THREE.Vector3(10, 10, 0), new THREE.Vector3(20, 20, 10));
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
        this.toolpaths.forEach(tp => {
            if (tp.object) this.scene.remove(tp.object);
        });
        
        // Clear arrays
        this.geometry = [];
        this.toolpaths = [];
        this.operations = [];
        
        // Reset selections
        this.selectedToolpath = null;
        this.selectedOperation = null;
    }
}
