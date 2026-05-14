// TUI Postman — entry point.
// Spins up the OpenTUI renderer and mounts the SolidJS App tree.

import { render } from "@opentui/solid";

import { App } from "./app";
import { setLoading } from "./state/app";
import { initCollections } from "./state/requests";
import { loadOrSeed } from "./state/persistence";

// Signals that should also tear the app down. We list them up here because
// they're referenced in two places: `exitSignals` (OpenTUI's destroy hook)
// and the explicit-exit handler installed below.
const TERMINATION_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"] as const;

render(() => <App />, {
	screenMode: "alternate-screen",
	exitOnCtrlC: true,
	exitSignals: [...TERMINATION_SIGNALS],
	consoleMode: "disabled",
	onDestroy: () => process.stdout.write("\x1b[2J\x1b[H"),
});

// Load collections from disk (or seed on first run), then flip loading off.
loadOrSeed()
	.then(({ collections, requestDetails }) => {
		initCollections(collections, requestDetails);
		setLoading(false);
	})
	.catch((err) => {
		console.error("[tui] failed to load collections:", err);
		setLoading(false);
	});

// OpenTUI's signal handler calls `renderer.destroy()` but never `process.exit`,
// so once any of these signals fires the event loop stays alive (FFI handles,
// stdin in raw mode, etc.) and the process hangs. That breaks `bun --watch`,
// which sends SIGTERM expecting the child to exit so it can respawn it.
//
// We register our handlers AFTER `render()` so they run *after* OpenTUI's:
// destroy() flushes synchronously, then we hard-exit on the next tick.
for (const signal of TERMINATION_SIGNALS) {
	process.on(signal, () => {
		setImmediate(() => process.exit(0));
	});
}
