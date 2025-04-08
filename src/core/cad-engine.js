class CADEngine {
    constructor() {
        this.objects = [];
        this.selection = [];
        this.history = [];
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
                    params.radiusTop, 
                    params.radiusBottom, 
                    params.height, 
                    params.radialSegments
                );
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(params.radius, params.widthSegments, params.heightSegments);
                break;
            default:
                throw new Error(`Unknown primitive type: ${type}`);
        }

        const object = {
            id: this._generateId(),
            type: 'primitive',
            primitiveType: type,
            geometry: geometry,
            position: params.position || { x: 0, y: 0, z: 0 },
            rotation: params.rotation || { x: 0, y: 0, z: 0 },
            material: params.material || { color: 0x00aaff }
        };

        this.objects.push(object);
        this._addHistory(`create_${type}`, object);
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
            id: this._generateId(),
            type: 'extrusion',
            geometry: geometry,
            profile: profile,
            direction: direction,
            distance: distance,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        };

        this.objects.push(object);
        this._addHistory('extrude', object);
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
            id: this._generateId(),
            type: 'boolean',
            booleanType: type,
            geometry: resultGeometry,
            operands: [objectA.id, objectB.id],
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        };

        this.objects.push(resultObject);
        this._addHistory(`boolean_${type}`, resultObject);
        return resultObject;
    }

    _generateId() {
        return `obj_${this.currentId++}`;
    }

    _addHistory(action, object) {
        this.history.push({
            action,
            object: JSON.parse(JSON.stringify(object)),
            timestamp: Date.now()
        });
    }
}
