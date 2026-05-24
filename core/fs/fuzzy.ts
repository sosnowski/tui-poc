export function fuzzyScore(value: string, query: string): number | null {
	if (value === query) return 0;
	if (value.startsWith(query)) return 1;
	if (value.includes(query)) return 2;

	let cursor = 0;
	let gap = 0;

	for (const char of query) {
		const found = value.indexOf(char, cursor);
		if (found === -1) return null;

		gap += found - cursor;
		cursor = found + 1;
	}

	return 3 + gap;
}
