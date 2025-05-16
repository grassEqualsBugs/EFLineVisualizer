class TestCharge {
	constructor(x, y, spacing) {
		this.x = x;
		this.y = y;
		this.superposition = { x: 0, y: 0 };
		this.spacing = spacing;
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
		const adjustedMagnitude = clamp(
			mag(this.superposition),
			0,
			this.spacing + 5,
		);
		this.superposition = scalar(
			norm(this.superposition),
			adjustedMagnitude,
		);
		context.beginPath();
		context.strokeStyle = `rgb(255, 0, 255)`;
		context.lineWidth = lerp(0.4, 0.8, adjustedMagnitude / 20);
		context.moveTo(
			this.x - this.superposition.x / 2,
			this.y - this.superposition.y / 2,
		);
		context.lineTo(
			this.x + this.superposition.x / 2,
			this.y + this.superposition.y / 2,
		);
		const leftArrowLine = scalar(
			{
				x:
					((-this.superposition.x + this.superposition.y) *
						Math.sqrt(2)) /
					2,
				y:
					(-(this.superposition.x + this.superposition.y) *
						Math.sqrt(2)) /
					2,
			},
			0.25,
		);
		context.lineTo(
			this.x + this.superposition.x / 2 + leftArrowLine.x,
			this.y + this.superposition.y / 2 + leftArrowLine.y,
		);
		const rightArrowLine = scalar(
			{
				x:
					(-(this.superposition.x + this.superposition.y) *
						Math.sqrt(2)) /
					2,
				y:
					((this.superposition.x - this.superposition.y) *
						Math.sqrt(2)) /
					2,
			},
			0.25,
		);
		context.moveTo(
			this.x + this.superposition.x / 2,
			this.y + this.superposition.y / 2,
		);
		context.lineTo(
			this.x + this.superposition.x / 2 + rightArrowLine.x,
			this.y + this.superposition.y / 2 + rightArrowLine.y,
		);
		context.stroke();
	}
}
