// Editor-pane scopes.
//
// Layout:
//   editor              base editor bindings (priority 10)
//   editor.params       params tab (priority 20)
//   editor.headers      headers tab (priority 20)
//   editor.body         body tab (priority 20)
//   editor.body.json    json body editor — EXCLUSIVE (priority 100)
//   editor.auth         auth tab (priority 20)
//   editor.presets      presets sidebar overlay (priority 50)
//   editor.editing      inline edit mode — EXCLUSIVE (priority 100)
//
// Each `useXxxScope()` is called from the component that owns the relevant
// surface, so the scope's lifetime tracks the component's mount/unmount and
// the dispatcher / hint strip update automatically as the user navigates.

import { clamp, isPlainKey, printableChar } from "../helpers";
import { useKeyScope } from "../use-key-scope";
import type { KeyBinding } from "../types";
import {
	BODY_TYPE_COUNT,
	bodyTypeFromOptionIndex,
	bodyTypeToOptionIndex,
} from "../../data/body-type-options";
import {
	activeRequest,
	activeRequestId,
	activeRequestName,
	activeRequestPresetNames,
	addFormUrlEncoded,
	addFormData,
	addHeader,
	addQueryParam,
	authCursor,
	bodyCursor,
	bodyTypeCursor,
	cancelEditing,
	clearBinaryFile,
	deleteFormUrlEncoded,
	deleteFormData,
	deleteHeader,
	deleteQueryParam,
	editing,
	editorTab,
	focusedPane,
	getActivePresetName,
	hasActiveRequest,
	headersCursor,
	openAttachFileModal,
	openModal,
	paramsCursor,
	presetsCursor,
	presetsExpanded,
	setActiveBodyType,
	setActivePresetForRequest,
	setAuthCursor,
	setBodyCursor,
	setBodyTypeCursor,
	setEditing,
	setEditorTab,
	setFocusedPane,
	setHeadersCursor,
	setParamsCursor,
	setPresetsCursor,
	setPresetsExpanded,
	toggleFormUrlEncoded,
	toggleFormData,
	toggleFormDataValueType,
	toggleHeader,
	toggleParam,
	togglePathParam,
} from "../../state/store";
const AUTH_TYPE_COUNT = 5;

const editorActive = () => focusedPane() === "editor" && editing() === null;

// ─── editor base ─────────────────────────────────────────────────────────────

export function useEditorScope(): void {
	useKeyScope({
		id: "editor",
		priority: 10,
		active: editorActive,
		bindings: (): KeyBinding[] => [
			// One representative hint covers all five tab-nav bindings; the
			// remaining bindings carry no hint so the strip stays compact.
			{ match: "1", run: () => setEditorTab("Params"), hint: { k: "1-5", label: "tab" } },
			{ match: "2", run: () => setEditorTab("Headers") },
			{ match: "3", run: () => setEditorTab("Body") },
			{ match: "4", run: () => setEditorTab("Auth") },
			{ match: "5", run: () => setEditorTab("Tests") },
			{
				match: (e) => isPlainKey(e, "r"),
				run: () => startEditingRequestName(),
				when: hasActiveRequest,
				hint: { k: "r", label: "rename" },
			},
			{
				match: (e) => e.ctrl && e.name === "p",
				run: () => openModal("newPreset"),
				when: hasActiveRequest,
				hint: presetsExpanded() ? { k: "ctrl+p", label: "new preset" } : undefined,
			},
			{
				match: (e) => isPlainKey(e, "p") || (e.shift && e.name === "p" && !e.ctrl && !e.meta),
				run: (e) => {
					if (presetsExpanded()) {
						const names = activeRequestPresetNames();
						if (names.length === 0) return;
						const direction = printableChar(e) === "P" ? -1 : 1;
						const next = (presetsCursor() + direction + names.length) % names.length;
						setPresetsCursor(next);
						setActivePresetForRequest(activeRequestId(), names[next]!);
						return;
					}
					const names = activeRequestPresetNames();
					const idx = names.indexOf(getActivePresetName(activeRequestId()));
					setPresetsExpanded(true);
					setPresetsCursor(Math.max(0, idx));
				},
				when: () => hasActiveRequest() && !presetsExpanded(),
				hint: { k: "p", label: "preset" },
			},
			{
				// Same handler when presets ARE expanded — declared separately so
				// the hint label can change.
				match: (e) => isPlainKey(e, "p") || (e.shift && e.name === "p" && !e.ctrl && !e.meta),
				run: (e) => {
					const names = activeRequestPresetNames();
					if (names.length === 0) return;
					const direction = printableChar(e) === "P" ? -1 : 1;
					const next = (presetsCursor() + direction + names.length) % names.length;
					setPresetsCursor(next);
					setActivePresetForRequest(activeRequestId(), names[next]!);
				},
				when: () => hasActiveRequest() && presetsExpanded(),
				hint: { k: "p", label: "next" },
			},
			{
				match: "escape",
				run: () => setFocusedPane("collections"),
				when: () => !presetsExpanded(),
				hint: { k: "esc", label: "back" },
			},
		],
	});
}

