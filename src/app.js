class MastercamWebApp {
    constructor() {
        this.parser = new MastercamParser();
        this.ncGenerator = new NCGenerator();
        this.geometryEngine = new GeometryEngine();
        
        this.currentFile = null;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.initUI();
        this.initEventListeners();
    }

    initUI() {
        // Setup Three.js renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('model-viewer').appendChild(this.renderer.domElement);
        
        // Basic lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Grid helper
        const gridHelper = new THREE.GridHelper(100, 100);
        this.scene.add(gridHelper);
        
        // Camera position
        this.camera.position.z = 50;
    }

    async openFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.currentFile = await this.parser.parseMCAMFile(arrayBuffer);
            
            // Render geometry
            const threeGeometry = this.geometryEngine.createFromMCAMGeometry(this.currentFile.geometry);
            const material = new THREE.MeshStandardMaterial({ color: 0x00aaff, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(threeGeometry, material);
            
            this.scene.add(mesh);
            
            // Update UI
            this.updateFileStructure(this.currentFile);
            this.updateToolpathList(this.currentFile.toolpaths);
            
        } catch (error) {
            console.error('Error opening file:', error);
            alert('Failed to open file: ' + error.message);
        }
    }

    generateNC() {
        if (!this.currentFile) {
            alert('No file loaded');
            return;
        }
        
        const gcode = this.ncGenerator.generateGCode(
            this.currentFile.toolpaths,
            this.currentFile.machineSetup,
            'generic'
        );
        
        // Create download link
        const blob = new Blob([gcode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'program.nc';
        a.click();
    }
}

// Initialize application
const app = new MastercamWebApp();

// File input handler
document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        app.openFile(e.target.files[0]);
    }
});

// Generate NC button
document.getElementById('generate-nc').addEventListener('click', () => {
    app.generateNC();
});
