document.addEventListener('DOMContentLoaded', () => {
    const viewer = new CNCViewer();

    document.getElementById('save-btn').addEventListener('click', () => viewer.exportToSTL());
    document.getElementById('file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const parser = new GcodeParser(event.target.result);
            const data = parser.parse();
            if (data.success) {
                viewer.loadToolpaths(data.toolpaths);
                updateInfo(file, data);
            }
        };
        reader.readAsText(file);
    });
    document.getElementById('sample-circle-btn').addEventListener('click', () => {
        const gcode = "G00 X0 Y0\nG01 X10 Y10\nG02 X0 Y20 R10\nG01 X0 Y0";
        const parser = new GcodeParser(gcode);
        const data = parser.parse();
        viewer.loadToolpaths(data.toolpaths);
        updateInfo(null, data);
    });
    document.getElementById('sample-square-btn').addEventListener('click', () => {
        const gcode = "G00 X0 Y0\nG01 X10 Y0\nG01 X10 Y10\nG01 X0 Y10\nG01 X0 Y0";
        const parser = new GcodeParser(gcode);
        const data = parser.parse();
        viewer.loadToolpaths(data.toolpaths);
        updateInfo(null, data);
    });
    document.getElementById('plot-btn').addEventListener('click', () => {
        const gcode = document.getElementById('gcode-input').value;
        const parser = new GcodeParser(gcode);
        const data = parser.parse();
        if (data.success) {
            viewer.loadToolpaths(data.toolpaths);
            updateInfo(null, data);
        }
    });
    document.getElementById('clear-btn').addEventListener('click', () => {
        viewer.toolpaths = [];
        viewer.stopSimulation();
        if (viewer.is2DView) viewer.render2D();
        else viewer.render3D();
        updateInfo(null, { toolpaths: [], units: 'N/A' });
    });
    document.getElementById('ctrl-2d3d').addEventListener('click', () => viewer.toggleView());
    document.getElementById('ctrl-material').addEventListener('click', () => viewer.toggleMaterial());
    document.getElementById('ctrl-reset').addEventListener('click', () => viewer.resetView());
    document.getElementById('ctrl-rewind').addEventListener('click', () => viewer.fastRewind());
    document.getElementById('ctrl-play-reverse').addEventListener('click', () => viewer.startSimulation(-1));
    document.getElementById('ctrl-play').addEventListener('click', () => viewer.startSimulation(1));
    document.getElementById('ctrl-forward').addEventListener('click', () => viewer.fastForward());

    function updateInfo(file, data) {
        document.getElementById('file-name').textContent = file ? file.name : 'None';
        document.getElementById('file-size').textContent = file ? `${(file.size / 1024).toFixed(2)} KB` : '0 KB';
        document.getElementById('toolpath-count').textContent = data.toolpaths.length;
        document.getElementById('units').textContent = data.units || 'N/A';
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        data.toolpaths.forEach(tp => {
            tp.points.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                minZ = Math.min(minZ, p.z);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
                maxZ = Math.max(maxZ, p.z);
            });
        });
        document.getElementById('bounds').textContent = data.toolpaths.length ?
            `X: ${minX.toFixed(1)}-${maxX.toFixed(1)}, Y: ${minY.toFixed(1)}-${maxY.toFixed(1)}, Z: ${minZ.toFixed(1)}-${maxZ.toFixed(1)}` :
            'N/A';
        document.getElementById('current-tool').textContent = 'N/A';
    }

    window.addEventListener('resize', () => viewer.resizeCanvas());
});
