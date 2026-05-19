// Spot-check that flipping the editor tab + cursor signals between renders
// actually moves the chevron / highlight in the captured frame. This guards
// against the OpenTUI <span style> bug where attributes accumulate without
// being cleared on subsequent style updates (worked around by Show-keying in
// `components/styled-span.tsx`).

import { testRender } from "@opentui/solid";
import { App } from "../src/app";
import {
	activeRequest,
	closeModal,
	editing,
	setBodyTypeCursor,
	setEditorTab,
	setFocusedPane,
	setHeadersCursor,
	setTheme,
	type EditorTab,
} from "../src/state/store";

setTheme("opencode");
setFocusedPane("editor");

const setup = await testRender(() => <App />, { width: 130, height: 40 });
closeModal();

// True when the given label appears with the BOLD attribute (bit 1) set on
// any of the *editor*-pane tab strip rows. We confine the search to the top
// half of the screen because the response pane below has tabs with the same
// label set ("Body" / "Headers" / "Tests") that would otherwise pollute the
// match.
function isLabelBoldInEditorTabs(label: string): boolean {
	const frame = setup.captureSpans();
	const limit = Math.floor(frame.lines.length / 2);
	for (let i = 0; i < limit; i++) {
		const line = frame.lines[i]!;
		for (const sp of line.spans) {
			if (sp.text === label && (sp.attributes & 1) !== 0) return true;
		}
	}
	return false;
}

interface Check {
	label: string;
	mutate: () => void;
	mustContain: string[];
	mustNotContain?: string[];
}

const checks: Check[] = [
	{
		label: "Headers tab — cursor on row 0 (Accept)",
		mutate: () => {
			setEditorTab("Headers");
			setHeadersCursor({ row: 0, col: 0 });
		},
		mustContain: ["▶ [×] Accept"],
		mustNotContain: ["▶ [×] Authorization", "▶ [×] X-Request-Id", "▶ [ ] + key"],
	},
	{
		label: "Headers tab — cursor moved to row 2 (X-Request-Id)",
		mutate: () => {
			setHeadersCursor({ row: 2, col: 0 });
		},
		mustContain: ["▶ [×] X-Request-Id"],
		mustNotContain: ["▶ [×] Accept", "▶ [×] Authorization"],
	},
	{
		label: "Headers tab — cursor on add row",
		mutate: () => {
			setHeadersCursor({ row: 3, col: 0 });
		},
		mustContain: ["▶ [ ] + key"],
		mustNotContain: ["▶ [×] Accept", "▶ [×] Authorization", "▶ [×] X-Request-Id"],
	},
	{
		label: "Switched to Body tab — cursor at index 0 (none)",
		mutate: () => {
			setEditorTab("Body");
			setBodyTypeCursor(0);
		},
		mustContain: ["▶ body type"],
	},
	{
		label: "Body tab — moved cursor to index 3 (raw / json)",
		mutate: () => {
			setBodyTypeCursor(3);
		},
		mustContain: ["▶ body type"],
	},
];

let failed = 0;
for (const c of checks) {
	c.mutate();
	await setup.renderOnce();
	const frame = setup.captureCharFrame();
	const ok = c.mustContain.every((s) => frame.includes(s));
	const noBad = (c.mustNotContain ?? []).every((s) => !frame.includes(s));
	if (ok && noBad) {
		console.log(`  PASS  ${c.label}`);
	} else {
		failed++;
		console.log(`  FAIL  ${c.label}`);
		for (const s of c.mustContain) {
			if (!frame.includes(s)) console.log(`        missing: ${JSON.stringify(s)}`);
		}
		for (const s of c.mustNotContain ?? []) {
			if (frame.includes(s)) console.log(`        leftover: ${JSON.stringify(s)}`);
		}
	}
}

// Tab-strip reactivity: only the currently active tab should be bold. After
// switching from one tab to another, the previous tab's bold attribute must
// have been cleared (this used to fail because of the OpenTUI |= attributes
// bug — see styled-span.tsx for the workaround).

