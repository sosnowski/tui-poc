// Component-friendly lifecycle hook around `registerKeyScope`.
//
// A component calls `useKeyScope({...})` once during setup and the scope is
// automatically removed from the registry when the component unmounts. This
// is what makes the "what bindings are active right now?" set track the
// component tree — when a tab is mounted, its scope is live; when the tab
// switches away (`<Show when={...}/>` flips), the scope vanishes and the
// hint strip updates immediately.

import { onCleanup, onMount } from "solid-js";

import { registerKeyScope } from "./registry";
import type { KeyScope } from "./types";

export function useKeyScope(scope: KeyScope): void {
	onMount(() => {
		const dispose = registerKeyScope(scope);
		onCleanup(dispose);
	});
}
