import { Show, createEffect, createMemo, untrack } from "solid-js";
import { TextAttributes } from "@opentui/core";
import type { TextareaRenderable } from "@opentui/core";

import { useKeyScope } from "../../../keyboard/use-key-scope";
import {
	activeRequest,
	activeRequestId,
	bodyCursor,
	formatActiveBodyIfValidJson,
	getActivePresetName,
	setActiveBody,
	setBodyCursor,
	setBodyTypeCursor,
	theme,
} from "../../../state/store";
import { bodyTypeToOptionIndex } from "../../../data/body-type-options";
import { validateJsonText } from "../../../utils/json-body";
import {
	applyJsonSyntaxHighlights,
	createJsonSyntaxStyle,
} from "../../../utils/json-syntax";

function leaveJsonEditor(): void {
	formatActiveBodyIfValidJson();
	const r = activeRequest();
	setBodyCursor({ section: "type", row: 0, col: 0 });
	setBodyTypeCursor(bodyTypeToOptionIndex(r.bodyType));
}

export function JsonBody() {
	const r = activeRequest;
	const t = () => theme();
	const rowCursor = () => bodyCursor().section === "json";
	const focused = () => bodyCursor().section === "json";
	const editorKey = () => `${activeRequestId()}:${getActivePresetName(activeRequestId())}`;

	// Capture once at mount — reactive initialValue would reset the textarea on every body update.
	const initialBody = untrack(() => r().body ?? "");

	let textareaRef: TextareaRenderable | undefined;
	let suppressContentChange = false;

	const validation = createMemo(() => validateJsonText(r().body ?? ""));
	const jsonSyntaxStyle = createMemo(() => createJsonSyntaxStyle(theme()));

	const statusFg = () => {
		const v = validation();
		if (v.status === "valid") return t().ok;
		if (v.status === "invalid") return t().err;
		return t().textDim;
	};

	function refreshHighlights(): void {
		if (!textareaRef) return;
		applyJsonSyntaxHighlights(textareaRef, jsonSyntaxStyle());
	}

	function syncTextarea(text: string): void {
		if (!textareaRef || textareaRef.plainText === text) return;
		suppressContentChange = true;
		textareaRef.setText(text);
		suppressContentChange = false;
		refreshHighlights();
	}

	function assignTextarea(el: TextareaRenderable) {
		textareaRef = el;
		const body = untrack(() => r().body ?? "");
		syncTextarea(body);
		refreshHighlights();
	}

	useKeyScope({
		id: "editor.body.json",
		priority: 100,
		exclusive: true,
		active: focused,
		bindings: () => [
			{
				match: "escape",
				run: () => leaveJsonEditor(),
				hint: { k: "esc", label: "body type" },
			},
		],
	});

	let prevSection = bodyCursor().section;
	createEffect(() => {
		const section = bodyCursor().section;
		if (prevSection === "json" && section !== "json") {
			formatActiveBodyIfValidJson();
			syncTextarea(untrack(() => r().body ?? ""));
		}
		prevSection = section;
	});

	createEffect(() => {
		editorKey();
		syncTextarea(untrack(() => r().body ?? ""));
	});

	createEffect(() => {
		jsonSyntaxStyle();
		if (!textareaRef) return;
		refreshHighlights();
	});

	return (
		<box flexDirection="column" flexGrow={1} flexBasis={0} paddingTop={1}>
			<box
				flexDirection="row"
				flexShrink={0}
				height={1}
				backgroundColor={rowCursor() ? t().selBg : undefined}
			>
				<text fg={rowCursor() ? t().accent : t().textDim} width={2}>
					{rowCursor() ? "▶ " : "  "}
				</text>
				<text
					fg={rowCursor() ? t().selFg : t().textDim}
					width={11}
					attributes={TextAttributes.BOLD}
				>
					json
				</text>
				<text fg={statusFg()} attributes={rowCursor() ? TextAttributes.BOLD : 0}>
					{validation().message}
				</text>
				<Show when={rowCursor()}>
					<text fg={t().textDim}> · esc to leave</text>
				</Show>
			</box>

			<box
				flexDirection="column"
				flexGrow={1}
				flexBasis={0}
				borderStyle="single"
				borderColor={rowCursor() ? t().borderFocus : t().border2}
				paddingLeft={1}
				paddingRight={1}
				paddingTop={0}
				paddingBottom={0}
			>
				<textarea
					ref={assignTextarea}
					initialValue={initialBody}
					onContentChange={() => {
						if (suppressContentChange) return;
						const text = textareaRef?.plainText ?? "";
						const current = untrack(() => r().body ?? "");
						if (text !== current) {
							setActiveBody(text === "" ? null : text);
						}
						refreshHighlights();
					}}
					focused={focused()}
					flexGrow={1}
					flexBasis={0}
					wrapMode="word"
					tabIndicator={2}
					placeholder="Enter JSON..."
					backgroundColor={t().surface}
					textColor={t().text}
					focusedBackgroundColor={t().surface}
					focusedTextColor={t().text}
					cursorColor={t().accent}
					placeholderColor={t().textDim}
				/>
			</box>
		</box>
	);
}
