class FieldLines {
	constructor() {
		this.lines = [];
		this.previousState = "";
	}

	getDirection(x, y, charges) {
		const result = { x: 0, y: 0 };
		charges.forEach((charge) => {
			const field = charge.getElectricFieldAt(x, y);
			result.x += field.x;
			result.y += field.y;
		});
		if (mag(result) < 0.00000001) return { x: 0, y: 0 };
		return norm(result);
	}

	trace(x, y, direction, charges, width, height) {
		const points = [{ x, y }];
		const step = 3;
		for (let i = 0; i < 2000; i++) {
			const first = this.getDirection(x, y, charges);
			if (mag(first) == 0) break;
			// Follow the field at the midpoint for smoother curves.
			const middle = this.getDirection(
				x + first.x * direction * step / 2,
				y + first.y * direction * step / 2,
				charges,
			);
			if (mag(middle) == 0) break;
			x += middle.x * direction * step;
			y += middle.y * direction * step;
			points.push({ x, y });
			for (let j = 0; j < charges.length; j++) {
				if (charges[j].collision(x, y)) return { points, endedOnCharge: true };
			}
			if (x < 0 || x > width || y < 0 || y > height) break;
		}
		return { points, endedOnCharge: false };
	}


	getArrows(points, direction) {
		let length = 0;
		for (let i = 1; i < points.length; i++)
			length += mag({ x: points[i].x - points[i - 1].x, y: points[i].y - points[i - 1].y });
		if (length < 60) return [];

		// Center evenly spaced arrows along each curve, away from its ends.
		const count = Math.max(1, Math.floor(length / 120));
		const spacing = length / count;
		const arrows = [];
		let distance = 0;
		for (let i = 1; i < points.length && arrows.length < count; i++) {
			const previous = points[i - 1];
			const point = points[i];
			const segment = { x: point.x - previous.x, y: point.y - previous.y };
			const segmentLength = mag(segment);
			if (segmentLength == 0) continue;
			while (arrows.length < count && (arrows.length + 0.5) * spacing <= distance + segmentLength) {
				const t = ((arrows.length + 0.5) * spacing - distance) / segmentLength;
				arrows.push({
					x: lerp(previous.x, point.x, t),
					y: lerp(previous.y, point.y, t),
					vector: scalar(norm(segment), direction),
				});
			}
			distance += segmentLength;
		}
		return arrows;
	}

	update(charges, width, height) {
		const state = JSON.stringify([width, height, charges.map((charge) => [charge.x, charge.y, charge.charge])]);
		if (state == this.previousState) return;
		this.previousState = state;
		this.lines = [];
		charges.forEach((charge) => {
			const direction = charge.charge > 0 ? 1 : -1;
			for (let i = 0; i < 20; i++) {
				const angle = i * Math.PI * 2 / 20;
				const line = this.trace(
					charge.x + Math.cos(angle) * (charge.radius + 1),
					charge.y + Math.sin(angle) * (charge.radius + 1),
					direction, charges, width, height,
				);
				// Positive seeds already cover connections between charges.
				// Negative seeds add lines arriving from outside the canvas.
				if (direction == 1 || !line.endedOnCharge)
					this.lines.push({
						points: line.points,
						direction,
						arrows: this.getArrows(line.points, direction),
					});
			}
		});
	}

	draw(context) {
		context.strokeStyle = "rgb(220, 0, 220)";
		context.lineWidth = 1;
		this.lines.forEach((line) => {
			context.beginPath();
			context.moveTo(line.points[0].x, line.points[0].y);
			for (let i = 1; i < line.points.length; i++)
				context.lineTo(line.points[i].x, line.points[i].y);
			context.stroke();
			line.arrows.forEach((point) => {
				const vector = point.vector;
				context.beginPath();
				context.moveTo(point.x - 5 * vector.x + 3 * vector.y, point.y - 5 * vector.y - 3 * vector.x);
				context.lineTo(point.x, point.y);
				context.lineTo(point.x - 5 * vector.x - 3 * vector.y, point.y - 5 * vector.y + 3 * vector.x);
				context.stroke();
			});
		});
	}
}