// ─── editor.editing (exclusive) ──────────────────────────────────────────────

export function useEditorEditingScope(): void {
	useKeyScope({
		id: "editor.editing",
		priority: 100,
		exclusive: true,
		active: () => editing() !== null,
		bindings: (): KeyBinding[] => [
			{
				// Some entry points stuff `ignoreNextKey` so the trigger key
				// doesn't bleed into the input. Match anything and silently
				// swallow on hit.
				match: (e) => editing()?.ignoreNextKey === e.name,
				run: () => {
					const current = editing();
					if (!current) return;
					setEditing({ ...current, ignoreNextKey: undefined });
				},
			},
			{
				match: "escape",
				run: () => cancelEditing(),
				hint: { k: "esc", label: "cancel" },
			},
			{
				// Display-only — the `<input>` element captures Enter via
				// on:enter. We return false so the dispatcher keeps walking
				// (and ultimately doesn't preventDefault), letting the input
				// own the keystroke.
				match: (e) => e.name === "return" || e.name === "enter",
				run: () => false,
				hint: { k: "↵", label: "save" },
			},
		],
	});
}

// ─── editor.presets (overlay, non-exclusive) ─────────────────────────────────

export function useEditorPresetsScope(): void {
	useKeyScope({
		id: "editor.presets",
		priority: 50,
		active: () => focusedPane() === "editor" && presetsExpanded() && editing() === null,
		bindings: (): KeyBinding[] => [
			{
				match: "escape",
				run: () => setPresetsExpanded(false),
				hint: { k: "esc", label: "close" },
			},
			{
				match: (e) => (e.name === "return" || e.name === "enter") && !e.ctrl && !e.meta,
				run: () => setPresetsExpanded(false),
				hint: { k: "↵", label: "select" },
			},
		],
	});
}

// ─── editor.params ───────────────────────────────────────────────────────────

export function useEditorParamsScope(): void {
	useKeyScope({
		id: "editor.params",
		priority: 20,
		active: editorActive,
		bindings: (): KeyBinding[] => {
			const r = activeRequest();
			const paramsRowCount = r.params.length + 1;
			const pathParamsRowCount = r.pathParams.length;

			return [
				{
					match: "down",
					run: () => {
						const c = paramsCursor();
						setParamsCursor(moveParamsCursor(c, 1, paramsRowCount, pathParamsRowCount));
					},
					hint: { k: "↑↓←→↵", label: "nav" },
				},
				{
					match: "up",
					run: () => {
						const c = paramsCursor();
						setParamsCursor(moveParamsCursor(c, -1, paramsRowCount, pathParamsRowCount));
					},
				},
				{
					match: "right",
					run: () => {
						const c = paramsCursor();
						setParamsCursor({ ...c, col: clamp(c.col + 1, 0, 2) as 0 | 1 | 2 });
					},
				},
				{
					match: "left",
					run: () => {
						const c = paramsCursor();
						setParamsCursor({ ...c, col: clamp(c.col - 1, 0, 2) as 0 | 1 | 2 });
					},
				},
				{
					match: (e) => (e.name === "return" || e.name === "enter") && !e.ctrl && !e.meta,
					run: () => {
						if (!startEditingHighlightedCell()) return false;
					},
				},
				{
					match: (e) => e.name === "space" || e.sequence === " ",
					run: () => {
						if (!toggleHighlightedRow()) return false;
					},
					hint: { k: "space", label: "toggle" },
				},
				{
					match: (e) => e.ctrl && e.name === "d",
					run: () => {
						if (!deleteHighlightedRow()) return false;
					},
					hint: { k: "ctrl+d", label: "del row" },
				},
			];
		},
	});
}

