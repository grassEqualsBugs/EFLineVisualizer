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
let xSpacing = 15;
let ySpacing = 15;
for (let x = 0; x <= canvas.clientWidth; x += xSpacing) {
	for (let y = 0; y <= canvas.clientHeight; y += ySpacing) {
		testCharges.push(new TestCharge(x, y));
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
			charges[i].x = mousePos.x - charges[i].radius / 2;
			charges[i].y = mousePos.y - charges[i].radius / 2;
		}
	}
	for (let i = 0; i < testCharges.length; i++)
		testCharges[i].updateSuperposition(charges);
}

function draw() {
	for (let i = 0; i < testCharges.length; i++) testCharges[i].draw(context);
	for (let i = 0; i < charges.length; i++) charges[i].draw(context);
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
	}
});

(function step() {
	update();
	context.fillStyle = "white";
	context.fillRect(0, 0, 1280, 720);
	draw();
	window.requestAnimationFrame(step);
})();
