class StatusBar {
    constructor(containerId, cadEngine) {
        this.container = document.getElementById(containerId);
        this.cadEngine = cadEngine;
        this.status = {
            coordinates: { x: 0, y: 0, z: 0 },
            units: "mm",
            selectionCount: 0,
            message: { text: "", type: "info" }
        };

        this._setupUI();
        this._setupEventListeners();
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

    _setupEventListeners() {
        document.addEventListener("mousemove", (event) => {
            this.updateCoordinates(event.clientX, event.clientY, 0);
        });

        this.cadEngine.onSelectionChange((selectedObjects) => {
            this.updateSelectionCount(selectedObjects.length);
        });

        this.cadEngine.onTransformation((object) => {
            this.showNotification(`Transformed ${object.name}`, "success");
        });

        this.cadEngine.onFileLoaded((fileName) => {
            this.showNotification(`Loaded file: ${fileName}`, "info");
        });

        this.cadEngine.onError((errorMessage) => {
            this.showNotification(`Error: ${errorMessage}`, "error");
        });
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

    showNotification(message, type = "info") {
        this.status.message = { text: message, type };
        this.messageElement.textContent = message;
        this.messageElement.className = `message ${type}`;

        // Floating alert UI
        const alert = document.createElement("div");
        alert.classList.add("status-alert", type);
        alert.textContent = message;
        document.body.appendChild(alert);

        setTimeout(() => {
            alert.classList.add("fade-out");
            setTimeout(() => alert.remove(), 500);
        }, 4000);
    }
}

export default StatusBar;
