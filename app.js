class WebCAMPro {
    constructor() {
        this.currentModel = null;
        this.selectedTool = null;
        this.selectedMaterial = null;
        this.mastercamParser = new MastercamParser();

        this.initThreeJS();
        this.loadToolLibrary();
        this.loadMaterialLibrary();
        this.setupEventListeners();
        this.animate();
    }

    initThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.set(50, 50, 50);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('renderCanvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(ambientLight, directionalLight);
        
        const gridHelper = new THREE.GridHelper(100, 100);
        this.scene.add(gridHelper);
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
        document.getElementById('model-upload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.showLoading(true, `Loading ${file.name}...`);
            try {
                await this.loadModel(file);
            } catch (error) {
                console.error('Error loading model:', error);
                this.logError(error.message);
            } finally {
                this.showLoading(false);
            }
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
        this.clearScene();
        
        const extension = file.name.split('.').pop().toLowerCase();
        const arrayBuffer = await file.arrayBuffer();
        
        if (['mcx', 'mcam'].includes(extension)) {
            await this.loadMastercamFile(arrayBuffer);
        } else if (extension === 'stl') {
            await this.loadSTLFile(arrayBuffer);
        } else if (extension === 'dxf') {
            await this.loadDXFFile(arrayBuffer);
        } else {
            throw new Error('Unsupported file format');
        }
    }

    async loadMastercamFile(arrayBuffer) {
        try {
            this.logDebug('Starting Mastercam file parsing...');
            
            // Hex dump first 32 bytes for debugging
            const header = new Uint8Array(arrayBuffer, 0, 32);
            this.logDebug('File header:', Array.from(header).map(b => b.toString(16).padStart(2, '0')).join(' '));
            
            const parsedData = await this.mastercamParser.parse(arrayBuffer);
            this.logDebug('Parsed data:', parsedData);
            
            const model = this.mastercamParser.convertToThreeJS(parsedData);
            this.centerModel(model);
            this.scene.add(model);
            this.currentModel = model;
            
            this.logDebug('Mastercam file loaded successfully');
        } catch (error) {
            this.logError(`Mastercam parsing failed: ${error.message}`);
            throw error;
        }
    }

    centerModel(model) {
        model.geometry.computeBoundingBox();
        const center = model.geometry.boundingBox.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        const size = model.geometry.boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        this.camera.position.z = maxDim * 2;
        this.controls.target.copy(center);
        this.controls.update();
    }

    clearScene() {
        this.scene.children = this.scene.children.filter(
            obj => obj.type !== 'Mesh' && !obj.isHelper
        );
    }

    logDebug(message, data = null) {
        const consoleElem = document.getElementById('debug-console');
        consoleElem.innerHTML += `<div class="debug-log">${message}</div>`;
        if (data) console.log(message, data);
        else console.log(message);
        consoleElem.scrollTop = consoleElem.scrollHeight;
    }

    logError(message) {
        const consoleElem = document.getElementById('debug-console');
        consoleElem.innerHTML += `<div class="error-log">ERROR: ${message}</div>`;
        console.error(message);
        consoleElem.scrollTop = consoleElem.scrollHeight;
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

document.addEventListener('DOMContentLoaded', () => {
    new WebCAMPro();
});