const TAB_LABELS: EditorTab[] = ["Params", "Headers", "Body", "Auth", "Tests"];
for (const target of TAB_LABELS) {
	setEditorTab(target);
	await setup.renderOnce();
	const activeBold = isLabelBoldInEditorTabs(target);
	const otherBold = TAB_LABELS.filter((l) => l !== target).filter((l) =>
		isLabelBoldInEditorTabs(l),
	);
	if (activeBold && otherBold.length === 0) {
		console.log(`  PASS  Tab strip — only "${target}" is bold after switch`);
	} else {
		failed++;
		console.log(`  FAIL  Tab strip — switching to "${target}"`);
		if (!activeBold) console.log(`        target "${target}" is NOT bold`);
		if (otherBold.length) console.log(`        leftover bold on: ${otherBold.join(", ")}`);
	}
}

// ─── Edit-mode end-to-end ────────────────────────────────────────────────────
//
// Drives the actual keyboard handler through `mockInput.pressKey/typeText` so
// SPACE/⏎/printable/backspace/Esc all flow through `useEditorKeyboard`. We
// exercise the Headers tab (which has 3 rows: Accept, Authorization,
// X-Request-Id) and verify both the underlying state and what hits the screen.

setEditorTab("Headers");
setHeadersCursor({ row: 0, col: 0 });
await setup.renderOnce();

function hasFrame(s: string): boolean {
	return setup.captureCharFrame().includes(s);
}

// Returns the captured span (color + attributes) for the given character on
// the given line, or null if the line / column is empty. Used to verify the
// column-cursor chip really paints its accent background.
function spanAt(lineIdx: number, col: number) {
	const frame = setup.captureSpans();
	const line = frame.lines[lineIdx];
	if (!line) return null;
	let x = 0;
	for (const sp of line.spans) {
		if (col >= x && col < x + sp.text.length) return sp;
		x += sp.text.length;
	}
	return null;
}

// Find the line that contains the cursor chevron `▶` for the focused row, so
// chip-presence checks don't have to hard-code line numbers.
function findCursorLine(label: string): number {
	const frame = setup.captureSpans();
	for (let i = 0; i < frame.lines.length; i++) {
		const text = frame.lines[i]!.spans.map((s) => s.text).join("");
		if (text.includes("▶") && text.includes(label)) return i;
	}
	return -1;
}

function reportEditCheck(label: string, ok: boolean, hints: string[] = []): void {
	if (ok) {
		console.log(`  PASS  ${label}`);
	} else {
		failed++;
		console.log(`  FAIL  ${label}`);
		for (const h of hints) console.log(`        ${h}`);
	}
}

// Verify the column cursor renders as a chip with a non-default background.
// Sample the span on top of the "Accept" text (chip cell) and compare its bg
// to a span deep in the value column ("application/json", which is NOT under
// the chip). The chip bg must differ from the surrounding row bg.
{
	const lineIdx = findCursorLine("Accept");
	const lineText =
		lineIdx >= 0 ? setup.captureSpans().lines[lineIdx]!.spans.map((s) => s.text).join("") : "";
	const aCol = lineText.indexOf("Accept");
	const vCol = lineText.indexOf("application/json");
	const colSpan = spanAt(lineIdx, aCol);
	const valSpan = spanAt(lineIdx, vCol);
	const chipBgDiffersFromRowBg =
		colSpan !== null &&
		valSpan !== null &&
		(colSpan.bg.r !== valSpan.bg.r ||
			colSpan.bg.g !== valSpan.bg.g ||
			colSpan.bg.b !== valSpan.bg.b);
	const chipIsBold = colSpan !== null && (colSpan.attributes & 1) !== 0;
	reportEditCheck(
		"Headers — column cursor on key paints a distinct chip bg + bold",
		chipBgDiffersFromRowBg && chipIsBold,
		[
			`chipSpan.bg=${JSON.stringify(colSpan?.bg)}`,
			`valSpan.bg=${JSON.stringify(valSpan?.bg)}`,
			`chipBold=${chipIsBold}`,
		],
	);
}

