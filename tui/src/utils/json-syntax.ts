import { SyntaxStyle } from "@opentui/core";
import type { TextareaRenderable } from "@opentui/core";

import type { Theme } from "../state/themes";

const STYLE = {
	string: "json_string",
	number: "json_number",
	boolean: "json_boolean",
	null: "json_null",
	key: "json_key",
	punct: "json_punct",
} as const;

type TokenKind = (typeof STYLE)[keyof typeof STYLE];

type JsonToken = {
	start: number;
	end: number;
	kind: TokenKind;
};

/** Build a SyntaxStyle palette matching the response panel JSON colors. */
export function createJsonSyntaxStyle(theme: Theme): SyntaxStyle {
	return SyntaxStyle.fromStyles({
		[STYLE.string]: { fg: theme.str },
		[STYLE.number]: { fg: theme.num },
		[STYLE.boolean]: { fg: theme.bool },
		[STYLE.null]: { fg: theme.null },
		[STYLE.key]: { fg: theme.key },
		[STYLE.punct]: { fg: theme.punct },
	});
}

/** Tokenize JSON text for syntax highlighting (tolerates invalid/partial input). */
export function tokenizeJson(text: string): JsonToken[] {
	const tokens: JsonToken[] = [];
	let i = 0;

	while (i < text.length) {
		const ch = text[i]!;

		if (/\s/.test(ch)) {
			i++;
			continue;
		}

		if (ch === '"') {
			const start = i;
			i++;
			while (i < text.length) {
				if (text[i] === "\\") {
					i += 2;
					continue;
				}
				if (text[i] === '"') {
					i++;
					break;
				}
				i++;
			}
			let j = i;
			while (j < text.length && /\s/.test(text[j]!)) j++;
			const kind = j < text.length && text[j] === ":" ? STYLE.key : STYLE.string;
			tokens.push({ start, end: i, kind });
			continue;
		}

		if (ch === "-" || (ch >= "0" && ch <= "9")) {
			const start = i;
			if (ch === "-") i++;
			while (i < text.length && /[0-9.eE+-]/.test(text[i]!)) i++;
			tokens.push({ start, end: i, kind: STYLE.number });
			continue;
		}

		if (text.startsWith("true", i)) {
			tokens.push({ start: i, end: i + 4, kind: STYLE.boolean });
			i += 4;
			continue;
		}
		if (text.startsWith("false", i)) {
			tokens.push({ start: i, end: i + 5, kind: STYLE.boolean });
			i += 5;
			continue;
		}
		if (text.startsWith("null", i)) {
			tokens.push({ start: i, end: i + 4, kind: STYLE.null });
			i += 4;
			continue;
		}

		if ("{}[]:,".includes(ch)) {
			tokens.push({ start: i, end: i + 1, kind: STYLE.punct });
			i++;
			continue;
		}

		i++;
	}

	return tokens;
}

/** Read a logical line from the edit buffer, excluding line-ending characters. */
function lineTextAt(textarea: TextareaRenderable, lineIdx: number): string {
	const buffer = textarea.editBuffer;
	const lineCount = buffer.getLineCount();
	if (lineIdx >= lineCount) return "";

	const start = buffer.getLineStartOffset(lineIdx);
	const end =
		lineIdx + 1 < lineCount ? buffer.getLineStartOffset(lineIdx + 1) : buffer.getText().length;

	let line = buffer.getTextRange(start, end);
	if (line.endsWith("\r\n")) line = line.slice(0, -2);
	else if (line.endsWith("\n") || line.endsWith("\r")) line = line.slice(0, -1);
	return line;
}

export function applyJsonSyntaxHighlights(
	textarea: TextareaRenderable,
	syntaxStyle: SyntaxStyle,
): void {
	textarea.syntaxStyle = syntaxStyle;
	textarea.clearAllHighlights();

	// Highlight per line with column ranges — addHighlightByCharRange can drift from
	// the edit buffer's internal offsets (e.g. around newlines), mis-coloring tokens.
	const lineCount = textarea.lineCount;
	for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
		const line = lineTextAt(textarea, lineIdx);
		for (const token of tokenizeJson(line)) {
			const styleId = syntaxStyle.getStyleId(token.kind);
			if (styleId == null || token.start >= token.end) continue;
			textarea.addHighlight(lineIdx, {
				start: token.start,
				end: token.end,
				styleId,
				priority: 1,
			});
		}
	}
}
