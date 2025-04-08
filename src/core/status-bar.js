class StatusBar {
    constructor() {
        this.coordinatesElement = document.querySelector('.status-bar .coordinates');
        this.unitsElement = document.querySelector('.status-bar .units');
        this.selectionElement = document.querySelector('.status-bar .selection-count');
        this.messageElement = document.createElement('div');
        this.messageElement.className = 'message';
        
        document.querySelector('.status-bar').appendChild(this.messageElement);
        
        this.units = 'mm';
        this.messageTimeout = null;
    }

    updateCoordinates(x, y, z) {
        this.coordinatesElement.textContent = 
            `X: ${x.toFixed(3)} Y: ${y.toFixed(3)} Z: ${z.toFixed(3)}`;
    }

    updateSelectionCount(count) {
        this.selectionElement.textContent = `Selected: ${count}`;
    }

    toggleUnits() {
        this.units = this.units === 'mm' ? 'inch' : 'mm';
        this.unitsElement.textContent = `Units: ${this.units}`;
    }

    showMessage(text, type = 'info', duration = 3000) {
        this.messageElement.textContent = text;
        this.messageElement.className = `message ${type}`;
        
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        
        if (duration > 0) {
            this.messageTimeout = setTimeout(() => {
                this.messageElement.textContent = '';
                this.messageElement.className = 'message';
            }, duration);
        }
    }

    showProgress(message, progress) {
        this.showMessage(`${message} ${Math.round(progress * 100)}%`, 'progress', 0);
    }
}