// And after moving the cursor to col 1, the value column should now hold the
// chip while the key column reverts to row-bg.
setHeadersCursor({ row: 0, col: 1 });
await setup.renderOnce();
{
	const lineIdx = findCursorLine("Accept");
	const text = lineIdx >= 0 ? setup.captureSpans().lines[lineIdx]!.spans.map((s) => s.text).join("") : "";
	const valCol = text.indexOf("application/json");
	const keyCol = text.indexOf("Accept");
	const valSpan = spanAt(lineIdx, valCol);
	const keySpan = spanAt(lineIdx, keyCol);
	const valIsChip = valSpan !== null && (valSpan.attributes & 1) !== 0;
	const keyIsNotChip = keySpan !== null && (keySpan.attributes & 1) === 0;
	reportEditCheck(
		"Headers — moving cursor to col 1 shifts the chip to the value column",
		valIsChip && keyIsNotChip,
		[`valBold=${valIsChip}`, `keyBold=${!keyIsNotChip ? "still bold" : "ok"}`],
	);

	// The cell directly LEFT of the chip must not paint the cursor row's
	// `selBg`, otherwise its dark tint reads as a horizontal "shoulder"
	// next to the bright orange chip and makes the chip look offset from
	// its column header above. See `kv-table.tsx` `rowTint()`.
	const keyBg = keySpan?.bg;
	const valBg = valSpan?.bg;
	const keyBgEqValBg =
		keyBg !== undefined &&
		valBg !== undefined &&
		(keyBg.r !== valBg.r || keyBg.g !== valBg.g || keyBg.b !== valBg.b);
	// We *want* keyBg to differ from valBg (chip), but we also want it NOT
	// to be selBg. The easiest way: it should match the line's leading
	// pane bg span (very first span of the line, which is always pane bg).
	const paneSpan = setup.captureSpans().lines[lineIdx]!.spans[0]!;
	const keyOnPaneBg =
		keyBg !== undefined &&
		keyBg.r === paneSpan.bg.r &&
		keyBg.g === paneSpan.bg.g &&
		keyBg.b === paneSpan.bg.b;
	reportEditCheck(
		"Headers — cell left of the chip drops selBg (no shoulder next to chip)",
		keyBgEqValBg && keyOnPaneBg,
		[
			`keyBg=${JSON.stringify(keyBg)}`,
			`valBg=${JSON.stringify(valBg)}`,
			`paneBg=${JSON.stringify(paneSpan.bg)}`,
		],
	);
}
// Move back to col 0 for the rest of the edit-mode test.
setHeadersCursor({ row: 0, col: 0 });
await setup.renderOnce();

// SPACE — toggle Accept off (row 0).
await setup.mockInput.pressKey(" ");
await setup.renderOnce();
reportEditCheck(
	'Headers — SPACE toggles row 0 (Accept) to "[ ]"',
	activeRequest().headers[0]!.enabled === false && hasFrame("▶ [ ] Accept"),
	[`enabled=${activeRequest().headers[0]!.enabled}`],
);

// SPACE again — toggle Accept back on.
await setup.mockInput.pressKey(" ");
await setup.renderOnce();
reportEditCheck(
	"Headers — SPACE again toggles Accept back on",
	activeRequest().headers[0]!.enabled !== false && hasFrame("▶ [×] Accept"),
);

// → moves cursor to value column. ⏎ enters edit mode, prefilling with current value.
await setup.mockInput.pressArrow("right");
await setup.renderOnce();
await setup.mockInput.pressEnter();
await setup.renderOnce();
const ed1 = editing();
reportEditCheck(
	"Headers — ⏎ on (row 0, col 1) starts edit with prefilled draft",
	ed1 !== null &&
		ed1.tab === "Headers" &&
		ed1.row === 0 &&
		ed1.col === 1 &&
		ed1.draft === activeRequest().headers[0]!.value,
	[`editing=${JSON.stringify(ed1)}`],
);

