class StationaryCharge {
	constructor(x, y, charge) {
		this.charge = charge;
		this.radius = 10;
		this.x = x - this.radius;
		this.y = y - this.radius;
		this.positiveColor = "blue";
		this.negativeColor = "red";
		this.held = false;
	}

	// assuming electrically charged test points in the plane
	getElectricFieldAt(x, y) {
		const dx = this.x - x;
		const dy = this.y - y;
		let result = {
			x: dx,
			y: dy,
		};
		// normalize the force vector (for directional purposes)
		result = norm(result);

		// determine the force vector based off of Coulomb's Law
		let k = 1750;
		const coulombMagnitude = 1 / mag({ x: dx, y: dy });
		result.x *= k * coulombMagnitude;
		result.y *= k * coulombMagnitude;

		// divide the force vector by the charge of this particle to determine field
		// this is from F=qE equation
		result.x /= this.charge;
		result.y /= this.charge;
		return result;
	}

	draw(context) {
		context.fillStyle =
			this.charge > 0 ? this.positiveColor : this.negativeColor;
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		context.fill();
		context.fillStyle = "white";
		// context.fillRect(this.x, this.y, 2, 2);
	}

	collision(x, y) {
		const dx = x - this.radius - this.x;
		const dy = y - this.radius - this.y;
		return Math.sqrt(dx * dx + dy * dy) <= this.radius;
	}
}
