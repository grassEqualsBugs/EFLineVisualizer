class TestCharge {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.superposition = { x: 0, y: 0 };
	}

	updateSuperposition(charges) {
		this.superposition = { x: 0, y: 0 };
		charges.forEach((charge) => {
			const field = charge.getElectricFieldAt(this.x, this.y);
			this.superposition.x += field.x;
			this.superposition.y += field.y;
		});
	}

	draw(context) {
		context.strokeStyle = "black";
		context.fillStyle = "black";
		context.beginPath();
		context.strokeStyle = "red";
		context.lineWidth = 3;
		context.moveTo(this.x, this.y);
		context.lineTo(
			this.x + this.superposition.x,
			this.y + this.superposition.y,
		);
		context.stroke();
		// context.moveTo(this.x, this.y);
		// context.arc(this.x, this.y, 5, 0, Math.PI * 2);
		// context.fill();
	}
}
