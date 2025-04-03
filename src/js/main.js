import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parseDXF } from './gcode.js';
import { generateToolpath } from './cam.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 5;

// Example: Render a cube (replace with DXF/G-code visualization)
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// File upload handler
document.getElementById('dxf-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const dxfData = parseDXF(event.target.result);
    visualizePaths(dxfData);
  };
  reader.readAsText(file);
});

// G-code generation
document.getElementById('generate-gcode').addEventListener('click', () => {
  const gcode = generateToolpath();
  document.getElementById('gcode-output').textContent = gcode;
});

function visualizePaths(paths) {
  // Clear old objects
  scene.children = scene.children.filter(obj => obj !== cube);

  // Add new paths (simplified)
  paths.forEach(path => {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(path.points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
  });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
