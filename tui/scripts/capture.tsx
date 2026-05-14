// Headless renderer harness used to verify the layout in CI / dev.
// Renders the App into a 130x40 testing buffer, dumps the resulting
// character grid to stdout, and exits.

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

// Usage: capture.tsx <which> [theme] [cursor]
//   which   = main | command | env | history | Params | Headers | Body | Auth | Tests
//   theme   = opencode | catppuccin | matrix
//   cursor  = "row,col" or "i" (depends on tab) — sets the editor cursor
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
	if (cursorArg) applyCursor(which as EditorTab, cursorArg);
}

function applyCursor(tab: EditorTab, raw: string): void {
	if (tab === "Params") {
		const [r, c] = raw.split(",").map(Number);
		setParamsCursor({ table: "query", row: r ?? 0, col: ((c ?? 0) as 0 | 1 | 2) });
	} else if (tab === "Headers") {
		const [r, c] = raw.split(",").map(Number);
		setHeadersCursor({ row: r ?? 0, col: ((c ?? 0) as 0 | 1) });
	} else if (tab === "Body") {
		setBodyTypeCursor(Number(raw) || 0);
	} else if (tab === "Auth") {
		const [r, c] = raw.split(",").map(Number);
		setAuthCursor({ row: ((r ?? 0) as 0 | 1), typeIndex: c ?? 1 });
	}
}

await setup.renderOnce();
process.stdout.write(setup.captureCharFrame());
process.exit(0);
