import { createSignal } from "solid-js";

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

export type AuthCursor = { row: 0 | 1; typeIndex: number };

const [authCursor, setAuthCursorSig] = createSignal<AuthCursor>({ row: 0, typeIndex: 1 });
export { authCursor };

export function setAuthCursor(c: AuthCursor): void {
	setAuthCursorSig(c);
}

export type EditingCell = {
	tab: "Params" | "PathParams" | "Headers" | "Url" | "Name";
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
