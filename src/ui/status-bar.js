class StatusBar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.status = {
            coordinates: { x: 0, y: 0, z: 0 },
            units: "mm",
            selectionCount: 0,
            message: { text: "", type: "info" }
        };

        this._setupUI();
    }

    _setupUI() {
        this.container.innerHTML = "";
        this.coordinatesElement = this._createStatusElement("coordinates", "X: 0.000 Y: 0.000 Z: 0.000");
        this.unitsElement = this._createStatusElement("units", "Units: mm");
        this.selectionElement = this._createStatusElement("selection", "Selected: 0");
        this.messageElement = this._createStatusElement("message", "");

        this.container.appendChild(this.coordinatesElement);
        this.container.appendChild(this.unitsElement);
        this.container.appendChild(this.selectionElement);
        this.container.appendChild(this.messageElement);
    }

    _createStatusElement(className, defaultText) {
        const div = document.createElement("div");
        div.classList.add(className);
        div.textContent = defaultText;
        return div;
    }

    updateCoordinates(x, y, z) {
        this.status.coordinates = { x, y, z };
        this.coordinatesElement.textContent = `X: ${x.toFixed(3)} Y: ${y.toFixed(3)} Z: ${z.toFixed(3)}`;
    }

    updateSelectionCount(count) {
        this.status.selectionCount = count;
        this.selectionElement.textContent = `Selected: ${count}`;
    }

    updateUnits(units) {
        this.status.units = units;
        this.unitsElement.textContent = `Units: ${units}`;
    }

    showMessage(text, type = "info") {
        this.status.message = { text, type };
        this.messageElement.textContent = text;
        this.messageElement.className = `message ${type}`;
    }
}

export default StatusBar;

