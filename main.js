const canvas = document.getElementById("canv");
const context = canvas.getContext("2d");
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
let mouseDown = 0;
let mouseOverCanvas = false;
let mousePos = { x: 0, y: 0 };
let mousePathOn = 0;
let mousePosPath = [];
const fieldView = document.getElementById("fieldView");
const fieldLines = new FieldLines();

const expandedView = document.getElementById("expandedView");
const pathFieldStrength = document.getElementById("pathFieldStrength");
let backdropPressed = false;

document.getElementById("expand").onclick = () => {
	stopCanvasInteraction();
	document.getElementById("expandedContent").append(canvas);
	document.getElementById("expandedContent").after(pathFieldStrength);
	document.body.classList.add("expanded");
	expandedView.showModal();
	canvas.focus({ preventScroll: true });
	resizeCanvas();
};
document.getElementById("collapse").onclick = () => expandedView.close();
expandedView.addEventListener("close", () => {
	stopCanvasInteraction();
	document.getElementById("canvasHome").append(canvas);
	document.getElementById("canvasHome").after(pathFieldStrength);
	document.body.classList.remove("expanded");
	resizeCanvas();
});
function outsideExpandedView(e) {
	const rect = expandedView.getBoundingClientRect();
	return e.target == expandedView && (e.clientX < rect.left || e.clientX > rect.right ||
		e.clientY < rect.top || e.clientY > rect.bottom);
}
expandedView.onmousedown = (e) => {
	backdropPressed = outsideExpandedView(e);
};
expandedView.onclick = (e) => {
	if (backdropPressed && outsideExpandedView(e)) expandedView.close();
	backdropPressed = false;
};

fieldView.onchange = () => {
	document.getElementById("fieldSettings").hidden = fieldView.value != "lines";
};
document.getElementById("lineCount").oninput = (e) => {
	fieldLines.linesPerCharge = Number(e.target.value);
	document.getElementById("lineCountValue").textContent = e.target.value;
};
document.getElementById("arrowDensity").onchange = (e) => {
	fieldLines.arrowSpacing = Number(e.target.value);
};


function resizeCanvas() {
	const rect = canvas.getBoundingClientRect();
	const pixelRatio = window.devicePixelRatio || 1;
	const width = Math.max(1, Math.round(canvas.clientWidth * rect.width / canvas.offsetWidth * pixelRatio));
	const height = Math.max(1, Math.round(canvas.clientHeight * rect.height / canvas.offsetHeight * pixelRatio));
	if (canvas.width == width && canvas.height == height) return;

	// Match screen pixels while keeping the simulation in its original coordinates.
	canvas.width = width;
	canvas.height = height;
	context.setTransform(width / canvasWidth, 0, 0, height / canvasHeight, 0, 0);
}

function updateMousePos(e) {
	const rect = canvas.getBoundingClientRect();
	const scaleX = rect.width / canvas.offsetWidth;
	const scaleY = rect.height / canvas.offsetHeight;
	mousePos = {
		x: ((e.clientX - rect.left) / scaleX - canvas.clientLeft) * canvasWidth / canvas.clientWidth,
		y: ((e.clientY - rect.top) / scaleY - canvas.clientTop) * canvasHeight / canvas.clientHeight,
	};
	mouseOverCanvas = mousePos.x >= 0 && mousePos.x <= canvasWidth &&
		mousePos.y >= 0 && mousePos.y <= canvasHeight;
	if (!mouseOverCanvas) stopCanvasInteraction();
}

function stopCanvasInteraction() {
	mouseOverCanvas = false;
	mouseDown = 0;
	mousePathOn = 0;
	for (let i = 0; i < charges.length; i++) charges[i].held = false;
}

canvas.onmouseenter = (e) => {
	updateMousePos(e);
	canvas.focus({ preventScroll: true });
};
canvas.onmousemove = updateMousePos;
canvas.onmouseleave = stopCanvasInteraction;
canvas.onmousedown = (e) => {
	if (e.button != 0) return;
	updateMousePos(e);
	if (!mouseOverCanvas) return;
	mouseDown = 1;
	for (let i = charges.length - 1; i >= 0; i--) {
		if (charges[i].collision(mousePos.x, mousePos.y)) {
			charges[i].held = true;
			break;
		}
	}
};
window.addEventListener("mouseup", () => {
	mouseDown = 0;
});
window.addEventListener("blur", stopCanvasInteraction);

let charges = [];
let testCharges = [];
let movingCharges = [];
let lastTime = performance.now();
const spacing = 20;
for (let x = 0; x <= canvasWidth; x += spacing) {
	for (let y = 0; y <= canvasHeight; y += spacing) {
		testCharges.push(new TestCharge(x, y, spacing));
	}
}

