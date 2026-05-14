// Color themes for TUI Postman.
//
// Each theme is a flat palette of named colors used throughout the UI.
// Components read colors via the reactive `theme()` accessor (see
// `state/store.ts`) so flipping `themeKey` instantly redraws the whole app.
//
// The palette names mirror the CSS custom properties in poc-react/themes.jsx
// to make porting visual elements as direct as possible.

export interface Theme {
	// Surfaces
	bg: string; // app background
	bg2: string; // secondary background (gutter, status bar)
	bg3: string; // input/inset background
	surface: string; // pane interior

	// Borders
	border: string;
	border2: string;
	borderFocus: string;

	// Foreground text
	text: string;
	text2: string; // muted body
	textDim: string; // very muted (helper hints, placeholders)

	// Accent (used for highlights, active row backgrounds, prompts)
	accent: string;
	accent2: string;
	accentBg: string;
	selBg: string; // selected row background
	selFg: string; // selected row foreground

	// HTTP method colors
	methodGet: string;
	methodPost: string;
	methodPut: string;
	methodPatch: string;
	methodDelete: string;

	// Status / log colors
	ok: string;
	warn: string;
	err: string;
	info: string;

	// JSON syntax tokens
	str: string;
	num: string;
	bool: string;
	null: string;
	key: string;
	punct: string;
}

export type ThemeKey = "opencode" | "catppuccin" | "matrix";

export const THEMES: Record<ThemeKey, { label: string; colors: Theme }> = {
	opencode: {
		label: "OpenCode (warm orange)",
		colors: {
			bg: "#0e0e10",
			bg2: "#16161a",
			bg3: "#1d1d22",
			surface: "#1a1a1f",
			border: "#2a2a31",
			border2: "#3a3a42",
			borderFocus: "#d97757",
			text: "#cfcfd2",
			text2: "#9b9ba2",
			textDim: "#5e5e66",
			accent: "#d97757",
			accent2: "#b35a3e",
			accentBg: "#2a1c16",
			selBg: "#2a1c16",
			selFg: "#f4b89a",
			methodGet: "#5fb3d1",
			methodPost: "#7cba6f",
			methodPut: "#d9a657",
			methodPatch: "#b48ead",
			methodDelete: "#d96757",
			ok: "#7cba6f",
			warn: "#d9a657",
			err: "#d96757",
			info: "#5fb3d1",
			str: "#a8c87a",
			num: "#d9a657",
			bool: "#d97757",
			null: "#7a7a82",
			key: "#5fb3d1",
			punct: "#6b6b73",
		},
	},
	catppuccin: {
		label: "Catppuccin Mocha",
		colors: {
			bg: "#1e1e2e",
			bg2: "#181825",
			bg3: "#11111b",
			surface: "#181825",
			border: "#313244",
			border2: "#45475a",
			borderFocus: "#fab387",
			text: "#cdd6f4",
			text2: "#a6adc8",
			textDim: "#6c7086",
			accent: "#fab387",
			accent2: "#f5c2e7",
			accentBg: "#2a2336",
			selBg: "#313244",
			selFg: "#fab387",
			methodGet: "#89dceb",
			methodPost: "#a6e3a1",
			methodPut: "#f9e2af",
			methodPatch: "#cba6f7",
			methodDelete: "#f38ba8",
			ok: "#a6e3a1",
			warn: "#f9e2af",
			err: "#f38ba8",
			info: "#89dceb",
			str: "#a6e3a1",
			num: "#fab387",
			bool: "#cba6f7",
			null: "#6c7086",
			key: "#89b4fa",
			punct: "#7f849c",
		},
	},
	matrix: {
		label: "Matrix (phosphor green)",
		colors: {
			bg: "#040806",
			bg2: "#081210",
			bg3: "#0d1a16",
			surface: "#0a1512",
			border: "#1f3a32",
			border2: "#2f5a4d",
			borderFocus: "#39ff8c",
			text: "#9be8b9",
			text2: "#5fb088",
			textDim: "#356a52",
			accent: "#39ff8c",
			accent2: "#1fcf6a",
			accentBg: "#0c2018",
			selBg: "#102a20",
			selFg: "#a8ffc8",
			methodGet: "#5fd9d9",
			methodPost: "#39ff8c",
			methodPut: "#d9d96f",
			methodPatch: "#9bd96f",
			methodDelete: "#ff6b6b",
			ok: "#39ff8c",
			warn: "#d9d96f",
			err: "#ff6b6b",
			info: "#5fd9d9",
			str: "#9be8b9",
			num: "#d9d96f",
			bool: "#39ff8c",
			null: "#356a52",
			key: "#5fd9d9",
			punct: "#356a52",
		},
	},
};

// Stable order for cycling themes via `/theme`.
export const THEME_ORDER: ThemeKey[] = ["opencode", "catppuccin", "matrix"];
