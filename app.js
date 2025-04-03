// Main application class
class WebMastercam {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentFile = null;
        this.toolpaths = [];
        
        this.initUI();
        this.init3DViewer();
    }
    
    initUI() {
        document.getElementById('open-file').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.loadFile(e.target.files[0]);
        });
        
        document.getElementById('save-file').addEventListener('click', () => {
            this.saveFile();
        });
    }
    
    init3DViewer() {
        const canvas = document.getElementById('renderCanvas');
        
        // Create Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            canvas.clientWidth / canvas.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 5;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        
        // Add OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        });
        
        // Start animation loop
        this.animate();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.renderer);
    }
    
    async loadFile(file) {
        this.currentFile = file;
        
        try {
            // Mastercam files are typically ZIP archives
            const zip = new JSZip();
            const content = await zip.loadAsync(file);
            
            // Parse the file (simplified - real parsing would be more complex)
            const fileList = [];
            zip.forEach((relativePath, zipEntry) => {
                fileList.push(relativePath);
            });
            
            console.log("File contents:", fileList);
            
            // Here you would parse the actual Mastercam data
            // This is a placeholder for demonstration
            this.parseMastercamData(content);
            
        } catch (error) {
            console.error("Error loading file:", error);
            alert("Error loading file: " + error.message);
        }
    }
    
    parseMastercamData(zipContent) {
        // Clear previous data
        this.clearScene();
        this.toolpaths = [];
        
        // In a real application, you would parse the actual Mastercam file format here
        // This is a simplified demonstration
        
        // Example: Create a sample toolpath visualization
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
        
        // Example toolpath data
        this.toolpaths.push({
            name: "Sample Toolpath",
            type: "Contour",
            tool: "1/2\" Flat End Mill",
            operations: []
        });
        
        this.updateUI();
    }
    
    clearScene() {
        while(this.scene.children.length > 0) { 
            this.scene.remove(this.scene.children[0]); 
        }
        
        // Re-add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }
    
    updateUI() {
        const toolpathsDiv = document.getElementById('toolpaths');
        toolpathsDiv.innerHTML = '<h3>Toolpaths</h3>';
        
        this.toolpaths.forEach(tp => {
            const div = document.createElement('div');
            div.className = 'toolpath-item';
            div.textContent = tp.name;
            toolpathsDiv.appendChild(div);
        });
    }
    
    saveFile() {
        if (!this.currentFile) {
            alert("No file loaded to save");
            return;
        }
        
        // In a real application, you would generate the Mastercam file format here
        // This is a simplified demonstration
        
        const zip = new JSZip();
        
        // Add sample files (in a real app, these would be your actual data)
        zip.file("header.xml", "<Mastercam><Version>1.0</Version></Mastercam>");
        zip.file("geometry.dat", "Sample geometry data");
        zip.file("toolpaths.dat", "Sample toolpath data");
        
        zip.generateAsync({ type: "blob" }).then(content => {
            saveAs(content, this.currentFile.name || "modified.mcam");
        });
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load Three.js OrbitControls dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/controls/OrbitControls.min.js';
    script.onload = () => {
        new WebMastercam();
    };
    document.head.appendChild(script);
});
