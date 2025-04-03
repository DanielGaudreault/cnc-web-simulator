import { generateGCode } from './gcode.js';

// Mock toolpath generation
export function generateToolpath() {
  const mockPaths = [
    {
      type: "LINE",
      points: [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(2, 2, 0)
      ]
    }
  ];
  return generateGCode(mockPaths);
}
