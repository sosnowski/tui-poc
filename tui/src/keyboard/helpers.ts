import type { KeyEvent } from "@opentui/core";

export function clamp(value: number, min: number, max: number): number {
	if (max < min) return min;
	return Math.max(min, Math.min(max, value));
}

export function moveIndex(index: number, delta: number, length: number): number {
	return clamp(index + delta, 0, Math.max(0, length - 1));
}

export function printableChar(e: KeyEvent): string | undefined {
	if (e.sequence && e.sequence.length === 1 && /[ -~]/.test(e.sequence)) {
		return e.sequence;
	}
	return undefined;
}

export function isPlainKey(e: KeyEvent, name: string): boolean {
	return e.name === name && !e.ctrl && !e.meta;
}

export function isEnterKey(e: KeyEvent): boolean {
	return (
		e.name === "return" ||
		e.name === "enter" ||
		e.name === "linefeed" ||
		e.sequence === "\r" ||
		e.sequence === "\n"
	);
}
