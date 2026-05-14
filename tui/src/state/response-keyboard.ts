// Response-pane keyboard handler.
//
// Active only while the response pane is focused (and no modal is up).
// Number keys switch between response tabs.

import { useKeyboard } from "@opentui/solid";
import type { KeyEvent } from "@opentui/core";

import { editing, focusedPane, modal, setResponseTab } from "./store";

export function useResponseKeyboard(): void {
	useKeyboard((e: KeyEvent) => {
		if (focusedPane() !== "response") return;
		if (modal() !== null) return;
		if (editing() !== null) return;

		if (e.name === "1") setResponseTab("Body");
		else if (e.name === "2") setResponseTab("Headers");
		else if (e.name === "3") setResponseTab("Cookies");
		else if (e.name === "4") setResponseTab("Tests");
		else if (e.name === "5") setResponseTab("Timeline");
	});
}
