const canvas = document.getElementById("canv");
const context = canvas.getContext("2d");
let mouseDown = 0;
let mousePos = { x: 0, y: 0 };
let mousePathOn = 0;
let mousePosPath = [];
const fieldView = document.getElementById("fieldView");
const fieldLines = new FieldLines();

function updateMousePos(e) {
	const rect = canvas.getBoundingClientRect();
	mousePos = {
		x: (e.clientX - rect.left - canvas.clientLeft) * canvas.width / canvas.clientWidth,
		y: (e.clientY - rect.top - canvas.clientTop) * canvas.height / canvas.clientHeight,
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
for (let x = 0; x <= canvas.width; x += spacing) {
	for (let y = 0; y <= canvas.height; y += spacing) {
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
		fieldLines.update(charges, canvas.width, canvas.height);
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
	} else if (e.key == "s") {
		const value = prompt("New arrow spacing (pixels): ");
		if (value === null) return;
		const newSpacing = Number(value);
		if (!Number.isFinite(newSpacing) || newSpacing < 5) {
			alert("Minimum spacing is 5");
		} else {
			testCharges = [];
			for (let x = 0; x <= canvas.width; x += newSpacing) {
				for (let y = 0; y <= canvas.height; y += newSpacing) {
					testCharges.push(new TestCharge(x, y, newSpacing));
				}
			}
		}
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
	const dt = clamp((time - lastTime) / 1000, 0, 0.05);
	lastTime = time;
	update(dt);
	updateMousePath();

	context.fillStyle = "white";
	context.fillRect(0, 0, canvas.width, canvas.height);
	draw();
	document.getElementById("pathFieldStrength").innerHTML =
		`Path integral strength: ${computePathIntegral().toFixed(3)}`;
	window.requestAnimationFrame(step);
})();
