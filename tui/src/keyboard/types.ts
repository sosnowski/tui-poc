// Keyboard registry types.
//
// A KeyBinding bundles three concerns into one value:
//   1. how to recognise the key (`match`)
//   2. what to do when it fires (`run`)
//   3. how to display it in the global hint strip (`hint`)
//
// Bindings live inside KeyScopes. A scope is a reactive bag of bindings with
// an `active()` predicate and a numeric priority. The registry walks active
// scopes from highest to lowest priority and dispatches the first binding
// whose `match` matches the incoming KeyEvent.

import type { KeyEvent } from "@opentui/core";

export interface KeyHint {
	k: string;
	label: string;
}

export type KeyMatcher = string | ((e: KeyEvent) => boolean);

export interface KeyBinding {
	/** Either a "ctrl+enter"-style spec or a custom predicate over KeyEvent. */
	match: KeyMatcher;
	/**
	 * Handler. Returning `false` explicitly marks the event as not-handled and
	 * the dispatcher continues looking for another match. Any other return
	 * value (including `undefined`) means "handled, stop dispatching".
	 */
	run: (e: KeyEvent) => void | boolean;
	/** Optional reactive sub-condition. Skipped when it returns false. */
	when?: () => boolean;
	/** Optional hint shown in the global hint strip while this binding is active. */
	hint?: KeyHint;
	/**
	 * Optional status-bar ordering within this binding's scope. Lower numbers
	 * render farther left. If omitted, the binding keeps its array order.
	 *
	 * This affects hint display only; keyboard dispatch still uses the original
	 * binding array order so changing the status bar cannot accidentally change
	 * behavior.
	 */
	order?: number;
}

export interface KeyScope {
	/** Stable id, primarily for debugging / inspection. */
	id: string;
	/**
	 * Higher numbers are dispatched first and shadow lower-priority scopes for
	 * the same key. Suggested layering:
	 *   0  global (always-on)
	 *   10 panel-level (collections / editor / response / etc.)
	 *   20 sub-panel (specific tab inside the editor)
	 *   30 sub-sub (e.g. a specific row state)
	 *   50 transient panel state (presets sidebar)
	 *   100 exclusive overlays (inline edit mode)
	 */
	priority: number;
	/** Reactive predicate. The scope only contributes when this returns true. */
	active: () => boolean;
	/**
	 * When true, only this scope's bindings dispatch and only its hints are
	 * displayed. Used by inline edit mode so e.g. plain "q" doesn't quit the
	 * app while typing into a header value.
	 */
	exclusive?: boolean;
	/** Reactive list of bindings. Re-evaluated every dispatch / hint computation. */
	bindings?: () => KeyBinding[];
}
