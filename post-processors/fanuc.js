class FanucPostProcessor {
    static getHeader() {
        return `%
O1000 (PROGRAM NAME)
(POST PROCESSOR: FANUC)
G20 (INCH)
G90 (ABSOLUTE)
G54 (WORK OFFSET)`;
    }
    
    static getFooter() {
        return `G28 G91 Z0 (RETURN TO HOME)
G28 G91 X0 Y0
M30
%`;
    }
    
    static getToolChangeCommand(toolNumber, diameter, length) {
        return `\nT${toolNumber} M6 (TOOL CHANGE)
G43 H${toolNumber} (TOOL LENGTH COMP)
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
        return `G00 X${x.toFixed(4)} Y${y.toFixed(4)} Z${z.toFixed(4)} (RAPID)\n`;
    }
    
    static getLinearMoveCommand(x, y, z) {
        return `G01 X${x.toFixed(4)} Y${y.toFixed(4)} Z${z.toFixed(4)} (LINEAR)\n`;
    }
}
