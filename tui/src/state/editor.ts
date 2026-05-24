import { createEffect, createSignal } from "solid-js";

import { setFocusedPane } from "./app";
import {
	activeRequestId,
	activeRequestPresetNames,
	getActivePresetName,
	setActiveRequestId,
} from "./requests";

export type EditorTab = "Params" | "Headers" | "Body" | "Auth" | "Tests";

const [editorTab, setEditorTabSig] = createSignal<EditorTab>("Params");
export { editorTab };

export function setEditorTab(t: EditorTab): void {
	setEditorTabSig(t);
}

export type ParamsCursor = { table: "query" | "path"; row: number; col: 0 | 1 | 2 };

const [paramsCursor, setParamsCursorSig] = createSignal<ParamsCursor>({
	table: "path",
	row: 0,
	col: 0,
});
export { paramsCursor };

export function setParamsCursor(c: ParamsCursor): void {
	setParamsCursorSig(c);
}

export type HeadersCursor = { row: number; col: 0 | 1 };

const [headersCursor, setHeadersCursorSig] = createSignal<HeadersCursor>({ row: 0, col: 0 });
export { headersCursor };

export function setHeadersCursor(c: HeadersCursor): void {
	setHeadersCursorSig(c);
}

const [bodyTypeCursor, setBodyTypeCursorSig] = createSignal<number>(0);
export { bodyTypeCursor };

export function setBodyTypeCursor(i: number): void {
	setBodyTypeCursorSig(i);
}

export type BodyCursor = {
	section: "type" | "form" | "binary" | "json";
	row: number;
	col: 0 | 1 | 2;
};

const [bodyCursor, setBodyCursorSig] = createSignal<BodyCursor>({
	section: "type",
	row: 0,
	col: 0,
});
export { bodyCursor };

export function setBodyCursor(c: BodyCursor): void {
	setBodyCursorSig(c);
}

export type AuthCursor = { row: 0 | 1; typeIndex: number };

const [authCursor, setAuthCursorSig] = createSignal<AuthCursor>({ row: 0, typeIndex: 1 });
export { authCursor };

export function setAuthCursor(c: AuthCursor): void {
	setAuthCursorSig(c);
}

export type EditingCell = {
	tab: "Params" | "PathParams" | "Headers" | "Body" | "Url" | "Name";
	row: number;
	col: 0 | 1 | 2;
	draft: string;
	cursor: number;
	ignoreNextKey?: string;
} | null;

const [editing, setEditingSig] = createSignal<EditingCell>(null);
export { editing };

export function setEditing(e: EditingCell): void {
	setEditingSig(e);
}

export type ResponseTab = "Body" | "Headers" | "Cookies" | "Tests" | "Timeline";

const [responseTab, setResponseTabSig] = createSignal<ResponseTab>("Body");
export { responseTab };

export function setResponseTab(t: ResponseTab): void {
	setResponseTabSig(t);
}

const [presetsExpanded, setPresetsExpandedSig] = createSignal(false);
export { presetsExpanded };

export function setPresetsExpanded(v: boolean): void {
	setPresetsExpandedSig(v);
}

const [presetsCursor, setPresetsCursorSig] = createSignal(0);
export { presetsCursor };

export function setPresetsCursor(i: number): void {
	setPresetsCursorSig(i);
}

function syncPresetsPanelForActiveRequest(): void {
	const id = activeRequestId();
	if (!id) {
		setPresetsExpanded(false);
		return;
	}

	const names = activeRequestPresetNames();
	const expanded = names.length > 1;
	setPresetsExpanded(expanded);
	if (expanded) {
		const idx = names.indexOf(getActivePresetName(id));
		setPresetsCursor(Math.max(0, idx));
	}
}

/** Keep presets expanded when the active request has multiple presets. */
export function useSyncPresetsPanel(): void {
	createEffect(() => {
		activeRequestId();
		activeRequestPresetNames();
		syncPresetsPanelForActiveRequest();
	});
}

/** Select a request and move focus to the editor. */
export function openRequestInEditor(requestId: string): void {
	setActiveRequestId(requestId);
	setFocusedPane("editor");
}
