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

	// called after updateSuperposition
	draw(context) {
		const colorPower = Math.round(
			lerp(255, 0, clamp(mag(this.superposition) / 40, 0, 1)),
		);
		const adjustedMagnitude = clamp(mag(this.superposition), 0, 20);
		this.superposition = scalar(
			norm(this.superposition),
			adjustedMagnitude,
		);
		context.beginPath();
		context.strokeStyle = `rgb(255, ${colorPower}, 255)`;
		context.lineWidth = 2;
		context.moveTo(this.x, this.y);
		context.lineTo(
			this.x + this.superposition.x,
			this.y + this.superposition.y,
		);
		context.stroke();
	}
}
