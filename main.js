const canvas = document.getElementById("canv");
const context = canvas.getContext("2d");
let mouseDown = 0;
let mousePos = { x: 0, y: 0 };
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
}

window.addEventListener("keyup", (e) => {
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
	}
});

(function step() {
	update();
	context.fillStyle = "white";
	context.fillRect(0, 0, 1280, 720);
	draw();
	window.requestAnimationFrame(step);
})();
