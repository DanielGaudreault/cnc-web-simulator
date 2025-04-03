// Three.js Scene Setup (existing code)
const scene = new THREE.Scene();
// ... (previous camera, renderer, controls setup)

// Enhanced loadSampleFiles() function
async function loadSampleFiles() {
  try {
    // 1. Load sample STL
    const stlResponse = await fetch('assets/sample.stl');
    if (!stlResponse.ok) throw new Error('STL file not found');
    const stlData = await stlResponse.arrayBuffer();
    loadModel('sample.stl', stlData);

    // 2. Load sample G-code
    const gcodeResponse = await fetch('assets/sample.gcode');
    if (!gcodeResponse.ok) throw new Error('G-code file not found');
    const gcodeText = await gcodeResponse.text();
    document.getElementById('gcode-output').textContent = gcodeText;

    // 3. Optional: Load DXF (uncomment if needed)
    // const dxfResponse = await fetch('assets/sample.dxf');
    // const dxfText = await dxfResponse.text();
    // console.log("DXF loaded:", dxfText.slice(0, 100));

  } catch (error) {
    console.error("Error loading samples:", error);
    document.getElementById('gcode-output').textContent = `Error: ${error.message}`;
  }
}

// Modified loadModel() to handle errors
function loadModel(filename, data) {
  // Clear previous models
  scene.children = scene.children.filter(obj => 
    obj !== light1 && obj !== light2 && !(obj instanceof THREE.GridHelper)
  );

  try {
    if (filename.endsWith('.stl')) {
      const loader = new THREE.STLLoader();
      const geometry = loader.parse(data);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x00aaff, 
        specular: 0x111111, 
        shininess: 200 
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Center and scale the model
      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox;
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      mesh.position.sub(center);
      
      scene.add(mesh);
    }
  } catch (e) {
    console.error("Model loading failed:", e);
    document.getElementById('gcode-output').textContent += `\n\nModel Error: ${e.message}`;
  }
}

// Initialize everything
function init() {
  // Existing scene setup
  // ...
  
  // Load samples on startup
  loadSampleFiles();
  
  // Start animation loop
  animate();
}

init();
