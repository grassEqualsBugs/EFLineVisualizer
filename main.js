const canvas = document.getElementById("canv");
const context = canvas.getContext("2d");
let mouseDown = 0;
let mousePos = { x: 0, y: 0 };
let mousePathOn = 0;
let mousePosPath = [];
let pressedBefore = false;

document.body.onmousedown = () => {
	mouseDown++;
};
document.body.onmouseup = () => {
	mouseDown--;
};
document.body.onmousemove = (e) => {
	mousePos = { x: e.clientX, y: e.clientY };
};

let charges = [];
let testCharges = [];
const spacing = 20;
for (let x = 0; x <= canvas.clientWidth; x += spacing) {
	for (let y = 0; y <= canvas.clientHeight; y += spacing) {
		testCharges.push(new TestCharge(x, y, spacing));
	}
}

function update() {
	for (let i = 0; i < charges.length; i++) {
		if (mouseDown == 0) charges[i].held = false;
		if (mouseDown == 1 && charges[i].collision(mousePos.x, mousePos.y))
			charges[i].held = true;
	}
	for (let i = 0; i < charges.length; i++) {
		if (charges[i].held) {
			charges[i].x = mousePos.x - charges[i].radius;
			charges[i].y = mousePos.y - charges[i].radius;
		}
	}
	for (let i = 0; i < testCharges.length; i++)
		testCharges[i].updateSuperposition(charges);
}

function draw() {
	for (let i = 0; i < testCharges.length; i++) testCharges[i].draw(context);
	for (let i = 0; i < charges.length; i++) charges[i].draw(context);

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

window.addEventListener("keydown", (e) => {
	if (e.key == "p") {
		charges.push(new StationaryCharge(mousePos.x, mousePos.y, 1));
	} else if (e.key == "n") {
		charges.push(new StationaryCharge(mousePos.x, mousePos.y, -1));
	} else if (e.key == "e") {
		for (let i = 0; i < charges.length; i++) {
			if (charges[i].collision(mousePos.x, mousePos.y)) {
				charges.splice(i, 1);
				break;
			}
		}
	} else if (e.key == "r") {
		charges = [];
		mousePosPath = [];
	} else if (e.key == "s") {
		const newSpacing = Number(prompt("New spacing: "));
		if (newSpacing < 5) {
			alert("Minimum spacing is 5");
		} else {
			testCharges = [];
			for (let x = 0; x <= canvas.clientWidth; x += newSpacing) {
				for (let y = 0; y <= canvas.clientHeight; y += newSpacing) {
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
		mousePosPath.push({ x: mousePos.x - 10, y: mousePos.y - 10 });
		mousePosPath = resampleCurve(mousePosPath, 0.5);
	}
}

(function step() {
	update();
	updateMousePath();

	context.fillStyle = "white";
	context.fillRect(0, 0, 1280, 720);
	draw();
	document.getElementById("pathFieldStrength").innerHTML =
		`Path integral strength: ${computePathIntegral().toFixed(3)}`;
	window.requestAnimationFrame(step);
})();
