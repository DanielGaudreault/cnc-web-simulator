// Initialize Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Add lights
const light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(1, 1, 1);
scene.add(light1);
const light2 = new THREE.AmbientLight(0x404040);
scene.add(light2);

// Add grid helper
scene.add(new THREE.GridHelper(100, 100));

// Set up controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(50, 50, 50);
controls.update();

// File loading
document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    loadModel(file.name, event.target.result);
  };
  reader.readAsArrayBuffer(file);
});

function loadModel(filename, data) {
  // Clear previous model
  scene.children = scene.children.filter(obj => 
    obj !== light1 && obj !== light2 && !(obj instanceof THREE.GridHelper)
  );

  try {
    if (filename.endsWith('.stl')) {
      const loader = new THREE.STLLoader();
      const geometry = loader.parse(data);
      const material = new THREE.MeshPhongMaterial({ color: 0x00aaff, specular: 0x111111, shininess: 200 });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    } else if (filename.endsWith('.dxf')) {
      // DXF parsing would go here
      console.log("DXF support needs custom implementation");
    }
  } catch (e) {
    console.error("Error loading model:", e);
  }
}

// G-code generation
document.getElementById('generate-btn').addEventListener('click', () => {
  const gcode = generateToolpath(scene);
  document.getElementById('gcode-output').textContent = gcode;
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
