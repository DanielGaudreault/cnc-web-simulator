class FileUtils {
    static async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    static async readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    static downloadText(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static downloadJSON(data, filename) {
        this.downloadText(JSON.stringify(data, null, 2), filename);
    }

    static getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    static isBinaryFile(extension) {
        const binaryExtensions = ['mcam', 'stl', 'step', 'iges'];
        return binaryExtensions.includes(extension);
    }
}
