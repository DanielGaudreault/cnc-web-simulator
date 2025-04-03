import DxfParser from 'dxf-parser';

// Grab fileText in node.js or browser
const fileText = ...;

const parser = new DxfParser();
try {
    const dxf = parser.parse(fileText);
} catch(err) {
    return console.error(err.stack);
}
