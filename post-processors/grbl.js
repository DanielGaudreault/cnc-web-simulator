class GrblPostProcessor {
    static getHeader() {
        return `(PROGRAM NAME)
(POST PROCESSOR: GRBL)
G21 (MM)
G90 (ABSOLUTE)
G54 (WORK OFFSET)`;
    }
    
    static getFooter() {
        return `G0 Z10 (SAFE Z)
G0 X0 Y0 (HOME XY)
M30`;
    }
    
    static getToolChangeCommand(toolNumber, diameter, length) {
        return `\n(T${toolNumber} TOOL CHANGE)
(TOOL DIAMETER: ${diameter.toFixed(4)})
(TOOL LENGTH: ${length.toFixed(4)})\n`;
    }
    
    static getSpindleOnCommand(speed, direction = "CW") {
        const dirCode = direction === "CW" ? "M3" : "M4";
        return `${dirCode} S${Math.round(speed)} (SPINDLE ON)\n`;
    }
    
    static getSpindleOffCommand() {
        return "M5 (SPINDLE OFF)\n";
    }
    
    static getFeedrateCommand(feedrate) {
        return `F${Math.round(feedrate)} (FEEDRATE)\n`;
    }
    
    static getCoolantCommand(type) {
        const code = type === "flood" ? "M8" : type === "mist" ? "M7" : "";
        return code ? `${code} (COOLANT ON)\n` : "";
    }
    
    static getRapidMoveCommand(x, y, z) {
        return `G0 X${x.toFixed(4)} Y${y.toFixed(4)} Z${z.toFixed(4)} (RAPID)\n`;
    }
    
    static getLinearMoveCommand(x, y, z) {
        return `G1 X${x.toFixed(4)} Y${y.toFixed(4)} Z${z.toFixed(4)} (LINEAR)\n`;
    }
}
