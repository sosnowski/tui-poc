// dev.ts — file watcher + restart loop for the TUI app.
//
// Why this exists instead of `bun --watch src/index.tsx`:
//   bun --watch resets the JS runtime *in place* on file changes (it doesn't
//   spawn a fresh process). OpenTUI's renderer keeps native FFI handles and
//   raw-mode stdin around across that reset, so after the first reload the
//   terminal is left in a half-torn-down state and subsequent edits stop
//   producing visible reloads. (See https://github.com/oven-sh/bun/issues/* —
//   the in-process reset model is fundamentally incompatible with native
//   resources that don't get GC'd before the runtime restarts.)
//
// What we do here:
//   1. Spawn `bun src/index.tsx` as a real child process so it owns its own
//      runtime, FFI handles, and stdin/stdout connection to this terminal.
//   2. Watch every `.ts` / `.tsx` file under src/ recursively. When any of
//      them changes, send SIGTERM (the entry point's signal handler turns
//      that into a clean OpenTUI destroy + process.exit) and spawn a fresh
//      child once it has exited.
//   3. Forward the parent's own termination signals to the child so Ctrl+C
//      and friends still exit the whole stack cleanly.

import { spawn, type Subprocess } from "bun";
import { watch } from "node:fs";
import { join } from "node:path";

const ENTRY = "src/index.tsx";
const WATCH_ROOT = "src";
// File extensions that should trigger a reload. Anything else (lockfiles,
// generated assets, editor swap files, …) is ignored to avoid restart storms.
const WATCH_EXT = /\.(tsx?|jsx?|json)$/i;
// Many editors save in two phases (write temp + rename), which fires multiple
// fs events for one logical edit. We coalesce events that land within this
// window so we don't bounce the child.
const DEBOUNCE_MS = 80;

function log(message: string): void {
	// Stderr so it doesn't get tangled with the app's own stdout drawing,
	// and prefixed so it's obvious it came from the watcher rather than the
	// app itself.
	process.stderr.write(`\x1b[2m[dev]\x1b[0m ${message}\n`);
}

let child: Subprocess | null = null;
let restarting = false;
let pendingRestart = false;

function startChild(): void {
	child = spawn({
		cmd: ["bun", ENTRY],
		// Inherit so the TUI takes over our terminal directly: raw-mode stdin
		// is forwarded, alt-screen drawing is visible, and Ctrl+C in the TUI
		// behaves the same as in production.
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
		// Surface child crashes — the watcher keeps running so the user can
		// fix the file and trigger a respawn with another save.
		onExit(_proc, exitCode, signal) {
			if (signal) {
				log(`app exited (${signal})`);
			} else if (exitCode && exitCode !== 0) {
				log(`app exited with code ${exitCode}`);
			}
			child = null;
			// If a restart was queued while we were stopping, kick it off now.
			if (pendingRestart) {
				pendingRestart = false;
				startChild();
			}
		},
	});
}

async function restart(reason: string): Promise<void> {
	// If we're already in the middle of restarting, just remember that another
	// change came in and let the in-flight tear-down handle it.
	if (restarting) {
		pendingRestart = true;
		return;
	}
	restarting = true;
	log(`reloading — ${reason}`);
	if (child && child.exitCode === null) {
		// SIGTERM hits index.tsx's exitSignals path → OpenTUI destroy() + clean
		// process.exit(). The onExit hook above will respawn for us.
		pendingRestart = true;
		child.kill("SIGTERM");
	} else {
		startChild();
	}
	restarting = false;
}

// ---- file watcher ---------------------------------------------------------

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastChanged: string | null = null;

function onFsEvent(_event: string, filename: string | null): void {
	if (!filename) return;
	if (!WATCH_EXT.test(filename)) return;

	lastChanged = filename;
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		debounceTimer = null;
		restart(`${lastChanged} changed`);
	}, DEBOUNCE_MS);
}

// `recursive: true` is supported on macOS and Windows. Linux users would need
// chokidar or a per-directory walker; that's a future concern.
watch(join(process.cwd(), WATCH_ROOT), { recursive: true }, onFsEvent);

// ---- forward parent signals ----------------------------------------------

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
	process.on(sig, () => {
		log(`received ${sig}, shutting down`);
		if (child && child.exitCode === null) child.kill(sig);
		// Give the child a beat to flush its teardown, then exit.
		setTimeout(() => process.exit(0), 100);
	});
}

log(`watching ${WATCH_ROOT}/, entry: ${ENTRY}`);
startChild();
