const canvas = document.getElementById("canv");
const context = canvas.getContext("2d");
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
let mouseDown = 0;
let mousePos = { x: 0, y: 0 };
let mousePathOn = 0;
let mousePosPath = [];
const fieldView = document.getElementById("fieldView");
const fieldLines = new FieldLines();

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
}

canvas.onmousedown = (e) => {
	if (e.button != 0) return;
	updateMousePos(e);
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
window.addEventListener("blur", () => {
	mouseDown = 0;
	mousePathOn = 0;
});
document.body.onmousemove = updateMousePos;

let charges = [];
let testCharges = [];
let movingCharge = null;
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
	if (movingCharge) {
		movingCharge.update(charges, dt);
		if (movingCharge.despawned) movingCharge = null;
	}
}

function draw() {
	if (fieldView.value == "arrows") {
		for (let i = 0; i < testCharges.length; i++) testCharges[i].draw(context);
	} else {
		fieldLines.draw(context);
	}
	for (let i = 0; i < charges.length; i++) charges[i].draw(context);
	if (movingCharge) movingCharge.draw(context);

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
	movingCharge = null;
	mousePosPath = [];
	mousePathOn = 0;
}

document.getElementById("reset").onclick = reset;

window.addEventListener("keydown", (e) => {
	if (e.target && ["SELECT", "INPUT", "BUTTON"].includes(e.target.tagName)) return;
	if (e.repeat) return;
	if (e.key == "p") {
		charges.push(new StationaryCharge(mousePos.x, mousePos.y, 1));
	} else if (e.key == "n") {
		charges.push(new StationaryCharge(mousePos.x, mousePos.y, -1));
	} else if (e.key == "t") {
		movingCharge = new MovingCharge(mousePos.x, mousePos.y);
	} else if (e.key == "e") {
		if (movingCharge && movingCharge.collision(mousePos.x, mousePos.y)) {
			movingCharge = null;
			return;
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
	if (mousePathOn == 1) {
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
	document.getElementById("pathFieldStrength").innerHTML =
		`Path integral strength: ${computePathIntegral().toFixed(3)}`;
	window.requestAnimationFrame(step);
})();
