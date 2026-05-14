// Render a captureSpans frame to an SVG using a fixed-width font.
// Useful for sharing static visual previews of the TUI in chat / docs.

import { testRender } from "@opentui/solid";
import { App } from "../src/app";
import {
	closeModal,
	openModal,
	setEditorTab,
	setTheme,
	type EditorTab,
} from "../src/state/store";
import type { ThemeKey } from "../src/state/themes";
import type { CapturedFrame } from "@opentui/core";

const CELL_W = 9;
const CELL_H = 18;

const which = process.argv[2] ?? "main";
const themeArg = process.argv[3] as ThemeKey | undefined;
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
}

await setup.renderOnce();
const frame = setup.captureSpans();
process.stdout.write(toSvg(frame));
process.exit(0);

function rgba(c: { r: number; g: number; b: number; a: number }) {
	return `rgb(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0})`;
}

function escape(s: string) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toSvg(frame: CapturedFrame): string {
	const w = frame.cols * CELL_W;
	const h = frame.rows * CELL_H;

	const rects: string[] = [];
	const texts: string[] = [];

	let y = 0;
	for (const line of frame.lines) {
		let x = 0;
		for (const sp of line.spans) {
			const bgFill = rgba(sp.bg as any);
			rects.push(
				`<rect x="${x}" y="${y}" width="${sp.width * CELL_W}" height="${CELL_H}" fill="${bgFill}"/>`,
			);
			const fg = rgba(sp.fg as any);
			const bold = sp.attributes & 1;
			const italic = sp.attributes & 4;
			const underline = sp.attributes & 8;
			const fontWeight = bold ? "bold" : "normal";
			const fontStyle = italic ? "italic" : "normal";
			const decoration = underline ? "underline" : "none";
			texts.push(
				`<text x="${x}" y="${y + CELL_H - 4}" fill="${fg}" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${decoration}">${escape(sp.text)}</text>`,
			);
			x += sp.width * CELL_W;
		}
		y += CELL_H;
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="ui-monospace, Menlo, monospace" font-size="14">
${rects.join("\n")}
${texts.join("\n")}
</svg>`;
}
