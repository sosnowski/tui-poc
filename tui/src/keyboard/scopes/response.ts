// Response-pane scope.
//
// Active whenever the ResponsePane component is mounted AND the response pane
// is focused. The component itself owns the lifecycle by calling this hook
// from its setup; the `active()` predicate gates dispatch.

import { useKeyScope } from "../use-key-scope";
import type { KeyBinding } from "../types";
import { focusedPane, setResponseTab } from "../../state/store";

export function useResponseScope(): void {
	useKeyScope({
		id: "response",
		priority: 10,
		active: () => focusedPane() === "response",
		bindings: (): KeyBinding[] => [
			// Single hint covers all five — the strip would otherwise blow
			// past the available width on the response pane.
			{ match: "1", run: () => setResponseTab("Body"), hint: { k: "1-5", label: "tab" } },
			{ match: "2", run: () => setResponseTab("Headers") },
			{ match: "3", run: () => setResponseTab("Cookies") },
			{ match: "4", run: () => setResponseTab("Tests") },
			{ match: "5", run: () => setResponseTab("Timeline") },
		],
	});
}