// ─── editor.headers ──────────────────────────────────────────────────────────

export function useEditorHeadersScope(): void {
	useKeyScope({
		id: "editor.headers",
		priority: 20,
		active: editorActive,
		bindings: (): KeyBinding[] => {
			const r = activeRequest();
			const headersRowCount = r.headers.length + 1;

			return [
				{
					match: "down",
					run: () => {
						const c = headersCursor();
						setHeadersCursor({ ...c, row: clamp(c.row + 1, 0, headersRowCount - 1) });
					},
					hint: { k: "↑↓←→↵", label: "nav" },
				},
				{
					match: "up",
					run: () => {
						const c = headersCursor();
						setHeadersCursor({ ...c, row: clamp(c.row - 1, 0, headersRowCount - 1) });
					},
				},
				{
					match: "right",
					run: () => {
						const c = headersCursor();
						setHeadersCursor({ ...c, col: clamp(c.col + 1, 0, 1) as 0 | 1 });
					},
				},
				{
					match: "left",
					run: () => {
						const c = headersCursor();
						setHeadersCursor({ ...c, col: clamp(c.col - 1, 0, 1) as 0 | 1 });
					},
				},
				{
					match: (e) => (e.name === "return" || e.name === "enter") && !e.ctrl && !e.meta,
					run: () => {
						if (!startEditingHighlightedCell()) return false;
					},
				},
				{
					match: (e) => e.name === "space" || e.sequence === " ",
					run: () => {
						if (!toggleHighlightedRow()) return false;
					},
					hint: { k: "space", label: "toggle" },
				},
				{
					match: (e) => e.ctrl && e.name === "d",
					run: () => {
						if (!deleteHighlightedRow()) return false;
					},
					hint: { k: "ctrl+d", label: "del row" },
				},
			];
		},
	});
}

// ─── editor.body ─────────────────────────────────────────────────────────────

