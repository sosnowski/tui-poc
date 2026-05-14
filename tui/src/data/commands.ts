// Slash-command palette entries.

import type { Command } from "./types";

export const COMMANDS: Command[] = [
	{ cmd: "/send", desc: "Send the active request", hint: "↵" },
	{ cmd: "/save", desc: "Save changes to active request", hint: "⌘s" },
	{ cmd: "/new", desc: "Create a new request", hint: "n" },
	{ cmd: "/duplicate", desc: "Duplicate active request", hint: "d" },
	{ cmd: "/rename", desc: "Rename active request", hint: "r" },
	{ cmd: "/delete", desc: "Delete active request", hint: "x" },
	{ cmd: "/env", desc: "Open environment manager", hint: "e" },
	{ cmd: "/history", desc: "Open request history", hint: "h" },
	{ cmd: "/method", desc: "Change active request method", hint: "m" },
	{ cmd: "/auth", desc: "Configure auth (Bearer, Basic, OAuth2)", hint: "a" },
	{ cmd: "/headers", desc: "Jump to headers tab", hint: "2" },
	{ cmd: "/body", desc: "Jump to body tab", hint: "3" },
	{ cmd: "/params", desc: "Jump to query params tab", hint: "1" },
	{ cmd: "/copy curl", desc: "Copy request as curl command", hint: "" },
	{ cmd: "/copy fetch", desc: "Copy request as JS fetch()", hint: "" },
	{ cmd: "/import", desc: "Import OpenAPI / Postman collection", hint: "" },
	{ cmd: "/export", desc: "Export collection to file", hint: "" },
	{ cmd: "/theme", desc: "Cycle color theme", hint: "" },
	{ cmd: "/exit", desc: "Exit TUI Postman", hint: "⌘q" },
];
