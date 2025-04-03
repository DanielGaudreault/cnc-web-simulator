; Sample G-code for square pocket
G21 ; mm units
G90 ; absolute positioning
G0 Z5 ; safe height

; Tool: 3mm end mill
M3 S1000 ; spindle on
G4 P2 ; wait 2 sec

; Pocketing
G0 X0 Y0
G1 Z-1 F100
G1 X10 F200
G1 Y10
G1 X0
G1 Y0
G1 Z-2 F100
G1 X10 F200
G1 Y10
G1 X0
G1 Y0

; Finish
G0 Z5
M5 ; spindle off
M30 ; program end