export function useEditorBodyScope(): void {
	useKeyScope({
		id: "editor.body",
		priority: 20,
		active: editorActive,
		bindings: (): KeyBinding[] => {
			const r = activeRequest();
			const showFormUrlTable = r.bodyType === "form-urlencoded";
			const showFormDataTable = r.bodyType === "form";
			const showFormTable = showFormUrlTable || showFormDataTable;
			const formRowCount =
				(showFormUrlTable ? r.formUrlEncoded.length : r.formData.length) + 1;
			const maxFormCol = showFormDataTable ? 2 : 1;
			const showBinaryPanel = r.bodyType === "binary";
			const showJsonPanel = r.bodyType === "json";

			return [
				{
					match: "down",
					run: () => {
						const c = bodyCursor();
						if (c.section === "type") {
							if (showFormTable) {
								setBodyCursor({ section: "form", row: 0, col: 0 });
								setBodyTypeCursor(bodyTypeToOptionIndex(r.bodyType));
								return;
							}
							if (showBinaryPanel) {
								setBodyCursor({ section: "binary", row: 0, col: 0 });
								setBodyTypeCursor(bodyTypeToOptionIndex(r.bodyType));
								return;
							}
							if (showJsonPanel) {
								setBodyCursor({ section: "json", row: 0, col: 0 });
								setBodyTypeCursor(bodyTypeToOptionIndex(r.bodyType));
								return;
							}
							return false;
						}
						if (c.section !== "form") return false;
						setBodyCursor({
							...c,
							row: clamp(c.row + 1, 0, formRowCount - 1),
						});
					},
					hint: { k: "↑↓←→↵", label: "nav" },
				},
				{
					match: "up",
					run: () => {
						const c = bodyCursor();
						if (c.section === "json") {
							setBodyCursor({ section: "type", row: 0, col: 0 });
							setBodyTypeCursor(bodyTypeToOptionIndex(r.bodyType));
							return;
						}
						if (c.section === "binary") {
							setBodyCursor({ section: "type", row: 0, col: 0 });
							setBodyTypeCursor(bodyTypeToOptionIndex(r.bodyType));
							return;
						}
						if (c.section === "form" && c.row === 0) {
							setBodyCursor({ section: "type", row: 0, col: 0 });
							setBodyTypeCursor(bodyTypeToOptionIndex(r.bodyType));
							return;
						}
						if (c.section !== "form") return false;
						setBodyCursor({ ...c, row: clamp(c.row - 1, 0, formRowCount - 1) });
					},
				},
				{
					match: "right",
					run: () => {
						const c = bodyCursor();
						if (c.section === "type") {
							setBodyTypeCursor(
								clamp(bodyTypeCursor() + 1, 0, BODY_TYPE_COUNT - 1),
							);
							return;
						}
						if (c.section !== "form") return false;
						setBodyCursor({
							...c,
							col: clamp(c.col + 1, 0, maxFormCol) as 0 | 1 | 2,
						});
					},
				},
				{
					match: "left",
					run: () => {
						const c = bodyCursor();
						if (c.section === "type") {
							setBodyTypeCursor(
								clamp(bodyTypeCursor() - 1, 0, BODY_TYPE_COUNT - 1),
							);
							return;
						}
						if (c.section !== "form") return false;
						setBodyCursor({
							...c,
							col: clamp(c.col - 1, 0, maxFormCol) as 0 | 1 | 2,
						});
					},
				},
				{
					match: (e) => (e.name === "return" || e.name === "enter") && !e.ctrl && !e.meta,
					run: () => {
						if (!startEditingBodyCell()) return false;
					},
				},
				{
					match: (e) => e.name === "space" || e.sequence === " ",
					run: () => {
						if (!toggleBodyHighlightedRow()) return false;
					},
					hint: { k: "space", label: "toggle" },
				},
				{
					match: (e) => e.ctrl && e.name === "d",
					run: () => {
						if (!deleteBodyHighlightedRow()) return false;
					},
					hint: { k: "ctrl+d", label: "del row" },
				},
			];
		},
	});
}

// ─── editor.auth ─────────────────────────────────────────────────────────────

export function useEditorAuthScope(): void {
	useKeyScope({
		id: "editor.auth",
		priority: 20,
		active: editorActive,
		bindings: (): KeyBinding[] => [
			{
				match: "down",
				run: () => setAuthCursor({ ...authCursor(), row: 1 }),
				hint: { k: "↑↓←→", label: "nav" },
			},
			{
				match: "up",
				run: () => setAuthCursor({ ...authCursor(), row: 0 }),
			},
			{
				match: "right",
				run: () => {
					const c = authCursor();
					if (c.row !== 0) return false;
					setAuthCursor({
						...c,
						typeIndex: clamp(c.typeIndex + 1, 0, AUTH_TYPE_COUNT - 1),
					});
				},
				when: () => authCursor().row === 0,
			},
			{
				match: "left",
				run: () => {
					const c = authCursor();
					if (c.row !== 0) return false;
					setAuthCursor({
						...c,
						typeIndex: clamp(c.typeIndex - 1, 0, AUTH_TYPE_COUNT - 1),
					});
				},
				when: () => authCursor().row === 0,
			},
		],
	});
}

