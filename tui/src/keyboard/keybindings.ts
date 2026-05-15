// Centralized keybinding hint definitions.
//
// Each panel and the global status bar read from these arrays so there is a
// single source of truth for what key hints to display. The handler logic
// itself stays in the respective keyboard modules — these arrays are purely
// for *display*.

export interface KeyHint {
	k: string;
	label: string;
}

export const GLOBAL_HINTS: KeyHint[] = [
	{ k: "/", label: "cmd" },
	{ k: "n", label: "new" },
	{ k: "ctrl+p", label: "preset" },
	{ k: "e", label: "env" },
	{ k: "h", label: "hist" },
	{ k: "m", label: "method" },
	{ k: "x", label: "move" },
	{ k: "⌘↵", label: "send" },
	{ k: "tab", label: "pane" },
	{ k: "q", label: "quit" },
];

export const COLLECTIONS_HINTS: KeyHint[] = [
	{ k: "↑↓", label: "nav" },
	{ k: "↵", label: "open" },
	{ k: "p", label: "pin" },
	{ k: "n", label: "req" },
	{ k: "d", label: "del" },
	{ k: "c", label: "col" },
	{ k: "x", label: "move" },
];

export const EDITOR_KV_HINTS: KeyHint[] = [
	{ k: "↑↓", label: "row" },
	{ k: "←→", label: "col" },
	{ k: "↵", label: "edit/save" },
	{ k: "ctrl+d", label: "delete row" },
	{ k: "esc", label: "cancel" },
	{ k: "r", label: "rename" },
	{ k: "m", label: "method" },
	{ k: "u", label: "url" },
	{ k: "ctrl+p", label: "new preset" },
	{ k: "ctrl+↵", label: "send" },
];

export const EDITOR_BODY_HINTS: KeyHint[] = [
	{ k: "←→", label: "change type" },
	{ k: "↑↓", label: "field" },
];

export const EDITOR_AUTH_HINTS: KeyHint[] = [
	{ k: "↑↓", label: "field" },
	{ k: "←→", label: "change type" },
];

export const RESPONSE_HINTS: KeyHint[] = [
	{ k: "1", label: "Body" },
	{ k: "2", label: "Headers" },
	{ k: "3", label: "Cookies" },
	{ k: "4", label: "Tests" },
	{ k: "5", label: "Timeline" },
];

export const PRESETS_HINTS: KeyHint[] = [
	{ k: "p/↵", label: "cycle" },
	{ k: "esc", label: "close" },
];
