class MovingCharge extends StationaryCharge {
	constructor(x, y) {
		super(x, y, 1);
		this.radius = 6;
		this.symbolWidth = 1.5;
		this.mass = 0.5;
		this.positiveColor = "black";
		this.velocity = { x: 0, y: 0 };
		this.field = { x: 0, y: 0 };
		this.despawned = false;
		this.attachedCharge = null;
		this.attachmentOffset = { x: 0, y: 0 };
	}

	updateField(charges) {
		this.field = { x: 0, y: 0 };
		charges.forEach((charge) => {
			const field = charge.getElectricFieldAt(this.x, this.y);
			this.field.x += field.x;
			this.field.y += field.y;
		});
	}


	contact(charge) {
		this.velocity = { x: 0, y: 0 };
		if (charge.charge >= 0) {
			this.despawned = true;
			return;
		}
		this.attachedCharge = charge;
		let direction = norm({ x: this.x - charge.x, y: this.y - charge.y });
		if (mag(direction) == 0) direction = { x: 1, y: 0 };
		this.attachmentOffset = scalar(direction, this.radius + charge.radius);
		this.x = charge.x + this.attachmentOffset.x;
		this.y = charge.y + this.attachmentOffset.y;
	}

	update(charges, dt, movementEnabled = true) {
		if (!movementEnabled) {
			this.attachedCharge = null;
			this.updateField(charges);
			return;
		}
		if (this.attachedCharge) {
			if (charges.includes(this.attachedCharge)) {
				this.x = this.attachedCharge.x + this.attachmentOffset.x;
				this.y = this.attachedCharge.y + this.attachmentOffset.y;
				this.updateField(charges);
				return;
			}
			this.attachedCharge = null;
		}
		this.updateField(charges);
		for (let i = 0; i < charges.length; i++) {
			const charge = charges[i];
			if (mag({ x: this.x - charge.x, y: this.y - charge.y }) <= this.radius + charge.radius) {
				this.contact(charge);
				this.updateField(charges);
				return;
			}
		}
		// smaller steps near charges
		const steps = Math.ceil(dt / (1 / 240));
		for (let i = 0; i < steps && !this.despawned && !this.attachedCharge; i++) {
			this.updateField(charges);
			const acceleration = scalar(this.field, this.charge / this.mass);
			this.velocity.x += acceleration.x * dt / steps;
			this.velocity.y += acceleration.y * dt / steps;
			const dx = this.velocity.x * dt / steps;
			const dy = this.velocity.y * dt / steps;

			let hit = null;
			let hitTime = 1;
			const distanceSquared = dx * dx + dy * dy;
			// check for contact between steps
			for (let j = 0; j < charges.length && distanceSquared > 0; j++) {
				const charge = charges[j];
				const x = this.x - charge.x;
				const y = this.y - charge.y;
				const radius = this.radius + charge.radius;
				const projection = x * dx + y * dy;
				const discriminant = projection * projection - distanceSquared * (x * x + y * y - radius * radius);
				if (discriminant < 0) continue;
				const time = (-projection - Math.sqrt(discriminant)) / distanceSquared;
				if (time >= 0 && time <= hitTime) {
					hit = charge;
					hitTime = time;
				}
			}
			this.x += dx * hitTime;
			this.y += dy * hitTime;
			if (hit) this.contact(hit);
		}
		this.updateField(charges);
	}

	draw(context, showArrow = true) {
		// field direction
		if (showArrow && mag(this.field) > 0.00000001) {
			const vector = norm(this.field);
			const tip = {
				x: this.x + vector.x * (this.radius + 28),
				y: this.y + vector.y * (this.radius + 28),
			};
			context.save();
			context.strokeStyle = "black";
			context.lineWidth = 1.5;
			context.beginPath();
			context.moveTo(this.x, this.y);
			context.lineTo(tip.x, tip.y);
			context.moveTo(tip.x - 6 * vector.x + 3 * vector.y, tip.y - 6 * vector.y - 3 * vector.x);
			context.lineTo(tip.x, tip.y);
			context.lineTo(tip.x - 6 * vector.x - 3 * vector.y, tip.y - 6 * vector.y + 3 * vector.x);
			context.stroke();
			context.restore();
		}
		super.draw(context);
	}
}
