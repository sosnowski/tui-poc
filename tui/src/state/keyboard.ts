// Global keyboard handler used by the App shell.
//
// The handler short-circuits when a modal is open — modals install their own
// useKeyboard subscriptions, and our local one would otherwise also fire
// (OpenTUI delivers the event to all subscribers). Modals call closeModal()
// from their own handler so we just ignore keys here while one is showing.

import { useKeyboard, useRenderer } from "@opentui/solid";
import type { KeyEvent } from "@opentui/core";

import { isEnterKey, isPlainKey } from "../keyboard/helpers";
import {
	activeRequest,
	activeRequestId,
	cyclePane,
	cycleTheme,
	editing,
	focusedPane,
	fireRequest,
	hasActiveRequest,
	modal,
	openModal,
	pushToast,
	setEditing,
	setFocusedPane,
	setMoveRequestId,
} from "./store";
import { THEMES } from "./themes";

/**
 * Tear the renderer down cleanly and exit.
 *
 * Important: never just `process.exit(0)` — OpenTUI puts the terminal into
 * the alternate screen and turns on mouse tracking; if we exit without
 * destroy() running, the parent shell is left receiving cursor-motion
 * sequences (`\x1b[<35;X;Y M`) which then leak as random "35;X;Y M" text
 * once the controlling app is gone. `renderer.destroy()` flushes the right
 * teardown sequences (DECRST 1000/1002/1003/1006, leave alt-screen, etc.)
 * and triggers our `onDestroy` callback (registered in index.tsx). We also
 * write a defensive restore sequence and defer process exit so the terminal
 * is not left in raw/alternate-screen mode if destroy() queues bytes.
 */
export function quit(renderer: ReturnType<typeof useRenderer>): void {
	try {
		renderer.destroy();
	} catch {
		// best-effort — fall through to exit even if destroy throws.
	}
	restoreTerminal();
	exitAfterFlush();
}

function restoreTerminal(): void {
	const stdin = process.stdin as typeof process.stdin & {
		setRawMode?: (mode: boolean) => void;
	};

	try {
		if (stdin.isTTY && stdin.setRawMode) stdin.setRawMode(false);
		stdin.pause();
	} catch {
		// Terminal restoration is best-effort; ANSI restore below still helps.
	}

	process.stdout.write(
		[
			"\x1b[0m", // reset attributes
			"\x1b[?25h", // show cursor
			"\x1b[?1000l",
			"\x1b[?1002l",
			"\x1b[?1003l",
			"\x1b[?1005l",
			"\x1b[?1006l",
			"\x1b[?1015l",
			"\x1b[?2004l", // bracketed paste off
			"\x1b[?1049l", // leave alternate screen
		].join(""),
	);
}

function exitAfterFlush(): void {
	process.stdout.write("", () => process.exit(0));
	setTimeout(() => process.exit(0), 20).unref?.();
}

export function useGlobalKeyboard(): void {
	const renderer = useRenderer();

	useKeyboard((e: KeyEvent) => {
		// While a modal is open, the modal's own useKeyboard handler will
		// process input. We bail to avoid double-handling.
		if (modal() !== null) return;

		if (e.name === "escape") return;

		// While the editor is in inline edit mode every key (including plain
		// letters like "h", "t", "q") is consumed as text input. Bailing here
		// lets `useEditorKeyboard` own the keystream until the user commits
		// (⏎) or cancels (Esc).
		if (editing() !== null) return;

		// ─── Top-level shortcuts ───
		if (isPlainKey(e, "q")) {
			// q quits the app (Ctrl+C also works via OpenTUI's exitOnCtrlC).
			quit(renderer);
		}
		if (isPlainKey(e, "n")) {
			if (focusedPane() === "collections") return;
			openModal("newMethod");
			return;
		}
		if (e.name === "/" || (e.ctrl && e.name === "k") || (e.meta && e.name === "k")) {
			openModal("command");
			return;
		}
		if (e.name === "e") return openModal("env");
		if (e.name === "h") return openModal("history");
		if (isPlainKey(e, "m")) {
			if (!hasActiveRequest()) return;
			return openModal("method");
		}
		if (e.name === "?") return openModal("command");
		if (e.name === "tab") {
			cyclePane(e.shift ? -1 : 1);
			return;
		}
		if (isEnterKey(e) && (e.ctrl || e.meta)) {
			if (!hasActiveRequest()) return;
			fireRequest();
			return;
		}
		// Theme cycling: `t` cycles theme.
		if (e.name === "t") {
			const next = cycleTheme();
			pushToast(`theme: ${THEMES[next].label}`, "ok");
			return;
		}
		if (isPlainKey(e, "x")) {
			if (!hasActiveRequest()) return;
			setMoveRequestId(activeRequestId());
			openModal("moveRequest");
			return;
		}
		if (isPlainKey(e, "u")) {
			if (!hasActiveRequest()) return;
			setFocusedPane("editor");
			setEditing({
				tab: "Url",
				row: 0,
				col: 0,
				draft: activeRequest().url,
				cursor: activeRequest().url.length,
				ignoreNextKey: "u",
			});
			queueMicrotask(() => {
				const current = editing();
				if (current?.tab === "Url" && current.ignoreNextKey === "u") {
					setEditing({ ...current, ignoreNextKey: undefined });
				}
			});
			return;
		}
	});
}
