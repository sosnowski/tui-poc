// Command palette modal — fuzzy(ish) search over slash-commands and shortcuts.
//
// Mirrors the React POC: an `/`-prompt, a filterable list of commands with
// hints, and arrow-keys / Enter to select. Esc closes.

import { For, createMemo, createSignal } from "solid-js";
import { useKeyboard, useRenderer } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { Pane } from "../components/pane";
import { S } from "../components/styled-span";
import { Scrim } from "../components/scrim";
import { KeyPill } from "../components/key-pill";
import { SelectableRow } from "../components/selectable-row";
import { COMMANDS } from "../data/commands";
import { moveIndex, printableChar } from "../keyboard/helpers";
import {
	closeModal,
	cycleTheme,
	fireRequest,
	openModal,
	pushToast,
	setEditorTab,
	theme,
} from "../state/store";
import { quit } from "../state/keyboard";
import { THEMES } from "../state/themes";

export function CommandPalette() {
	const t = () => theme();
	const renderer = useRenderer();
	const [query, setQuery] = createSignal("");
	const [idx, setIdx] = createSignal(0);

	const filtered = createMemo(() => {
		const q = query().toLowerCase();
		return COMMANDS.filter(
			(c) => c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q),
		);
	});

	function runCommand(cmd: string): void {
		switch (cmd) {
			case "/send":
				fireRequest();
				break;
			case "/env":
				openModal("env");
				return;
			case "/history":
				openModal("history");
				return;
			case "/method":
				openModal("method");
				return;
			case "/headers":
				setEditorTab("Headers");
				break;
			case "/body":
				setEditorTab("Body");
				break;
			case "/params":
				setEditorTab("Params");
				break;
			case "/theme": {
				const next = cycleTheme();
				pushToast(`theme: ${THEMES[next].label}`, "ok");
				break;
			}
			case "/exit":
				quit(renderer);
				return;
			default:
				pushToast(`${cmd} ─ not yet implemented`, "info");
		}
		closeModal();
	}

	useKeyboard((e) => {
		if (e.name === "escape") return closeModal();
		if (e.name === "down") {
			setIdx((i) => moveIndex(i, 1, filtered().length));
			return;
		}
		if (e.name === "up") {
			setIdx((i) => moveIndex(i, -1, filtered().length));
			return;
		}
		if (e.name === "return") {
			const cmd = filtered()[idx()];
			if (cmd) runCommand(cmd.cmd);
			return;
		}
		if (e.name === "backspace") {
			setQuery((q) => q.slice(0, -1));
			setIdx(0);
			return;
		}
		const char = printableChar(e);
		if (char) {
			setQuery((q) => q + char);
			setIdx(0);
		}
	});

	return (
		<Scrim align="top">
			<box width={108}>
				<Pane title="command palette" accent>
					{/* Search input row */}
					<box
						flexDirection="row"
						paddingTop={1}
						paddingBottom={1}
						flexShrink={0}
						height={1}
					>
						<text fg={t().accent} attributes={TextAttributes.BOLD}>
							/{" "}
						</text>
						<text fg={t().text} flexGrow={1}>
							{query() || ""}
							<S fg={t().accent}>█</S>
						</text>
					</box>

					<text fg={t().border}>{"─".repeat(102)}</text>

					{/* Command list */}
					<box flexDirection="column" paddingTop={1} paddingBottom={1}>
						{filtered().length === 0 ? (
							<text fg={t().textDim}>─── no matching commands ───</text>
						) : (
							<For each={filtered()}>
								{(c, i) => {
									const sel = () => i() === idx();
									return (
										<SelectableRow selected={sel()}>
											<text
												fg={t().accent}
												attributes={TextAttributes.BOLD}
												width={18}
											>
												{c.cmd}
											</text>
											<text fg={sel() ? t().selFg : t().text2} flexGrow={1}>
												{c.desc}
											</text>
											<text fg={t().textDim} width={6}>
												{c.hint}
											</text>
										</SelectableRow>
									);
								}}
							</For>
						)}
					</box>

					{/* Footer hints */}
					<box flexDirection="row" paddingTop={1} columnGap={2}>
						<KeyPill k="↑↓" label="navigate" />
						<KeyPill k="↵" label="run" />
						<KeyPill k="esc" label="close" />
						<box flexGrow={1} />
						<text fg={t().textDim}>
							{filtered().length} of {COMMANDS.length}
						</text>
					</box>
				</Pane>
			</box>
		</Scrim>
	);
}
