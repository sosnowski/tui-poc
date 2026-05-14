import { editing, setEditing } from "./editor";
import {
	setActiveRequestName,
	setActiveRequestUrl,
	setHeaderCell,
	setParamCell,
	setPathParamCell,
} from "./requests";

export function cancelEditing(): void {
	setEditing(null);
}

export function updateEditingDraft(value: string): void {
	const current = editing();
	if (!current) return;
	setEditing({ ...current, draft: value, cursor: value.length });
}

export function commitEditingValue(value: string): void {
	const current = editing();
	if (!current) return;

	if (current.tab === "Name") {
		setActiveRequestName(value);
		setEditing(null);
		return;
	}

	if (current.tab === "Url") {
		setActiveRequestUrl(value);
		setEditing(null);
		return;
	}

	if (current.tab === "Headers") {
		setHeaderCell(current.row, current.col as 0 | 1, value);
		setEditing(null);
		return;
	}

	if (current.tab === "Params") {
		setParamCell(current.row, current.col, value);
		setEditing(null);
		return;
	}

	setPathParamCell(current.row, current.col, value);
	setEditing(null);
}
