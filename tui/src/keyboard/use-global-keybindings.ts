// The single application-wide useKeyboard listener.
//
// Mounted once at the App root. Walks `activeBindings()` (already priority-
// sorted, exclusive-aware) and dispatches the first match. Modal handlers
// continue to install their own `useKeyboard` — when a modal is open we just
// bail here so global / panel scopes don't fight the modal.

import { useKeyboard } from "@opentui/solid";
import type { KeyEvent } from "@opentui/core";

import { matches } from "./match";
import { activeBindings } from "./registry";
import { modal } from "../state/store";

export function useGlobalKeybindings(): void {
	useKeyboard((e: KeyEvent) => {
		if (modal() !== null) return;

		for (const binding of activeBindings()) {
			if (!matches(binding.match, e)) continue;
			const result = binding.run(e);
			if (result === false) continue;
			(e as { preventDefault?: () => void }).preventDefault?.();
			return;
		}
	});
}
