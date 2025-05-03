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
