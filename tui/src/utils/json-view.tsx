// Tiny JSON syntax highlighter that produces a tree of <span>s with token
// colors taken from the active theme. Used by the response Body tab and
// the request Body editor when bodyType === "json".

import type { JSX } from "@opentui/solid";

import { S } from "../components/styled-span";
import { theme } from "../state/store";

/** Recursively render a JSON value into a coloured span tree. */
export function renderJson(value: unknown): JSX.Element {
	return walk(value, 0, false);
}

function walk(v: unknown, depth: number, trailingComma: boolean): JSX.Element {
	const t = theme();
	const pad = "  ".repeat(depth);
	const inner = "  ".repeat(depth + 1);

	if (v === null) return tok(t.null, "null", trailingComma);
	if (typeof v === "boolean") return tok(t.bool, String(v), trailingComma);
	if (typeof v === "number") return tok(t.num, String(v), trailingComma);
	if (typeof v === "string") return tok(t.str, JSON.stringify(v), trailingComma);

	if (Array.isArray(v)) {
		if (v.length === 0) return tok(t.punct, "[]", trailingComma);
		const items = v.map((item, i) => (
			<>
				<S>{inner}</S>
				{walk(item, depth + 1, i < v.length - 1)}
				<S>{"\n"}</S>
			</>
		));
		return (
			<>
				<S fg={t.punct}>{"[\n"}</S>
				{items}
				<S>{pad}</S>
				<S fg={t.punct}>{"]"}</S>
				{trailingComma ? <S fg={t.punct}>,</S> : null}
			</>
		);
	}

	if (typeof v === "object") {
		const keys = Object.keys(v as Record<string, unknown>);
		if (keys.length === 0) return tok(t.punct, "{}", trailingComma);
		const rows = keys.map((k, i) => (
			<>
				<S>{inner}</S>
				<S fg={t.key}>{JSON.stringify(k)}</S>
				<S fg={t.punct}>{": "}</S>
				{walk((v as Record<string, unknown>)[k], depth + 1, i < keys.length - 1)}
				<S>{"\n"}</S>
			</>
		));
		return (
			<>
				<S fg={t.punct}>{"{\n"}</S>
				{rows}
				<S>{pad}</S>
				<S fg={t.punct}>{"}"}</S>
				{trailingComma ? <S fg={t.punct}>,</S> : null}
			</>
		);
	}
	return null;
}

function tok(color: string, text: string, comma: boolean): JSX.Element {
	return (
		<>
			<S fg={color}>{text}</S>
			{comma ? <S>,</S> : null}
		</>
	);
}
