export function blendHex(base: string, tint: string, amount: number): string {
	const parse = (hex: string) => {
		const match = /^#?([0-9a-f]{6})$/i.exec(hex);
		const value = match?.[1];
		if (!value) return undefined;
		return {
			r: Number.parseInt(value.slice(0, 2), 16),
			g: Number.parseInt(value.slice(2, 4), 16),
			b: Number.parseInt(value.slice(4, 6), 16),
		};
	};
	const baseRgb = parse(base);
	const tintRgb = parse(tint);
	if (!baseRgb || !tintRgb) return tint;

	const channel = (from: number, to: number) =>
		Math.round(from + (to - from) * amount)
			.toString(16)
			.padStart(2, "0");
	return `#${channel(baseRgb.r, tintRgb.r)}${channel(baseRgb.g, tintRgb.g)}${channel(
		baseRgb.b,
		tintRgb.b,
	)}`;
}
