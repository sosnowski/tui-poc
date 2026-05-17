// Tiny matcher parser for KeyBinding.match strings.
//
// Examples of supported specs:
//   "q"             plain q (no modifiers)
//   "Q"             shift+q
//   "ctrl+enter"    ctrl held + enter/return
//   "meta+enter"    cmd held + enter/return
//   "shift+tab"     shift+tab
//   "escape"        escape
//   "/"             slash
//
// The grammar is intentionally minimal: parts are joined by "+" and the last
// part is the key name. Unknown modifiers are ignored.

import type { KeyEvent } from "@opentui/core";

import type { KeyMatcher } from "./types";

const KEY_ALIASES: Record<string, string> = {
	enter: "return",
	esc: "escape",
	cmd: "meta",
};

interface Parsed {
	ctrl: boolean;
	meta: boolean;
	shift: boolean;
	alt: boolean;
	key: string;
}

const cache = new Map<string, Parsed>();

function parse(spec: string): Parsed {
	const cached = cache.get(spec);
	if (cached) return cached;

	const parts = spec.toLowerCase().split("+").map((p) => p.trim()).filter(Boolean);
	const last = parts.pop() ?? "";
	const key = KEY_ALIASES[last] ?? last;

	const set = new Set(parts.map((p) => KEY_ALIASES[p] ?? p));
	const parsed: Parsed = {
		ctrl: set.has("ctrl"),
		meta: set.has("meta"),
		shift: set.has("shift"),
		alt: set.has("alt") || set.has("option"),
		key,
	};
	cache.set(spec, parsed);
	return parsed;
}

export function matches(matcher: KeyMatcher, e: KeyEvent): boolean {
	if (typeof matcher === "function") return matcher(e);

	const p = parse(matcher);
	if (Boolean(e.ctrl) !== p.ctrl) return false;
	if (Boolean(e.meta) !== p.meta) return false;
	// Don't gate on shift for shift-implicit specs like "Q" — fall through to
	// name matching, which already encodes the case-sensitive shape.
	if (p.shift && !e.shift) return false;

	if (e.name === p.key) return true;
	if (e.sequence === p.key) return true;
	return false;
}
