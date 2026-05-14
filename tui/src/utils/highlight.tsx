// Helpers that turn plain strings into colored span trees.
//
// `vars(value)` highlights {{var_name}} substitutions.
// `urlSpans(url)`  highlights both {{vars}} and :pathParams in a URL.

import type { JSX } from "@opentui/solid";

import { S } from "../components/styled-span";
import { theme } from "../state/store";

const TOKEN_RE = /(\{\{[^}]+\}\})|(:[a-zA-Z_]\w*)/g;
const VAR_RE = /(\{\{[^}]+\}\})/g;

// Solid's compiler treats JSX child expressions like `{m[1]}` as reactive
// member accesses and wraps them in effects that re-evaluate later. We can't
// rely on the mutating `m` regex match still being valid by then, so we copy
// the matched substrings into stable locals before they enter the JSX.

function splitByRegex(
	value: string,
	regex: RegExp,
	renderToken: (match: RegExpExecArray) => JSX.Element,
): JSX.Element[] {
	const out: JSX.Element[] = [];
	let last = 0;
	let m: RegExpExecArray | null;
	regex.lastIndex = 0;
	while ((m = regex.exec(value)) !== null) {
		const matched = m[0];
		const idx = m.index;
		if (idx > last) {
			const lead = value.slice(last, idx);
			out.push(<S>{lead}</S>);
		}
		out.push(renderToken(m));
		last = idx + matched.length;
	}
	if (last < value.length) {
		const tail = value.slice(last);
		out.push(<S>{tail}</S>);
	}
	return out;
}

/** Render a header / param value highlighting any `{{var}}` references. */
export function vars(value: string): JSX.Element {
	const t = theme();
	return splitByRegex(value, VAR_RE, (m) => {
		const varText = m[1]!;
		return <S fg={t.accent}>{varText}</S>;
	});
}

/** Render a URL highlighting both `{{vars}}` (accent) and `:pathParam` (accent2). */
export function urlSpans(url: string): JSX.Element {
	const t = theme();
	return splitByRegex(url, TOKEN_RE, (m) => {
		const varText = m[1];
		const pathText = m[2];
		if (varText) return <S fg={t.accent}>{varText}</S>;
		return <S fg={t.accent2}>{pathText!}</S>;
	});
}
