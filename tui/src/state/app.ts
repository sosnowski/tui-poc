import { createMemo, createSignal } from "solid-js";

import { THEMES, THEME_ORDER, type Theme, type ThemeKey } from "./themes";

const [loading, setLoadingSig] = createSignal<boolean>(true);
export { loading };

export function setLoading(v: boolean): void {
	setLoadingSig(v);
}

const [themeKey, setThemeKey] = createSignal<ThemeKey>("catppuccin");

export const theme = createMemo<Theme>(() => THEMES[themeKey()].colors);

export const themeMeta = createMemo(() => ({
	key: themeKey(),
	label: THEMES[themeKey()].label,
}));

export function setTheme(key: ThemeKey): void {
	setThemeKey(key);
}

export function cycleTheme(): ThemeKey {
	const idx = THEME_ORDER.indexOf(themeKey());
	const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length]!;
	setThemeKey(next);
	return next;
}

export type PaneId = "collections" | "editor" | "response";

const [focusedPane, setFocusedPaneSig] = createSignal<PaneId>("editor");
export { focusedPane };

export function setFocusedPane(p: PaneId): void {
	setFocusedPaneSig(p);
}

const PANE_CYCLE: PaneId[] = ["collections", "editor", "response"];

export function cyclePane(direction: 1 | -1 = 1): void {
	const i = PANE_CYCLE.indexOf(focusedPane());
	const n = PANE_CYCLE.length;
	setFocusedPaneSig(PANE_CYCLE[(i + direction + n) % n]!);
}

export type Modal = "splash" | "command" | "env" | "history" | "method" | "newMethod" | "newCollection" | "moveRequest" | "deleteConfirm" | null;

const [modal, setModalSig] = createSignal<Modal>("splash");
export { modal };

export function openModal(m: Exclude<Modal, null>): void {
	setModalSig(m);
}

export function closeModal(): void {
	setModalSig(null);
}

export interface Toast {
	message: string;
	kind: "ok" | "err" | "info";
	id: number;
}

const [toast, setToastSig] = createSignal<Toast | null>(null);
export { toast };

let toastCounter = 0;

export function pushToast(message: string, kind: Toast["kind"] = "ok"): void {
	const id = ++toastCounter;
	setToastSig({ id, message, kind });
	setTimeout(() => {
		if (toast()?.id === id) setToastSig(null);
	}, 2400);
}

export function dismissToast(): void {
	setToastSig(null);
}
