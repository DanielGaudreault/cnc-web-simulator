import * as THREE from 'three';

class CADViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.objects = [];

        this.initRenderer();
        this.initLighting();
        this.initCameraControls();
    }

    initRenderer() {
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    initLighting() {
        const ambientLight = new THREE.AmbientLight(0x888888);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(ambientLight);
        this.scene.add(directionalLight);
    }

    initCameraControls() {
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }

    addObject(object) {
        this.objects.push(object);
        this.scene.add(object);
    }

    removeObject(objectId) {
        const object = this.objects.find(obj => obj.id === objectId);
        if (object) {
            this.scene.remove(object);
            this.objects = this.objects.filter(obj => obj.id !== objectId);
        }
    }

    render() {
        requestAnimationFrame(() => this.render());
        this.renderer.render(this.scene, this.camera);
    }
}

export default CADViewer;