function update(dt) {
	for (let i = 0; i < charges.length; i++) {
		if (mouseDown == 0) charges[i].held = false;
	}
	for (let i = 0; i < charges.length; i++) {
		if (charges[i].held) {
			charges[i].x = mousePos.x;
			charges[i].y = mousePos.y;
		}
	}
	if (fieldView.value == "arrows") {
		for (let i = 0; i < testCharges.length; i++)
			testCharges[i].updateSuperposition(charges);
	} else {
		fieldLines.update(charges, canvasWidth, canvasHeight);
	}
	for (let i = movingCharges.length - 1; i >= 0; i--) {
		movingCharges[i].update(charges, dt);
		if (movingCharges[i].despawned) movingCharges.splice(i, 1);
	}
}

function draw() {
	if (fieldView.value == "arrows") {
		for (let i = 0; i < testCharges.length; i++) testCharges[i].draw(context);
	} else {
		fieldLines.draw(context);
	}
	for (let i = 0; i < charges.length; i++) charges[i].draw(context);
	for (let i = 0; i < movingCharges.length; i++) movingCharges[i].draw(context);

	// path integral
	if (mousePosPath.length > 0) {
		context.strokeStyle = "gray";
		context.lineWidth = 2;
		context.beginPath();
		context.moveTo(mousePosPath[0].x, mousePosPath[0].y);
		for (let i = 1; i < mousePosPath.length; i++) {
			context.fillStyle = "black";
			context.lineTo(mousePosPath[i].x, mousePosPath[i].y);
		}
		context.stroke();
	}
}

function reset() {
	charges = [];
	movingCharges = [];
	mousePosPath = [];
	mousePathOn = 0;
}

document.getElementById("reset").onclick = reset;

window.addEventListener("keydown", (e) => {
	if (!mouseOverCanvas) return;
	if (e.target && ["SELECT", "INPUT", "BUTTON"].includes(e.target.tagName)) return;
	if (e.repeat) return;
	if (e.key == "p") {
		charges.push(new StationaryCharge(mousePos.x, mousePos.y, 1));
	} else if (e.key == "n") {
		charges.push(new StationaryCharge(mousePos.x, mousePos.y, -1));
	} else if (e.key == "t") {
		movingCharges.push(new MovingCharge(mousePos.x, mousePos.y));
	} else if (e.key == "e") {
		for (let i = movingCharges.length - 1; i >= 0; i--) {
			if (movingCharges[i].collision(mousePos.x, mousePos.y)) {
				movingCharges.splice(i, 1);
				return;
			}
		}
		for (let i = 0; i < charges.length; i++) {
			if (charges[i].collision(mousePos.x, mousePos.y)) {
				charges.splice(i, 1);
				break;
			}
		}
	} else if (e.key == "r") {
		reset();
	} else if (e.key == "i") {
		if (mousePathOn == 0) {
			mousePosPath = [];
			mousePathOn = 1;
		}
	}
});

function computePathIntegral() {
	let pathCharges = [];
	mousePosPath.forEach((pos) => {
		const charge = new TestCharge(pos.x, pos.y, -1);
		charge.updateSuperposition(charges);
		pathCharges.push(charge);
	});
	let result = 0;
	for (let i = 0; i < pathCharges.length - 1; i++) {
		const first = pathCharges[i];
		const second = pathCharges[i + 1];
		const ds = {
			x: second.x - first.x,
			y: second.y - first.y,
		};
		const superposition = scalar(first.superposition, 1 / 100);
		result += superposition.x * ds.x + superposition.y * ds.y;
	}
	return result;
}

window.addEventListener("keyup", (e) => {
	if (e.key == "i") {
		mousePathOn = 0;
	}
});

function updateMousePath() {
	if (mousePathOn == 1 && mouseOverCanvas) {
		mousePosPath.push({ x: mousePos.x, y: mousePos.y });
		mousePosPath = resampleCurve(mousePosPath, 0.5);
	}
}

(function step(time = performance.now()) {
	resizeCanvas();
	const dt = clamp((time - lastTime) / 1000, 0, 0.05);
	lastTime = time;
	update(dt);
	updateMousePath();

	context.fillStyle = "white";
	context.fillRect(0, 0, canvasWidth, canvasHeight);
	draw();
	pathFieldStrength.textContent =
		`Path integral strength: ${computePathIntegral().toFixed(3)}`;
	window.requestAnimationFrame(step);
})();