// ─── helpers (lifted from former editor-keyboard.ts) ─────────────────────────

function startEditingRequestName(): void {
	const name = activeRequestName();
	setEditing({
		tab: "Name",
		row: 0,
		col: 0,
		draft: name,
		cursor: name.length,
		ignoreNextKey: "r",
	});
	queueMicrotask(() => {
		const current = editing();
		if (current?.tab === "Name" && current.ignoreNextKey === "r") {
			setEditing({ ...current, ignoreNextKey: undefined });
		}
	});
}

function startEditingBodyCell(): boolean {
	const c = bodyCursor();
	const r = activeRequest();

	if (c.section === "type") {
		const nextType = bodyTypeFromOptionIndex(bodyTypeCursor());
		setActiveBodyType(nextType);
		if (nextType === "form-urlencoded" || nextType === "form") {
			setBodyCursor({ section: "form", row: 0, col: 0 });
		} else if (nextType === "binary") {
			setBodyCursor({ section: "binary", row: 0, col: 0 });
		} else if (nextType === "json") {
			setBodyCursor({ section: "json", row: 0, col: 0 });
		}
		return true;
	}

	if (c.section === "binary" && r.bodyType === "binary") {
		openAttachFileModal({ kind: "binary" });
		return true;
	}

	if (r.bodyType === "form") {
		if (c.section !== "form") return false;

		if (c.row === r.formData.length) {
			addFormData(c.row);
			setBodyCursor({ section: "form", row: c.row, col: 0 });
			setEditing({ tab: "Body", row: c.row, col: 0, draft: "", cursor: 0 });
			return true;
		}

		const row = r.formData[c.row];
		if (!row) return false;

		if (c.col === 1) {
			void toggleFormDataValueType(c.row);
			return true;
		}

		if (c.col === 2) {
			if (row.valueType === "file") {
				openAttachFileModal({ kind: "form-data", rowIndex: c.row });
				return true;
			}
			const current = row.textValue;
			setEditing({ tab: "Body", row: c.row, col: 2, draft: current, cursor: current.length });
			return true;
		}

		const current = row.key;
		setEditing({ tab: "Body", row: c.row, col: 0, draft: current, cursor: current.length });
		return true;
	}

	if (r.bodyType !== "form-urlencoded") return false;

	if (c.section !== "form") return false;

	if (c.row === r.formUrlEncoded.length) {
		addFormUrlEncoded(c.row);
		setBodyCursor({ section: "form", row: c.row, col: 0 });
		setEditing({ tab: "Body", row: c.row, col: 0, draft: "", cursor: 0 });
		return true;
	}

	const row = r.formUrlEncoded[c.row];
	if (!row) return false;
	const current = c.col === 0 ? row.key : row.value;
	setEditing({ tab: "Body", row: c.row, col: c.col, draft: current, cursor: current.length });
	return true;
}

function toggleBodyHighlightedRow(): boolean {
	const c = bodyCursor();
	const r = activeRequest();
	if (c.section !== "form") return false;

	if (r.bodyType === "form-urlencoded") {
		if (!r.formUrlEncoded[c.row]) return false;
		toggleFormUrlEncoded(c.row);
		return true;
	}

	if (r.bodyType === "form") {
		if (!r.formData[c.row]) return false;
		toggleFormData(c.row);
		return true;
	}

	return false;
}

function deleteBodyHighlightedRow(): boolean {
	const c = bodyCursor();
	const r = activeRequest();

	if (c.section === "binary" && r.bodyType === "binary") {
		if (!r.binaryFile) return false;
		void clearBinaryFile();
		return true;
	}

	if (c.section !== "form") return false;

	if (r.bodyType === "form-urlencoded") {
		if (!r.formUrlEncoded[c.row]) return false;
		deleteFormUrlEncoded(c.row);
		setBodyCursor({
			...c,
			row: clamp(c.row, 0, r.formUrlEncoded.length - 1),
		});
		return true;
	}

	if (r.bodyType === "form") {
		if (!r.formData[c.row]) return false;
		void deleteFormData(c.row).then(() => {
			setBodyCursor({
				...c,
				row: clamp(c.row, 0, activeRequest().formData.length - 1),
			});
		});
		return true;
	}

	return false;
}

