// Editor-pane keyboard handlers.
//
// Active only while the editor pane is focused (and no modal is up). Arrows move
// the highlighted cell; Enter toggles explicit edit mode for text fields.

import { useKeyboard } from "@opentui/solid";
import type { KeyEvent } from "@opentui/core";

import { clamp, isEnterKey, isPlainKey, printableChar } from "../keyboard/helpers";
import {
	activeRequest,
	activeRequestId,
	activeRequestName,
	activeRequestPresetNames,
	authCursor,
	bodyTypeCursor,
	cancelEditing,
	cycleActivePreset,
	editing,
	editorTab,
	focusedPane,
	getActivePresetName,
	hasActiveRequest,
	headersCursor,
	modal,
	openModal,
	paramsCursor,
	presetsCursor,
	presetsExpanded,
	setActivePresetForRequest,
	setAuthCursor,
	setBodyTypeCursor,
	setEditing,
	setEditorTab,
	setHeadersCursor,
	setParamsCursor,
	setPresetsCursor,
	setPresetsExpanded,
	toggleHeader,
	toggleParam,
	togglePathParam,
} from "./store";

const BODY_TYPE_COUNT = 5; // none, form-data, x-www-form-urlencoded, raw/json, binary
const AUTH_TYPE_COUNT = 5; // none, bearer, basic, api-key, oauth2

