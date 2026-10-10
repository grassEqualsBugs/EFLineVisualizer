# [Electric Field Visualizer](https://grassequalsbugs.github.io/EFLineVisualizer/)

An interactive electric-field visualizer built with plain HTML, CSS, and JavaScript. Place source charges on the canvas to see their combined field. Field lines are shown by default; the Show menu can switch to vector arrows. The line settings control the number of lines per charge and the spacing of arrows along those lines.

## Controls

- P: place a positive source charge at the cursor
- N: place a negative source charge at the cursor
- T: place a positive test charge at the cursor; press again to add more
- Space: pause or resume test-charge movement
- E: remove the charge at the cursor
- R: clear the canvas
- Drag: move a source charge
- Hold I: trace a path integral with the cursor

While tracing a path with I, return near its starting point to snap it closed. The readout shows the numeric value, calculated from the potential difference between the path's endpoints. 
