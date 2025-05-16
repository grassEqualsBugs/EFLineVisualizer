function mag(v) {
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

function norm(v) {
	return { x: v.x / mag(v), y: v.y / mag(v) };
}

function scalar(v, a) {
	return { x: v.x * a, y: v.y * a };
}

function clamp(x, min, max) {
	if (x < min) return min;
	if (x > max) return max;
	return x;
}

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function smoothstep(x, k) {
	return Math.pow(x, k) / (Math.pow(x, k) + Math.pow(1 - x, k));
}

function resampleCurve(points, spacing, includeFirst = true) {
	if (!Array.isArray(points) || points.length < 2) {
		return includeFirst && points.length === 1 ? [points[0]] : [];
	}

	// Compute lengths of each segment
	const segLengths = [];
	for (let i = 0; i < points.length - 1; i++) {
		const dx = points[i + 1].x - points[i].x;
		const dy = points[i + 1].y - points[i].y;
		segLengths.push(Math.hypot(dx, dy));
	}

	const totalLength = segLengths.reduce((sum, L) => sum + L, 0);
	if (totalLength < spacing) {
		// Curve shorter than one spacing; return just the start (or empty)
		return includeFirst ? [points[0]] : [];
	}

	const output = [];
	if (includeFirst) output.push({ ...points[0] });

	let accum = 0;
	let nextDistance = spacing;
	let segIndex = 0;

	// Walk along segments, placing samples
	while (segIndex < segLengths.length && nextDistance <= totalLength) {
		const L = segLengths[segIndex];
		if (accum + L >= nextDistance) {
			// Sample lies on this segment
			const t = (nextDistance - accum) / L;
			const p0 = points[segIndex];
			const p1 = points[segIndex + 1];
			const sample = {
				x: p0.x + t * (p1.x - p0.x),
				y: p0.y + t * (p1.y - p0.y),
			};
			output.push(sample);
			nextDistance += spacing;
		} else {
			// Move to next segment
			accum += L;
			segIndex++;
		}
	}

	return output;
}
