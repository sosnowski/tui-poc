// ANSI-colored frame capture used to debug the actual visual output.
// Reads `captureSpans()` (RGBA + attributes per cell) and emits truecolor ANSI.

import { testRender } from "@opentui/solid";
import { App } from "../src/app";
import {
	closeModal,
	openModal,
	setAuthCursor,
	setBodyTypeCursor,
	setEditorTab,
	setHeadersCursor,
	setParamsCursor,
	setTheme,
	type EditorTab,
} from "../src/state/store";
import type { ThemeKey } from "../src/state/themes";
import type { CapturedFrame, CapturedSpan } from "@opentui/core";

const which = process.argv[2] ?? "main";
const themeArg = process.argv[3] as ThemeKey | undefined;
const cursorArg = process.argv[4];
if (themeArg) setTheme(themeArg);

const setup = await testRender(() => <App />, { width: 130, height: 40 });

if (which === "main") closeModal();
if (which === "command") {
	closeModal();
	openModal("command");
}
if (which === "env") {
	closeModal();
	openModal("env");
}
if (which === "history") {
	closeModal();
	openModal("history");
}
const EDITOR_TABS: EditorTab[] = ["Params", "Headers", "Body", "Auth", "Tests"];
if (EDITOR_TABS.includes(which as EditorTab)) {
	closeModal();
	setEditorTab(which as EditorTab);
	if (cursorArg) {
		const tab = which as EditorTab;
		if (tab === "Params") {
			const [r, c] = cursorArg.split(",").map(Number);
			setParamsCursor({ table: "query", row: r ?? 0, col: ((c ?? 0) as 0 | 1 | 2) });
		} else if (tab === "Headers") {
			const [r, c] = cursorArg.split(",").map(Number);
			setHeadersCursor({ row: r ?? 0, col: ((c ?? 0) as 0 | 1) });
		} else if (tab === "Body") {
			setBodyTypeCursor(Number(cursorArg) || 0);
		} else if (tab === "Auth") {
			const [r, c] = cursorArg.split(",").map(Number);
			setAuthCursor({ row: ((r ?? 0) as 0 | 1), typeIndex: c ?? 1 });
		}
	}
}

await setup.renderOnce();
const frame = setup.captureSpans();
process.stdout.write(toAnsi(frame));
process.exit(0);

function toAnsi(frame: CapturedFrame): string {
	const parts: string[] = [];
	for (const line of frame.lines) {
		for (const sp of line.spans) {
			parts.push(spanAnsi(sp));
		}
		parts.push("\x1b[0m\n");
	}
	return parts.join("");
}

function spanAnsi(sp: CapturedSpan): string {
	const fg = `\x1b[38;2;${(sp.fg.r * 255) | 0};${(sp.fg.g * 255) | 0};${(sp.fg.b * 255) | 0}m`;
	const bg = `\x1b[48;2;${(sp.bg.r * 255) | 0};${(sp.bg.g * 255) | 0};${(sp.bg.b * 255) | 0}m`;
	let attr = "";
	if (sp.attributes & 1) attr += "\x1b[1m"; // BOLD
	if (sp.attributes & 2) attr += "\x1b[2m"; // DIM
	if (sp.attributes & 4) attr += "\x1b[3m"; // ITALIC
	if (sp.attributes & 8) attr += "\x1b[4m"; // UNDERLINE
	return `\x1b[0m${fg}${bg}${attr}${sp.text}`;
}
