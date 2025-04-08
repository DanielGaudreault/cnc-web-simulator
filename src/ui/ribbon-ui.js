class RibbonUI {
    constructor() {
        this.tabs = document.querySelectorAll('.ribbon-tab');
        this.panels = document.querySelectorAll('.ribbon-panel');
        this.activeTab = 'home';
        
        this._setupEventListeners();
    }

    _setupEventListeners() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.activateTab(tabName);
            });
        });
    }

    activateTab(tabName) {
        // Update tabs
        this.tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update panels
        this.panels.forEach(panel => {
            if (panel.getAttribute('data-panel') === tabName) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
        
        this.activeTab = tabName;
    }

    createButton(group, label, icon, callback) {
        const button = document.createElement('button');
        button.innerHTML = `<img src="icons/${icon}.svg" alt="${label}"> ${label}`;
        button.addEventListener('click', callback);
        
        const groupEl = this._findGroup(group);
        if (groupEl) {
            groupEl.appendChild(button);
        }
        
        return button;
    }

    createDropdown(group, label, options, callback) {
        const container = document.createElement('div');
        container.className = 'ribbon-dropdown';
        
        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        container.appendChild(labelEl);
        
        const select = document.createElement('select');
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            select.appendChild(option);
        });
        
        select.addEventListener('change', (e) => callback(e.target.value));
        container.appendChild(select);
        
        const groupEl = this._findGroup(group);
        if (groupEl) {
            groupEl.appendChild(container);
        }
        
        return select;
    }

    _findGroup(name) {
        const groups = document.querySelectorAll('.ribbon-group h3');
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].textContent.toLowerCase() === name.toLowerCase()) {
                return groups[i].parentElement;
            }
        }
        return null;
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `ribbon-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }
}
