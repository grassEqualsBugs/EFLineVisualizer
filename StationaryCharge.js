class StationaryCharge {
	constructor(x, y, charge) {
		this.charge = charge;
		this.radius = 10;
		this.x = x;
		this.y = y;
		this.positiveColor = "red";
		this.negativeColor = "blue";
		this.held = false;
	}

	// assuming electrically charged test points in the plane
	getElectricFieldAt(x, y) {
		const dx = x - this.x;
		const dy = y - this.y;
		let result = {
			x: dx,
			y: dy,
		};
		// normalize the force vector (for directional purposes)
		result = norm(result);

		// determine the force vector based off of Coulomb's Law
		let k = 200000;
		const coulombMagnitude =
			this.charge / Math.max(dx * dx + dy * dy, this.radius * this.radius);
		result.x *= k * coulombMagnitude;
		result.y *= k * coulombMagnitude;
		return result;
	}

	draw(context) {
		context.fillStyle =
			this.charge > 0 ? this.positiveColor : this.negativeColor;
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		context.fill();
		context.fillStyle = "white";
		context.fillRect(
			this.x - this.radius / 2,
			this.y - 1.5,
			this.radius,
			3,
		);
		if (this.charge > 0) {
			context.fillRect(
				this.x - 1.5,
				this.y - this.radius / 2,
				3,
				this.radius,
			);
		}
	}

	collision(x, y) {
		const dx = x - this.x;
		const dy = y - this.y;
		return Math.sqrt(dx * dx + dy * dy) <= this.radius;
	}
}