// OpenTUI input renders the current value in-place while the edit-mode state
// tracks which cell owns focus.
reportEditCheck(
	"Headers — edit mode renders focused input value in cell",
	editing() !== null && hasFrame("application/json"),
);

// Type a few characters and verify the OpenTUI input updates on-screen. The
// input owns its edit buffer now; our state only tracks which cell is editing.
await setup.mockInput.typeText("XX");
await setup.renderOnce();
reportEditCheck(
	"Headers — typing appends inside the input",
	editing() !== null && hasFrame("application/jsonXX"),
);

// Backspace removes last char.
await setup.mockInput.pressBackspace();
await setup.renderOnce();
reportEditCheck(
	"Headers — backspace updates the input buffer",
	editing() !== null && hasFrame("application/jsonX") && !hasFrame("application/jsonXX"),
);

// ⏎ commits and exits edit mode; the row value should now end with "X".
await setup.mockInput.pressEnter();
await setup.renderOnce();
const committedValue = activeRequest().headers[0]!.value;
reportEditCheck(
	"Headers — ⏎ commits draft into row value and exits edit mode",
	editing() === null && committedValue.endsWith("X"),
	[`value=${JSON.stringify(committedValue)}`, `editing=${JSON.stringify(editing())}`],
);

// Restart edit, type garbage, then ESC — original value must be preserved.
await setup.mockInput.pressEnter();
await setup.renderOnce();
await setup.mockInput.typeText("zzz");
await setup.renderOnce();
await setup.mockInput.pressEscape();
// OpenTUI's stdin parser holds a bare \x1b in a disambiguation timer (waiting
// to see if it's the start of a CSI sequence). We sleep past that timer so
// the lone ESC actually emits as a key event before the next renderOnce.
await new Promise((r) => setTimeout(r, 100));
await setup.renderOnce();
const afterEsc = activeRequest().headers[0]!.value;
reportEditCheck(
	"Headers — Esc cancels edit, leaves committed value intact",
	editing() === null && afterEsc === committedValue,
	[`value=${JSON.stringify(afterEsc)}`, `expected=${JSON.stringify(committedValue)}`],
);

// ─── Autocomplete tests ────────────────────────────────────────────────────

setEditorTab("Headers");
setHeadersCursor({ row: 3, col: 0 }); // add row
await setup.renderOnce();
await setup.mockInput.pressEnter();
await setup.renderOnce();

// Type fuzzy query for Content-Type
await setup.mockInput.typeText("ct");
await setup.renderOnce();

reportEditCheck(
	"Headers autocomplete — typing shows Content-Type suggestion",
	editing() !== null && hasFrame("Content-Type"),
);

// Select with down+enter
await setup.mockInput.pressArrow("down");
await setup.renderOnce();
await setup.mockInput.pressEnter();
await setup.renderOnce();

reportEditCheck(
	"Headers autocomplete — down+enter selects highlighted suggestion",
	editing() === null && activeRequest().headers.length === 4 && activeRequest().headers[3]!.key === "Content-Type",
	[
		`key=${JSON.stringify(activeRequest().headers[3]?.key)}`,
		`headers.length=${activeRequest().headers.length}`,
	],
);

// Test custom value without selection on a fresh row
setHeadersCursor({ row: 4, col: 0 }); // add row again
await setup.renderOnce();
await setup.mockInput.pressEnter();
await setup.renderOnce();

await setup.mockInput.typeText("X-Custom-Thing");
await setup.renderOnce();
await setup.mockInput.pressEnter();
await setup.renderOnce();

reportEditCheck(
	"Headers autocomplete — enter commits custom value without selection",
	editing() === null && activeRequest().headers.length === 5 && activeRequest().headers[4]!.key === "X-Custom-Thing",
	[
		`key=${JSON.stringify(activeRequest().headers[4]?.key)}`,
		`headers.length=${activeRequest().headers.length}`,
	],
);

console.log(failed === 0 ? "\nall reactivity checks passed" : `\n${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
