class CADViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        this.objects = {};
        this.highlighted = {};
        this.grid = null;
        this.axes = null;
        
        this._setupScene();
        this._setupCamera();
        this._setupRender();
        this._setupEventListeners();
    }

    _setupScene() {
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Grid
        this.grid = new THREE.GridHelper(100, 100);
        this.scene.add(this.grid);
        
        // Axes
        this.axes = new THREE.AxesHelper(10);
        this.scene.add(this.axes);
    }

    _setupCamera() {
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
    }

    _setupRender() {
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0xf0f0f0);
        this.container.appendChild(this.renderer.domElement);
    }

    addObject(id, geometry, materialParams = {}) {
        const material = new THREE.MeshStandardMaterial({
            color: materialParams.color || 0x00aaff,
            roughness: 0.2,
            metalness: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.id = id;
        this.objects[id] = mesh;
        this.scene.add(mesh);
    }

    removeObject(id) {
        if (this.objects[id]) {
            this.scene.remove(this.objects[id]);
            delete this.objects[id];
        }
    }

    highlightObject(id, color) {
        if (this.objects[id]) {
            if (this.highlighted[id]) {
                this.scene.remove(this.highlighted[id]);
            }
            
            const highlight = this.objects[id].clone();
            highlight.material = new THREE.MeshBasicMaterial({
                color: color,
                wireframe: true,
                transparent: true,
                opacity: 0.8
            });
            
            this.highlighted[id] = highlight;
            this.scene.add(highlight);
        }
    }

    clearHighlights() {
        Object.values(this.highlighted).forEach(obj => {
            this.scene.remove(obj);
        });
        this.highlighted = {};
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    fitToView() {
        // Calculate bounding box of all objects
        const bbox = new THREE.Box3();
        Object.values(this.objects).forEach(obj => {
            bbox.expandByObject(obj);
        });
        
        if (!bbox.isEmpty()) {
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = this.camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
            
            // Add some padding
            cameraZ *= 1.5;
            
            this.camera.position.copy(center);
            this.camera.position.z += cameraZ;
            this.camera.lookAt(center);
            
            this.controls.target.copy(center);
            this.controls.update();
        }
    }

    setView(direction) {
        const positions = {
            'top': [0, 0, 100],
            'front': [0, 100, 0],
            'side': [100, 0, 0],
            'iso': [50, 50, 50]
        };
        
        if (positions[direction]) {
            this.camera.position.set(...positions[direction]);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    _setupEventListeners() {
        window.addEventListener('resize', () => this._onWindowResize());
        
        this.renderer.domElement.addEventListener('dblclick', (event) => {
            // Handle object selection on double click
            const intersects = this._raycast(event);
            if (intersects.length > 0) {
                const id = intersects[0].object.userData.id;
                this.onObjectSelected(id);
            }
        });
    }

    _onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    _raycast(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = {
            x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((event.clientY - rect.top) / rect.height) * 2 + 1
        };
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        return raycaster.intersectObjects(Object.values(this.objects));
    }
}
