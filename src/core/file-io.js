class MastercamFileIO {
    constructor() {
        this.formats = {
            '.mcam': this._handleMCAMFile.bind(this),
            '.step': this._handleSTEPFile.bind(this),
            '.iges': this._handleIGESFile.bind(this),
            '.stl': this._handleSTLFile.bind(this)
        };
    }

    async importFile(file) {
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        const handler = this.formats[extension];
        
        if (!handler) {
            throw new Error(`Unsupported file format: ${extension}`);
        }
        
        return handler(file);
    }

    async exportFile(objects, format = 'mcam') {
        switch (format.toLowerCase()) {
            case 'mcam':
                return this._exportMCAM(objects);
            case 'step':
                return this._exportSTEP(objects);
            case 'stl':
                return this._exportSTL(objects);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    async _handleMCAMFile(file) {
        const arrayBuffer = await FileUtils.readFileAsArrayBuffer(file);
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        const manifest = JSON.parse(await zip.file('manifest.json').async('text'));
        const geometry = await this._parseMCAMGeometry(
