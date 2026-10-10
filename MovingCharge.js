class MovingCharge extends StationaryCharge {
	constructor(x, y) {
		super(x, y, 1);
		this.radius = 6;
		this.symbolWidth = 1.5;
		this.mass = 0.5;
		this.positiveColor = "black";
		this.velocity = { x: 0, y: 0 };
		this.despawned = false;
	}

	update(charges, dt) {
		// Small time steps keep the motion stable near source charges.
		const steps = Math.ceil(dt / (1 / 240));
		for (let i = 0; i < steps && !this.despawned; i++) {
			const acceleration = { x: 0, y: 0 };
			// a = qE / m; half the mass gives twice the acceleration.
			charges.forEach((charge) => {
				const field = charge.getElectricFieldAt(this.x, this.y);
				acceleration.x += field.x * this.charge / this.mass;
				acceleration.y += field.y * this.charge / this.mass;
			});
			this.velocity.x += acceleration.x * dt / steps;
			this.velocity.y += acceleration.y * dt / steps;
			const dx = this.velocity.x * dt / steps;
			const dy = this.velocity.y * dt / steps;

			for (let j = 0; j < charges.length; j++) {
				const charge = charges[j];
				const distanceSquared = dx * dx + dy * dy;
				const t = distanceSquared == 0 ? 0 : clamp(
					((charge.x - this.x) * dx + (charge.y - this.y) * dy) /
						distanceSquared, 0, 1,
				);
				const distance = mag({
					x: this.x + t * dx - charge.x,
					y: this.y + t * dy - charge.y,
				});
				if (distance <= this.radius + charge.radius) {
					this.velocity = { x: 0, y: 0 };
					this.despawned = true;
					break;
				}
			}
			if (!this.despawned) {
				this.x += dx;
				this.y += dy;
			}
		}
	}

}
