class FieldLines {
	constructor() {
		this.lines = [];
		this.linesPerCharge = 20;
		this.arrowSpacing = 120;
		this.previousState = "";
	}

	getDirection(x, y, charges) {
		const result = { x: 0, y: 0 };
		let totalMagnitude = 0;
		charges.forEach((charge) => {
			const field = charge.getElectricFieldAt(x, y);
			result.x += field.x;
			result.y += field.y;
			totalMagnitude += mag(field);
		});
		if (mag(result) <= totalMagnitude * 0.000001) return { x: 0, y: 0 };
		return norm(result);
	}

	trace(x, y, direction, charges, width, height) {
		const points = [{ x, y }];
		let step = 3;
		for (let i = 0; i < 2000; i++) {
			const first = this.getDirection(x, y, charges);
			if (mag(first) == 0) break;
			let next;
			while (step >= 0.01) {
				const middle = this.getDirection(
					x + first.x * direction * step / 2,
					y + first.y * direction * step / 2,
					charges,
				);
				next = {
					x: x + middle.x * direction * step,
					y: y + middle.y * direction * step,
				};
				const last = this.getDirection(next.x, next.y, charges);
				// smaller steps near sharp turns and field nulls
				if (first.x * middle.x + first.y * middle.y > 0.995 &&
					middle.x * last.x + middle.y * last.y > 0.995) break;
				step /= 2;
			}
			if (step < 0.01) break;
			x = next.x;
			y = next.y;
			step = Math.min(3, step * 1.5);
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

		// space arrows along the curve
		const count = Math.max(1, Math.floor(length / this.arrowSpacing));
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
		const state = JSON.stringify([width, height, this.linesPerCharge, this.arrowSpacing, charges.map((charge) => [charge.x, charge.y, charge.charge])]);
		if (state == this.previousState) return;
		this.previousState = state;
		this.lines = [];
		charges.forEach((charge) => {
			const direction = charge.charge > 0 ? 1 : -1;
			for (let i = 0; i < this.linesPerCharge; i++) {
				// offset the starting angles
				const angle = (i + 0.5) * Math.PI * 2 / this.linesPerCharge;
				const line = this.trace(
					charge.x + Math.cos(angle) * (charge.radius + 1),
					charge.y + Math.sin(angle) * (charge.radius + 1),
					direction, charges, width, height,
				);
				// positive charges cover the connections
				// negative charges add lines from outside
				if (direction == 1 || !line.endedOnCharge)
					this.lines.push({
						points: line.points,
						direction,
						arrows: this.getArrows(line.points, direction),
					});
			}
		});
		this.spaceLines(charges);
	}

	spaceLines(charges) {
		const spacing = clamp(120 / this.linesPerCharge, 3, 8);
		const cells = new Map();
		const selected = new Set();
		const candidates = this.lines.map((line) => {
			let curvature = 0;
			for (let i = 2; i < line.points.length; i++) {
				const a = line.points[i - 2];
				const b = line.points[i - 1];
				const c = line.points[i];
				const first = { x: b.x - a.x, y: b.y - a.y };
				const second = { x: c.x - b.x, y: c.y - b.y };
				const length = mag(first) + mag(second);
				if (length == 0) continue;
				const u = norm(first);
				const v = norm(second);
				curvature = Math.max(curvature, mag({ x: v.x - u.x, y: v.y - u.y }) * 2 / length);
			}
			return { line, curvature };
		});
		// skip curves that nearly overlap
		candidates.sort((a, b) => a.curvature - b.curvature);
		candidates.forEach(({ line, curvature }) => {
			const samples = [];
			let crowdedLength = 0;
			for (let i = 1; i < line.points.length; i++) {
				const point = line.points[i];
				if (charges.some((charge) => mag({ x: point.x - charge.x, y: point.y - charge.y }) < charge.radius * 4)) continue;
				const x = Math.floor(point.x / spacing);
				const y = Math.floor(point.y / spacing);
				let crowded = false;
				for (let dx = -1; dx <= 1 && !crowded; dx++) {
					for (let dy = -1; dy <= 1 && !crowded; dy++) {
						const nearby = cells.get(`${x + dx},${y + dy}`) || [];
						crowded = nearby.some((other) => other.curvature * 1.5 < curvature &&
							mag({ x: point.x - other.x, y: point.y - other.y }) < spacing);
					}
				}
				if (crowded) {
					const previous = line.points[i - 1];
					crowdedLength += mag({ x: point.x - previous.x, y: point.y - previous.y });
					if (crowdedLength > 30) return;
				}
				samples.push(point);
			}
			selected.add(line);
			samples.forEach((point) => {
				const key = `${Math.floor(point.x / spacing)},${Math.floor(point.y / spacing)}`;
				if (!cells.has(key)) cells.set(key, []);
				cells.get(key).push({ x: point.x, y: point.y, line, curvature });
			});
		});
		this.lines = this.lines.filter((line) => selected.has(line));
		this.lines.forEach((line) => {
			line.arrows = line.arrows.filter((arrow) => {
				const x = Math.floor(arrow.x / spacing);
				const y = Math.floor(arrow.y / spacing);
				const range = Math.ceil(5 / spacing);
				for (let dx = -range; dx <= range; dx++) {
					for (let dy = -range; dy <= range; dy++) {
						const nearby = cells.get(`${x + dx},${y + dy}`) || [];
						if (nearby.some((other) => other.line != line &&
							mag({ x: arrow.x - other.x, y: arrow.y - other.y }) < 5)) return false;
					}
				}
				return true;
			});
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
