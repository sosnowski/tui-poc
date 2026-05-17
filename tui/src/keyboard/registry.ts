// Central reactive registry of KeyScopes.
//
// Components call `registerKeyScope(scope)` (typically via the `useKeyScope`
// hook) to add their bindings. The registry exposes two derived memos that
// the rest of the app reads from:
//
//   - `activeBindings()`: the flat, priority-ordered list of bindings that
//     should be considered for the next KeyEvent.
//   - `activeHints()`: the hints to render in the status bar, ordered from
//     most-specific scope on the left to least-specific/global scope on the
//     right. Hints are deduped by key so a contextual hint shadows a global
//     one for the same key.
//
// An "exclusive" scope (e.g. inline edit mode) collapses both lists to that
// scope alone, which is how we make typing into a text field stop firing
// global shortcuts.

import { createMemo, createSignal } from "solid-js";

import type { KeyBinding, KeyHint, KeyScope } from "./types";

const [scopesSig, setScopes] = createSignal<KeyScope[]>([]);

/** Add a scope to the registry. Returns a disposer. */
export function registerKeyScope(scope: KeyScope): () => void {
	setScopes((arr) => [...arr, scope]);
	return () => {
		setScopes((arr) => arr.filter((s) => s !== scope));
	};
}

const activeScopes = createMemo<KeyScope[]>(() => {
	const all = scopesSig().filter((s) => s.active());
	all.sort((a, b) => b.priority - a.priority);
	return all;
});

/** Scopes that participate in dispatch and hint display right now. */
export const dispatchScopes = createMemo<KeyScope[]>(() => {
	const scopes = activeScopes();
	const exclusive = scopes.find((s) => s.exclusive);
	return exclusive ? [exclusive] : scopes;
});

/** Flat priority-ordered list of bindings whose `when` (if any) is satisfied. */
export const activeBindings = createMemo<KeyBinding[]>(() => {
	const out: KeyBinding[] = [];
	for (const scope of dispatchScopes()) {
		const bindings = scope.bindings?.() ?? [];
		for (const b of bindings) {
			if (b.when && !b.when()) continue;
			out.push(b);
		}
	}
	return out;
});

/**
 * Display-ready hints. Scopes are walked from high to low priority, so the
 * status bar naturally reads:
 *
 *   contextual/tab/editing hints ... panel hints ... global hints
 *
 * Because the status bar has a flex spacer before the hint pills, that means
 * more-specific hints sit farther left and global hints end up on the right.
 * Within a scope, `binding.order` can override the array order for hint
 * display only. The first occurrence of a given `k` wins, matching dispatch
 * shadowing.
 */
export const activeHints = createMemo<(KeyHint | "-")[]>(() => {
	const seen = new Set<string>();
	const out: (KeyHint | "-")[] = [];
	let i = 0;
	for (const scope of dispatchScopes()) {
		const bindings = orderedHintBindings(scope.bindings?.() ?? []);
		for (const b of bindings) {
			if (b.when && !b.when()) continue;
			if (!b.hint) continue;
			if (seen.has(b.hint.k)) continue;
			seen.add(b.hint.k);
			out.push(b.hint);
		}
		out.push("-");
	}
	return out.slice(0, -1);
});

function orderedHintBindings(bindings: KeyBinding[]): KeyBinding[] {
	return bindings
		.map((binding, index) => ({ binding, index }))
		.sort((a, b) => {
			const byOrder = (a.binding.order ?? a.index) - (b.binding.order ?? b.index);
			return byOrder || a.index - b.index;
		})
		.map(({ binding }) => binding);
}

/** Test/debug helper. */
export function _activeScopeIds(): string[] {
	return dispatchScopes().map((s) => s.id);
}
