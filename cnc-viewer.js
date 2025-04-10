class CNCViewer {
    constructor() {
        this.canvas2D = document.getElementById('canvas-2d');
        this.ctx2D = this.canvas2D.getContext('2d');
        this.scene = new THREE.Scene();
        this.camera3D = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer3D = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas-3d'), antialias: true });
        this.controls = new THREE.OrbitControls(this.camera3D, this.renderer3D.domElement);
        this.viewcubeScene = new THREE.Scene();
        this.viewcubeCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.viewcubeRenderer = new THREE.WebGLRenderer({ canvas: document.getElementById('viewcube-canvas'), antialias: true });
        this.toolpaths = [];
        this.is2DView = true; // Start in 2D
        this.showMaterial = false;
        this.materialMesh = null;
        this.animating = false;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.history = [];
        this.redoStack = [];
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.renderer3D.setClearColor(0xffffff);
        this.camera3D.position.set(50, 50, 50);
        this.camera3D.lookAt(0, 0, 0);
        this.controls.enableDamping = true;
        this.controls.target.set(0, 0, 0);
        this.scene.add(new THREE.AmbientLight(0x404040));
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(1, 1, 1);
        this.scene.add(light);

        const gridSize = 100;
        const gridHelper = new THREE.GridHelper(gridSize, 20, 0x000000, 0x888888);
        this.scene.add(gridHelper);
        const axesHelper = new THREE.AxesHelper(gridSize / 2);
        this.scene.add(axesHelper);

        this.viewcubeRenderer.setSize(100, 100);
        this.viewcubeCamera.position.set(2, 2, 2);
        this.viewcubeCamera.lookAt(0, 0, 0);
        const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
        const cubeMat = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true });
        this.viewcubeScene.add(new THREE.Mesh(cubeGeo, cubeMat));
        this.viewcubeScene.add(new THREE.AxesHelper(1.5));

        this.canvas2D.addEventListener('wheel', (e) => this.handleZoom(e));
        this.canvas2D.addEventListener('mousedown', (e) => this.startPan(e));
        this.render2D();
        this.animate();
    }

    resizeCanvas() {
        const container = document.getElementById('canvas-container');
        const controlBarHeight = document.getElementById('control-bar').offsetHeight + 10;
        const width = container.clientWidth;
        const height = container.clientHeight - controlBarHeight;
        this.canvas2D.width = width;
        this.canvas2D.height = height;
        this.renderer3D.setSize(width, height);
        this.camera3D.aspect = width / height;
        this.camera3D.updateProjectionMatrix();
        if (this.is2DView) this.render2D();
    }

    handleZoom(e) {
        e.preventDefault();
        this.zoom *= e.deltaY > 0 ? 0.9 : 1.1;
        this.render2D();
    }

    startPan(e) {
        let lastX = e.clientX, lastY = e.clientY;
        const move = (e) => {
            this.panX += (e.clientX - lastX) / this.zoom;
            this.panY += (e.clientY - lastY) / this.zoom;
            lastX = e.clientX;
            lastY = e.clientY;
            this.render2D();
        };
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }

    render2D() {
        this.ctx2D.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        this.ctx2D.fillStyle = '#ffffff';
        this.ctx2D.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);

        const scale = (Math.min(this.canvas2D.width, this.canvas2D.height) / 100) * this.zoom;
        const offsetX = this.canvas2D.width / 2 + this.panX;
        const offsetY = this.canvas2D.height / 2 + this.panY;

        // Grid
        this.ctx2D.lineWidth = 0.5;
        this.ctx2D.strokeStyle = '#888888';
        for (let i = -50; i <= 50; i += 1) {
            if (i % 10 === 0) continue;
            this.ctx2D.beginPath();
            this.ctx2D.moveTo(i * scale + offsetX, -50 * scale + offsetY);
            this.ctx2D.lineTo(i * scale + offsetX, 50 * scale + offsetY);
            this.ctx2D.stroke();
            this.ctx2D.beginPath();
            this.ctx2D.moveTo(-50 * scale + offsetX, i * scale + offsetY);
            this.ctx2D.lineTo(50 * scale + offsetX, i * scale + offsetY);
            this.ctx2D.stroke();
        }

        this.ctx2D.lineWidth = 1;
        this.ctx2D.strokeStyle = '#000000';
        for (let i = -50; i <= 50; i += 10) {
            this.ctx2D.beginPath();
            this.ctx2D.moveTo(i * scale + offsetX, -50 * scale + offsetY);
            this.ctx2D.lineTo(i * scale + offsetX, 50 * scale + offsetY);
            this.ctx2D.stroke();
            this.ctx2D.beginPath();
            this.ctx2D.moveTo(-50 * scale + offsetX, i * scale + offsetY);
            this.ctx2D.lineTo(50 * scale + offsetX, i * scale + offsetY);
            this.ctx2D.stroke();
        }

        this.ctx2D.lineWidth = 2;
        this.ctx2D.strokeStyle = '#ff0000'; // X-axis
        this.ctx2D.beginPath();
        this.ctx2D.moveTo(-50 * scale + offsetX, 0 * scale + offsetY);
        this.ctx2D.lineTo(50 * scale + offsetX, 0 * scale + offsetY);
        this.ctx2D.stroke();

        this.ctx2D.strokeStyle = '#00ff00'; // Y-axis
        this.ctx2D.beginPath();
        this.ctx2D.moveTo(0 * scale + offsetX, -50 * scale + offsetY);
        this.ctx2D.lineTo(0 * scale + offsetX, 50 * scale + offsetY);
        this.ctx2D.stroke();

        // Toolpaths
        this.ctx2D.strokeStyle = '#0000ff';
        this.ctx2D.lineWidth = 1;
        this.toolpaths.forEach(tp => {
            this.ctx2D.beginPath();
            tp.points.forEach((p, i) => {
                const x = p.x * scale + offsetX;
                const y = p.y * scale + offsetY;
                if (i === 0) this.ctx2D.moveTo(x, y);
                else this.ctx2D.lineTo(x, y);
            });
            this.ctx2D.stroke();
        });
    }

    render3D() {
        this.scene.children.filter(obj => obj.userData.isToolpath || obj === this.materialMesh).forEach(obj => this.scene.remove(obj));
        this.toolpaths.forEach(tp => {
            const points = tp.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
            const line = new THREE.Line(geometry, material);
            line.userData.isToolpath = true;
            this.scene.add(line);
        });
        if (this.showMaterial) this.loadMaterial();
    }

    loadMaterial() {
        if (this.materialMesh) this.scene.remove(this.materialMesh);
        if (!this.toolpaths.length) return;

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        this.toolpaths.forEach(tp => {
            tp.points.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                minZ = Math.min(minZ, p.z);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
                maxZ = Math.max(maxZ, p.z);
            });
        });

        const width = Math.max(maxX - minX + 10, 50);
        const height = Math.max(maxY - minY + 10, 50);
        const depth = Math.max(maxZ - minZ + 10, 50);
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.7 });
        this.materialMesh = new THREE.Mesh(geometry, material);
        this.materialMesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
        this.scene.add(this.materialMesh);
    }

    toggleView() {
        this.is2DView = !this.is2DView;
        this.canvas2D.style.display = this.is2DView ? 'block' : 'none';
        this.canvas3D.style.display = this.is2DView ? 'none' : 'block';
        if (this.is2DView) this.render2D();
        else this.render3D();
    }

    toggleMaterial() {
        this.showMaterial = !this.showMaterial;
        if (this.showMaterial) this.loadMaterial();
        else if (this.materialMesh) this.scene.remove(this.materialMesh);
    }

    resetView() {
        if (this.is2DView) {
            this.zoom = 1;
            this.panX = 0;
            this.panY = 0;
            this.render2D();
        } else {
            this.camera3D.position.set(50, 50, 50);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
            this.viewcubeCamera.position.set(2, 2, 2);
            this.viewcubeCamera.lookAt(0, 0, 0);
        }
    }

    loadToolpaths(toolpaths) {
        this.history.push(JSON.stringify(this.toolpaths));
        this.redoStack = [];
        this.toolpaths = toolpaths;
        if (this.is2DView) this.render2D();
        else this.render3D();
        this.updateButtonStates();
    }

    startSimulation(direction = 1) {
        if (!this.toolpaths.length) return;
        if (this.animating) this.stopSimulation();
        this.animating = true;
        this.animationData = {
            currentPath: direction > 0 ? 0 : this.toolpaths.length - 1,
            currentPoint: direction > 0 ? 0 : this.toolpaths[this.toolpaths.length - 1].points.length - 1,
            speed: parseFloat(document.getElementById('speed-slider').value),
            direction
        };
        document.getElementById(direction > 0 ? 'ctrl-play' : 'ctrl-play-reverse').classList.add('active');
        this.togglePlayPause(direction > 0 ? 'ctrl-play' : 'ctrl-play-reverse', true);
        this.animateSimulation();
    }

    stopSimulation() {
        this.animating = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        document.getElementById('ctrl-play').classList.remove('active');
        document.getElementById('ctrl-play-reverse').classList.remove('active');
        this.togglePlayPause('ctrl-play', false);
        this.togglePlayPause('ctrl-play-reverse', false);
        if (this.is2DView) this.render2D();
        else this.render3D();
    }

    animateSimulation() {
        if (!this.animating) return;
        const { currentPath, currentPoint, speed, direction } = this.animationData;
        if (currentPath >= this.toolpaths.length || currentPath < 0) {
            this.stopSimulation();
            return;
        }

        const path = this.toolpaths[currentPath];
        const pointIndex = Math.floor(currentPoint);
        if (pointIndex >= path.points.length || pointIndex < 0) {
            this.animationData.currentPath += direction;
            this.animationData.currentPoint = direction > 0 ? 0 : (this.toolpaths[currentPath + direction]?.points.length - 1 || 0);
            this.animateSimulation();
            return;
        }

        const point = path.points[pointIndex];
        document.getElementById('current-tool').textContent = path.toolNumber || 'N/A';

        if (this.is2DView) {
            this.render2D();
            const scale = (Math.min(this.canvas2D.width, this.canvas2D.height) / 100) * this.zoom;
            const offsetX = this.canvas2D.width / 2 + this.panX;
            const offsetY = this.canvas2D.height / 2 + this.panY;
            this.ctx2D.fillStyle = '#ff0000';
            this.ctx2D.beginPath();
            this.ctx2D.arc(point.x * scale + offsetX, point.y * scale + offsetY, 2, 0, 2 * Math.PI);
            this.ctx2D.fill();
        } else {
            const tool = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            tool.position.set(point.x, point.y, point.z);
            tool.userData.isToolpath = true;
            this.scene.add(tool);
            setTimeout(() => this.scene.remove(tool), 100);
        }

        this.animationData.currentPoint += speed * direction;
        this.animationFrameId = requestAnimationFrame(() => this.animateSimulation());
    }

    fastRewind() {
        if (!this.toolpaths.length || !this.animationData) return;
        this.animationData.currentPath = Math.max(0, this.animationData.currentPath - 5);
        this.animationData.currentPoint = 0;
        if (!this.animating) this.render3D();
    }

    fastForward() {
        if (!this.toolpaths.length || !this.animationData) return;
        this.animationData.currentPath = Math.min(this.toolpaths.length - 1, this.animationData.currentPath + 5);
        this.animationData.currentPoint = 0;
        if (!this.animating) this.render3D();
    }

    skipBackward() {
        if (!this.toolpaths.length || !this.animationData) return;
        this.animationData.currentPath = Math.max(0, this.animationData.currentPath - 1);
        this.animationData.currentPoint = 0;
        if (!this.animating) this.render3D();
    }

    skipForward() {
        if (!this.toolpaths.length || !this.animationData) return;
        this.animationData.currentPath = Math.min(this.toolpaths.length - 1, this.animationData.currentPath + 1);
        this.animationData.currentPoint = 0;
        if (!this.animating) this.render3D();
    }

    togglePlayPause(buttonId, isPlaying) {
        const playBtn = document.getElementById(`${buttonId === 'ctrl-play' ? 'play-btn' : 'play-btn-reverse'}`);
        const pauseBtn = document.getElementById(`${buttonId === 'ctrl-play' ? 'pause-btn' : 'pause-btn-reverse'}`);
        playBtn.style.display = isPlaying ? 'none' : '';
        pauseBtn.style.display = isPlaying ? '' : 'none';
    }

    exportToSTL() {
        if (!this.materialMesh) {
            alert('No material to export. Load a toolpath first.');
            return;
        }
        const exporter = new THREE.STLExporter();
        const stlString = exporter.parse(this.materialMesh);
        const blob = new Blob([stlString], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'cnc_model.stl';
        link.click();
    }

    undo() {
        if (this.history.length === 0) return;
        this.redoStack.push(JSON.stringify(this.toolpaths));
        this.toolpaths = JSON.parse(this.history.pop());
        if (this.is2DView) this.render2D();
        else this.render3D();
        this.updateButtonStates();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        this.history.push(JSON.stringify(this.toolpaths));
        this.toolpaths = JSON.parse(this.redoStack.pop());
        if (this.is2DView) this.render2D();
        else this.render3D();
        this.updateButtonStates();
    }

    updateButtonStates() {
        document.getElementById('undo-btn').classList.toggle('disabled', this.history.length === 0);
        document.getElementById('redo-btn').classList.toggle('disabled', this.redoStack.length === 0);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.is2DView) {
            this.controls.update();
            this.renderer3D.render(this.scene, this.camera3D);
            const cameraDirection = new THREE.Vector3();
            this.camera3D.getWorldDirection(cameraDirection);
            this.viewcubeCamera.position.copy(cameraDirection).multiplyScalar(-2);
            this.viewcubeCamera.lookAt(0, 0, 0);
            this.viewcubeRenderer.render(this.viewcubeScene, this.viewcubeCamera);
        }
    }
}
