// Renderer teardown helpers. The keyboard handlers themselves live in the
// scope registry (see `keyboard/registry.ts` and `keyboard/scopes/*.ts`); the
// only reason this file still exists is `quit()`, which is invoked from
// keyboard scopes and from the command palette modal.

import type { useRenderer } from "@opentui/solid";

/**
 * Tear the renderer down cleanly and exit.
 *
 * Important: never just `process.exit(0)` — OpenTUI puts the terminal into
 * the alternate screen and turns on mouse tracking; if we exit without
 * destroy() running, the parent shell is left receiving cursor-motion
 * sequences (`\x1b[<35;X;Y M`) which then leak as random "35;X;Y M" text
 * once the controlling app is gone. `renderer.destroy()` flushes the right
 * teardown sequences (DECRST 1000/1002/1003/1006, leave alt-screen, etc.)
 * and triggers our `onDestroy` callback (registered in index.tsx). We also
 * write a defensive restore sequence and defer process exit so the terminal
 * is not left in raw/alternate-screen mode if destroy() queues bytes.
 */
export function quit(renderer: ReturnType<typeof useRenderer>): void {
	try {
		renderer.destroy();
	} catch {
		// best-effort — fall through to exit even if destroy throws.
	}
	restoreTerminal();
	exitAfterFlush();
}

function restoreTerminal(): void {
	const stdin = process.stdin as typeof process.stdin & {
		setRawMode?: (mode: boolean) => void;
	};

	try {
		if (stdin.isTTY && stdin.setRawMode) stdin.setRawMode(false);
		stdin.pause();
	} catch {
		// Terminal restoration is best-effort; ANSI restore below still helps.
	}

	process.stdout.write(
		[
			"\x1b[0m",
			"\x1b[?25h",
			"\x1b[?1000l",
			"\x1b[?1002l",
			"\x1b[?1003l",
			"\x1b[?1005l",
			"\x1b[?1006l",
			"\x1b[?1015l",
			"\x1b[?2004l",
			"\x1b[?1049l",
		].join(""),
	);
}

function exitAfterFlush(): void {
	process.stdout.write("", () => process.exit(0));
	setTimeout(() => process.exit(0), 20).unref?.();
}
