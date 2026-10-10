const canvas = document.getElementById("canv");
const context = canvas.getContext("2d");
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
let mouseDown = 0;
let mouseOverCanvas = false;
let mousePos = { x: 0, y: 0 };
let mousePathOn = 0;
let mousePosPath = [];
let pathCanClose = false;
let pathClosed = false;
const fieldView = document.getElementById("fieldView");
const testChargeMovement = document.getElementById("testChargeMovement");
const testChargeArrows = document.getElementById("testChargeArrows");
const fieldLines = new FieldLines();

const expandedView = document.getElementById("expandedView");
const pathFieldStrength = document.getElementById("pathFieldStrength");
const pathIntegralValue = document.getElementById("pathIntegralValue");
const pathIntegralSymbol = document.getElementById("pathIntegralSymbol");
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

	// same coordinates, more pixels
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
		movingCharges[i].update(charges, dt, testChargeMovement.checked);
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
	for (let i = 0; i < movingCharges.length; i++) movingCharges[i].draw(context, testChargeArrows.checked);

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
		if (mousePathOn == 1) {
			context.fillStyle = "gray";
			context.beginPath();
			context.arc(mousePosPath[0].x, mousePosPath[0].y, 3, 0, Math.PI * 2);
			context.fill();
		}
	}
}

function reset() {
	charges = [];
	movingCharges = [];
	mousePosPath = [];
	pathCanClose = false;
	pathClosed = false;
	mousePathOn = 0;
}

document.getElementById("reset").onclick = reset;

window.addEventListener("keydown", (e) => {
	if (!mouseOverCanvas) return;
	if (e.target && ["SELECT", "INPUT", "BUTTON"].includes(e.target.tagName)) return;
	if (e.code == "Space") {
		e.preventDefault();
		if (!e.repeat) testChargeMovement.checked = !testChargeMovement.checked;
		return;
	}
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
			mousePosPath = [{ x: mousePos.x, y: mousePos.y }];
			pathCanClose = false;
			pathClosed = false;
			mousePathOn = 1;
		}
	}
});

function computePathIntegral() {
	if (mousePosPath.length < 2) return 0;
	const first = mousePosPath[0];
	const last = mousePosPath[mousePosPath.length - 1];
	let result = 0;
	// use the potential difference so a closed path doesn't pick up rounding error
	for (let i = 0; i < charges.length; i++) {
		const charge = charges[i];
		function potential(pos) {
			const r = mag({ x: pos.x - charge.x, y: pos.y - charge.y });
			// matches the capped field inside a source charge
			const value = r >= charge.radius ? 1 / r :
				2 / charge.radius - r / (charge.radius * charge.radius);
			return 200000 * charge.charge * value / 100;
		}
		result += potential(first) - potential(last);
	}
	return result;
}

window.addEventListener("keyup", (e) => {
	if (e.key == "i") {
		updateMousePath();
		mousePathOn = 0;
	}
});

function updateMousePath() {
	if (mousePathOn != 1 || !mouseOverCanvas) return;
	const first = mousePosPath[0];
	const last = mousePosPath[mousePosPath.length - 1];
	const snapRadius = 12 * canvasWidth / canvas.getBoundingClientRect().width;
	const dx = mousePos.x - last.x;
	const dy = mousePos.y - last.y;
	const lengthSquared = dx * dx + dy * dy;
	if (lengthSquared == 0) return;
	// check the whole mouse step so crossing the start also closes the path
	const t = clamp(((first.x - last.x) * dx + (first.y - last.y) * dy) / lengthSquared, 0, 1);
	const distance = mag({ x: last.x + t * dx - first.x, y: last.y + t * dy - first.y });
	if (pathCanClose && distance <= snapRadius) {
		mousePosPath.push({ x: first.x, y: first.y });
		pathClosed = true;
		mousePathOn = 0;
		return;
	}
	if (mag({ x: mousePos.x - first.x, y: mousePos.y - first.y }) > snapRadius * 2) pathCanClose = true;
	mousePosPath.push({ x: mousePos.x, y: mousePos.y });
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
	pathIntegralSymbol.textContent = pathClosed ? "∮" : "∫";
	const value = computePathIntegral();
	pathIntegralValue.textContent = (Math.abs(value) < 0.0005 ? 0 : value).toFixed(3);
	window.requestAnimationFrame(step);
})();
