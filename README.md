# Electric Field Visualizer

An interactive electric-field visualizer built with HTML, CSS, and JavaScript. Place source charges on the canvas to see their combined field. Field lines are shown by default; the Show menu can switch to vector arrows. The line settings control the number of lines per charge and the spacing of arrows along those lines.

## Controls

Canvas shortcuts work while the cursor is over the canvas.

- P: place a positive source charge at the cursor
- N: place a negative source charge at the cursor
- T: place a positive test charge at the cursor; press again to add more
- Space: pause or resume test-charge movement
- E: remove the charge at the cursor
- R: clear the canvas
- Drag: move a source charge
- Hold I: trace a path integral with the cursor

Test charges move independently in the field and do not affect the source charges or one another. Each has an arrow showing the field direction at its position. Test charges stick to negative source charges on contact and follow them when dragged. Pausing movement releases any stuck test charges and leaves them in place; they resume from those positions. Removing a negative source charge also releases its test charges. Contact with a positive source charge removes the test charge. Use the Move test charges and Show test-charge arrows checkboxes to control movement and arrows separately.

While tracing a path with I, return near its starting point to snap it closed. The readout shows the numeric value, calculated from the potential difference between the path's endpoints. A closed path reads zero. The same readout stays visible in the expanded canvas view.