export function useEditorKeyboard(): void {
	useKeyboard((e: KeyEvent) => {
		if (focusedPane() !== "editor") return;
		if (modal() !== null) return;
		const tab = editorTab();
		const r = activeRequest();

		// Query params include a trailing "+ key" row. Path-param rows are URL-derived.
		const paramsRowCount = r.params.length + 1;
		const pathParamsRowCount = r.pathParams.length;
		const headersRowCount = r.headers.length + 1;

		if (tab === "Params" && pathParamsRowCount === 0 && paramsCursor().table === "path") {
			const c = paramsCursor();
			setParamsCursor({ ...c, table: "query", row: clamp(c.row, 0, paramsRowCount - 1) });
		}

		if (editing() !== null) {
			handleEditMode(e);
			return;
		}

		if (e.name === "escape" && presetsExpanded()) {
			setPresetsExpanded(false);
			e.preventDefault();
			return;
		}

		const plainKey = !e.ctrl && !e.meta ? printableChar(e) : undefined;

		if (plainKey === "p" || plainKey === "P") {
			if (!hasActiveRequest()) return;
			if (!presetsExpanded()) {
				const names = activeRequestPresetNames();
				const activeName = getActivePresetName(activeRequestId());
				const idx = names.indexOf(activeName);
				setPresetsExpanded(true);
				setPresetsCursor(Math.max(0, idx));
			} else {
				const names = activeRequestPresetNames();
				const direction = plainKey === "P" ? -1 : 1;
				const nextCursor = (presetsCursor() + direction + names.length) % names.length;
				setPresetsCursor(nextCursor);
				setActivePresetForRequest(activeRequestId(), names[nextCursor]!);
			}
			e.preventDefault();
			return;
		}

		if (e.ctrl && e.name === "p") {
			if (!hasActiveRequest()) return;
			openModal("newPreset");
			e.preventDefault();
			return;
		}

		if (isPlainKey(e, "r")) {
			startEditingRequestName();
			e.preventDefault();
			return;
		}

		if (e.name === "down") {
			if (tab === "Params") {
				const c = paramsCursor();
				setParamsCursor(moveParamsCursor(c, 1, paramsRowCount, pathParamsRowCount));
			} else if (tab === "Headers") {
				const c = headersCursor();
				setHeadersCursor({ ...c, row: clamp(c.row + 1, 0, headersRowCount - 1) });
			} else if (tab === "Auth") {
				const c = authCursor();
				setAuthCursor({ ...c, row: 1 });
			}
			return;
		}
		if (e.name === "up") {
			if (tab === "Params") {
				const c = paramsCursor();
				setParamsCursor(moveParamsCursor(c, -1, paramsRowCount, pathParamsRowCount));
			} else if (tab === "Headers") {
				const c = headersCursor();
				setHeadersCursor({ ...c, row: clamp(c.row - 1, 0, headersRowCount - 1) });
			} else if (tab === "Auth") {
				const c = authCursor();
				setAuthCursor({ ...c, row: 0 });
			}
			return;
		}
		if (e.name === "right") {
			if (tab === "Params") {
				const c = paramsCursor();
				setParamsCursor({ ...c, col: clamp(c.col + 1, 0, 2) as 0 | 1 | 2 });
			} else if (tab === "Headers") {
				const c = headersCursor();
				setHeadersCursor({ ...c, col: clamp(c.col + 1, 0, 1) as 0 | 1 });
			} else if (tab === "Body") {
				setBodyTypeCursor(clamp(bodyTypeCursor() + 1, 0, BODY_TYPE_COUNT - 1));
			} else if (tab === "Auth") {
				const c = authCursor();
				if (c.row === 0) {
					setAuthCursor({
						...c,
						typeIndex: clamp(c.typeIndex + 1, 0, AUTH_TYPE_COUNT - 1),
					});
				}
			}
			return;
		}
		if (e.name === "left") {
			if (tab === "Params") {
				const c = paramsCursor();
				setParamsCursor({ ...c, col: clamp(c.col - 1, 0, 2) as 0 | 1 | 2 });
			} else if (tab === "Headers") {
				const c = headersCursor();
				setHeadersCursor({ ...c, col: clamp(c.col - 1, 0, 1) as 0 | 1 });
			} else if (tab === "Body") {
				setBodyTypeCursor(clamp(bodyTypeCursor() - 1, 0, BODY_TYPE_COUNT - 1));
			} else if (tab === "Auth") {
				const c = authCursor();
				if (c.row === 0) {
					setAuthCursor({
						...c,
						typeIndex: clamp(c.typeIndex - 1, 0, AUTH_TYPE_COUNT - 1),
					});
				}
			}
			return;
		}

		if (isEnterKey(e)) {
			// Ctrl/Meta+Enter is "fire request" handled by the global handler.
			if (e.ctrl || e.meta) return;
			if (presetsExpanded()) {
				setPresetsExpanded(false);
				e.preventDefault();
				return;
			}
			if (startEditingHighlightedCell()) e.preventDefault();
			return;
		}

		if (e.name === "space" || e.sequence === " ") {
			toggleHighlightedRow();
			return;
		}

		if (e.name === "1") setEditorTab("Params");
		else if (e.name === "2") setEditorTab("Headers");
		else if (e.name === "3") setEditorTab("Body");
		else if (e.name === "4") setEditorTab("Auth");
		else if (e.name === "5") setEditorTab("Tests");
	});
}

function handleEditMode(e: KeyEvent): void {
	const current = editing();
	if (!current) return;

	if (current.ignoreNextKey === e.name) {
		setEditing({ ...current, ignoreNextKey: undefined });
		e.preventDefault();
		return;
	}

	if (e.name === "escape") {
		cancelEditing();
		e.preventDefault();
		return;
	}
}

function startEditingHighlightedCell(): boolean {
	const tab = editorTab();
	const r = activeRequest();

	if (tab === "Headers") {
		const c = headersCursor();
		const h = r.headers[c.row];
		if (!h) return false;
		const current = c.col === 0 ? h.key : h.value;
		setEditing({
			tab: "Headers",
			row: c.row,
			col: c.col,
			draft: current,
			cursor: current.length,
		});
		return true;
	}

	if (tab !== "Params") return false;

	const c = paramsCursor();
	if (c.table === "query") {
		const p = r.params[c.row];
		if (!p) return false;
		const current = c.col === 0 ? p.key : c.col === 1 ? p.value : (p.desc ?? "");
		setEditing({
			tab: "Params",
			row: c.row,
			col: c.col,
			draft: current,
			cursor: current.length,
		});
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
