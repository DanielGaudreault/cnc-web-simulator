class CADEngine {
    constructor(geometryKernel) {
        this.geometryKernel = geometryKernel;
        this.objects = [];
        this.selection = [];
        this.currentId = 0;
    }

    createPrimitive(type, params) {
        let geometry;
        switch (type) {
            case 'box':
                geometry = new THREE.BoxGeometry(params.width, params.height, params.depth);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(
                    params.radiusTop || params.radius,
                    params.radiusBottom || params.radius,
                    params.height,
                    params.radialSegments || 32
                );
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(
                    params.radius,
                    params.widthSegments || 32,
                    params.heightSegments || 16
                );
                break;
            default:
                throw new Error(`Unknown primitive type: ${type}`);
        }

        const object = {
            id: `obj_${this.currentId++}`,
            type: 'primitive',
            primitiveType: type,
            geometry: geometry,
            position: params.position || { x: 0, y: 0, z: 0 },
            rotation: params.rotation || { x: 0, y: 0, z: 0 },
            scale: params.scale || { x: 1, y: 1, z: 1 },
            parameters: params,
            name: params.name || `${type}_${this.currentId}`
        };

        this.objects.push(object);
        return object;
    }

    extrude(profile, direction, distance) {
        const shape = new THREE.Shape();
        profile.points.forEach((point, i) => {
            if (i === 0) shape.moveTo(point.x, point.y);
            else shape.lineTo(point.x, point.y);
        });

        const extrudeSettings = {
            steps: 1,
            depth: distance,
            bevelEnabled: false
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const object = {
            id: `obj_${this.currentId++}`,
            type: 'extrusion',
            geometry: geometry,
            profile: profile,
            direction: direction,
            distance: distance,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            name: profile.name || `extrusion_${this.currentId}`
        };

        this.objects.push(object);
        return object;
    }

    booleanOperation(type, objectA, objectB) {
        const bspA = this._convertToBSP(objectA);
        const bspB = this._convertToBSP(objectB);
        let resultBSP;

        switch (type) {
            case 'union':
                resultBSP = bspA.union(bspB);
                break;
            case 'subtract':
                resultBSP = bspA.subtract(bspB);
                break;
            case 'intersect':
                resultBSP = bspA.intersect(bspB);
                break;
            default:
                throw new Error(`Unknown boolean operation: ${type}`);
        }

        const resultGeometry = this._convertFromBSP(resultBSP);
        const resultObject = {
            id: `obj_${this.currentId++}`,
            type: 'boolean',
            booleanType: type,
            geometry: resultGeometry,
            operands: [objectA.id, objectB.id],
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            name: `${type}_${objectA.name}_${objectB.name}`
        };

        this.objects.push(resultObject);
        return resultObject;
    }

    getObject(id) {
        return this.objects.find(obj => obj.id === id);
    }

    removeObject(id) {
        this.objects = this.objects.filter(obj => obj.id !== id);
        this.selection = this.selection.filter(selId => selId !== id);
    }

    getCurrentGeometry() {
        return this.objects.map(obj => ({
            id: obj.id,
            type: obj.type,
            position: obj.position,
            rotation: obj.rotation,
            scale: obj.scale,
            parameters: obj.parameters,
            name: obj.name
        }));
    }

    _convertToBSP(object) {
        // Convert Three.js geometry to BSP
        // Implementation depends on CSG library used
        return new ThreeBSP(object.mesh);
    }

    _convertFromBSP(bsp) {
        // Convert BSP back to Three.js geometry
        return bsp.toGeometry();
    }
}
