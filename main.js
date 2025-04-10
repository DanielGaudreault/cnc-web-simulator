document.addEventListener('DOMContentLoaded', () => {
    const viewer = new CNCViewer();
    const fileInput = document.getElementById('file-input');
    const gcodeInput = document.getElementById('gcode-input');

    document.getElementById('save-btn').addEventListener('click', () => {
        const blob = new Blob([gcodeInput.value], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'gcode.nc';
        link.click();
    });

    document.getElementById('open-file-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        document.getElementById('loading-overlay').style.display = 'flex';
        const reader = new FileReader();
        reader.onload = () => {
            const buffer = reader.result;
            const ext = file.name.split('.').pop().toLowerCase();
            let data;
            if (['mcam'].includes(ext)) {
                const parser = new McamParser(buffer);
                data = parser.parse();
            } else {
                const text = new TextDecoder().decode(buffer);
                gcodeInput.value = text;
                const parser = new GcodeParser(text);
                data = parser.parse();
            }
            if (data.success) {
                viewer.loadToolpaths(data.toolpaths);
                updateInfo(file, data);
            }
            document.getElementById('loading-overlay').style.display = 'none';
        };
        reader.readAsArrayBuffer(file);
    });

    document.getElementById('sample-circle-btn').addEventListener('click', () => {
        const gcode = "G21 G90 T1 M6 G0 X0 Y0 Z5 G1 Z-1 F100 G2 X0 Y0 I10 J0 F200 G0 Z5";
        gcodeInput.value = gcode;
        const parser = new GcodeParser(gcode);
        const data = parser.parse();
        viewer.loadToolpaths(data.toolpaths);
        updateInfo(null, data);
    });

    document.getElementById('sample-square-btn').addEventListener('click', () => {
        const gcode = "G21 G90 T1 M6 G0 X-10 Y-10 Z5 G1 Z-1 F100 G1 X10 Y-10 F200 G1 X10 Y10 G1 X-10 Y10 G1 X-10 Y-10 G0 Z5";
        gcodeInput.value = gcode;
        const parser = new GcodeParser(gcode);
        const data = parser.parse();
        viewer.loadToolpaths(data.toolpaths);
        updateInfo(null, data);
    });

    document.getElementById('plot-file-btn').addEventListener('click', () => {
        const parser = new GcodeParser(gcodeInput.value);
        const data = parser.parse();
        if (data.success) viewer.loadToolpaths(data.toolpaths);
    });

    document.getElementById('clear-plot').addEventListener('click', () => {
        viewer.history.push(JSON.stringify(viewer.toolpaths));
        viewer.redoStack = [];
        viewer.toolpaths = [];
        viewer.stopSimulation();
        if (viewer.is2DView) viewer.render2D();
        else viewer.render3D();
        updateInfo(null, { toolpaths: [], units: 'N/A' });
    });

    document.getElementById('view-toggle').addEventListener('click', () => viewer.toggleView());
    document.getElementById('reset-view').addEventListener('click', () => viewer.resetView());
    document.getElementById('toggle-material').addEventListener('click', () => viewer.toggleMaterial());
    document.getElementById('export-btn').addEventListener('click', () => viewer.exportToSTL());
    document.getElementById('ctrl-fastrewind').addEventListener('click', () => viewer.fastRewind());
    document.getElementById('ctrl-rewind').addEventListener('click', () => viewer.skipBackward());
    document.getElementById('ctrl-play-reverse').addEventListener('click', () => viewer.startSimulation(-1));
    document.getElementById('ctrl-stop').addEventListener('click', () => viewer.stopSimulation());
    document.getElementById('ctrl-play').addEventListener('click', () => viewer.startSimulation(1));
    document.getElementById('ctrl-fwd').addEventListener('click', () => viewer.skipForward());
    document.getElementById('ctrl-fastfwd').addEventListener('click', () => viewer.fastForward());
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        if (viewer.animationData) viewer.animationData.speed = parseFloat(e.target.value);
    });
    document.getElementById('vc-home').addEventListener('click', () => viewer.resetView());
    document.getElementById('undo-btn').addEventListener('click', () => viewer.undo());
    document.getElementById('redo-btn').addEventListener('click', () => viewer.redo());

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