function startEditingHighlightedCell(): boolean {
	const tab = editorTab();
	const r = activeRequest();

	if (tab === "Headers") {
		const c = headersCursor();
		if (c.row === r.headers.length) {
			const newRow = r.headers.length;
			addHeader(newRow);
			setHeadersCursor({ row: newRow, col: 0 });
			setEditing({ tab: "Headers", row: newRow, col: 0, draft: "", cursor: 0 });
			return true;
		}
		const h = r.headers[c.row];
		if (!h) return false;
		const current = c.col === 0 ? h.key : h.value;
		setEditing({ tab: "Headers", row: c.row, col: c.col, draft: current, cursor: current.length });
		return true;
	}

	if (tab !== "Params") return false;

	const c = paramsCursor();
	if (c.table === "query") {
		if (c.row === r.params.length) {
			addQueryParam(c.row);
			setParamsCursor({ table: "query", row: c.row, col: 0 });
			setEditing({ tab: "Params", row: c.row, col: 0, draft: "", cursor: 0 });
			return true;
		}
		const p = r.params[c.row];
		if (!p) return false;
		const current = c.col === 0 ? p.key : c.col === 1 ? p.value : (p.desc ?? "");
		setEditing({ tab: "Params", row: c.row, col: c.col, draft: current, cursor: current.length });
		return true;
	}

	const p = r.pathParams[c.row];
	if (!p) return false;
	const current = c.col === 0 ? p.key : c.col === 1 ? p.value : (p.desc ?? "");
	setEditing({
		tab: "PathParams",
		row: c.row,
		col: c.col,
		draft: current,
		cursor: current.length,
	});
	return true;
}

function toggleHighlightedRow(): boolean {
	const tab = editorTab();
	const r = activeRequest();

	if (tab === "Headers") {
		const row = headersCursor().row;
		if (!r.headers[row]) return false;
		toggleHeader(row);
		return true;
	}

	if (tab !== "Params") return false;

	const c = paramsCursor();
	if (c.table === "query") {
		if (!r.params[c.row]) return false;
		toggleParam(c.row);
		return true;
	}

	if (!r.pathParams[c.row]) return false;
	togglePathParam(c.row);
	return true;
}

function deleteHighlightedRow(): boolean {
	const tab = editorTab();
	const r = activeRequest();

	if (tab === "Headers") {
		const row = headersCursor().row;
		if (!r.headers[row]) return false;
		deleteHeader(row);
		setHeadersCursor({
			...headersCursor(),
			row: clamp(row, 0, r.headers.length - 1),
		});
		return true;
	}

	if (tab !== "Params") return false;

	const c = paramsCursor();
	if (c.table !== "query" || !r.params[c.row]) return false;

	deleteQueryParam(c.row);
	setParamsCursor({
		...c,
		row: clamp(c.row, 0, r.params.length - 1),
	});
	return true;
}

type ParamsCursorState = ReturnType<typeof paramsCursor>;

function moveParamsCursor(
	cursor: ParamsCursorState,
	delta: 1 | -1,
	queryRowCount: number,
	pathRowCount: number,
): ParamsCursorState {
	const totalRows = queryRowCount + pathRowCount;
	if (totalRows <= 0) return cursor;
	const current = cursor.table === "path" ? cursor.row : pathRowCount + cursor.row;
	const next = clamp(current + delta, 0, totalRows - 1);
	if (next < pathRowCount) return { ...cursor, table: "path", row: next };
	return { ...cursor, table: "query", row: next - pathRowCount };
}
