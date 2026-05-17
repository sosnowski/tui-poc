// Always-on bindings (lowest priority).
//
// Anything in here fires when no higher-priority scope claims the same key
// first. For example, "n" is claimed by the collections scope when the
// collections pane is focused; "n" here only fires when collections is not
// focused (and no exclusive overlay like edit mode is active).

import { useRenderer } from "@opentui/solid";

import { useKeyScope } from "../use-key-scope";
import type { KeyBinding } from "../types";
import { isPlainKey } from "../helpers";
import { quit } from "../../state/keyboard";
import {
	activeRequest,
	activeRequestId,
	cyclePane,
	cycleTheme,
	editing,
	fireRequest,
	hasActiveRequest,
	openModal,
	pushToast,
	setEditing,
	setFocusedPane,
	setMoveRequestId,
} from "../../state/store";
import { THEMES } from "../../state/themes";

export function useGlobalScope(): void {
	const renderer = useRenderer();

	useKeyScope({
		id: "global",
		priority: 0,
		active: () => true,
		bindings: (): KeyBinding[] => [
			{
				match: "q",
				run: () => quit(renderer),
			},
			{
				match: (e) => isPlainKey(e, "n"),
				run: () => openModal("newMethod"),
				hint: { k: "n", label: "new" },
				order: 10,
			},
			{
				match: "/",
				run: () => openModal("command"),
			},
			{
				match: (e) => (e.ctrl || e.meta) && e.name === "k",
				run: () => openModal("command"),
			},
			{
				match: "?",
				run: () => openModal("command"),
			},
			{
				match: "e",
				run: () => openModal("env"),
				hint: { k: "e", label: "env" },
				order: 20,
			},
			{
				match: "h",
				run: () => openModal("history"),
				hint: { k: "h", label: "hist" },
				order: 30,
			},
			{
				match: (e) => isPlainKey(e, "m"),
				run: () => openModal("method"),
				when: hasActiveRequest,
				hint: { k: "m", label: "method" },
				order: 40,
			},
			{
				match: "tab",
				run: (e) => cyclePane(e.shift ? -1 : 1),
				hint: { k: "tab", label: "pane" },
				order: 50,
			},
			{
				match: (e) => (e.ctrl || e.meta) && (e.name === "return" || e.name === "enter"),
				run: () => fireRequest(),
				when: hasActiveRequest,
				hint: { k: "⌘↵", label: "send" },
				order: 15,
			},
			{
				match: "t",
				run: () => {
					const next = cycleTheme();
					pushToast(`theme: ${THEMES[next].label}`, "ok");
				},
			},
			{
				match: (e) => isPlainKey(e, "x"),
				run: () => {
					setMoveRequestId(activeRequestId());
					openModal("moveRequest");
				},
				when: hasActiveRequest,
				hint: { k: "x", label: "move" },
				order: 5,
			},
			{
				match: (e) => isPlainKey(e, "u"),
				run: () => {
					setFocusedPane("editor");
					setEditing({
						tab: "Url",
						row: 0,
						col: 0,
						draft: activeRequest().url,
						cursor: activeRequest().url.length,
						ignoreNextKey: "u",
					});
					// Drop the ignore guard at the next tick if nothing else
					// consumed it — protects against terminals that don't send
					// a duplicate "u" after the input takes focus.
					queueMicrotask(() => {
						const current = editing();
						if (current?.tab === "Url" && current.ignoreNextKey === "u") {
							setEditing({ ...current, ignoreNextKey: undefined });
						}
					});
				},
				when: hasActiveRequest,
			},
		],
	});
}
