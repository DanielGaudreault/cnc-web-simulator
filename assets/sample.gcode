; Sample G-code - Square Pocket
G21        ; Metric units
G90        ; Absolute positioning
G0 Z5      ; Safe height

; Tool: 3mm end mill
M3 S10000  ; Spindle on at 10,000 RPM
G4 P2      ; Wait 2 seconds

; Outer contour
G0 X0 Y0
G1 Z-2 F300
G1 X20 F800
G1 Y20
G1 X0
G1 Y0

; Inner pocket
G1 Z-4 F300
G1 X5 Y5 F800
G1 X15
G1 Y15
G1 X5
G1 Y5

; Finish
G0 Z50
M5        ; Spindle off
M30       ; Program end
