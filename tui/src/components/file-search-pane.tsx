import { For, Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { KeyPill } from "./key-pill";
import { SelectableRow } from "./selectable-row";
import { Spinner } from "./spinner";
import { S } from "./styled-span";
import { clamp, moveIndex } from "../keyboard/helpers";
import { searchFiles } from "@tuipostman/core";
import { getWorkingDir, theme } from "../state/store";

const VISIBLE_ROWS = 10;
const SEARCH_DEBOUNCE_MS = 150;

function SearchingState() {
	const t = () => theme();
	return (
		<box flexDirection="column" height={VISIBLE_ROWS} paddingTop={1}>
			<text>
				<Spinner />
				<S fg={t().textDim}> searching for files…</S>
			</text>
		</box>
	);
}

export interface FileSearchPaneProps {
	onAttach: (path: string) => void | Promise<void>;
	onCancel: () => void;
}

export function FileSearchPane(props: FileSearchPaneProps) {
	const t = () => theme();
	const workingDir = getWorkingDir();
	const [path, setPath] = createSignal("");
	const [matches, setMatches] = createSignal<string[]>([]);
	const [searching, setSearching] = createSignal(false);
	const [selectedIndex, setSelectedIndex] = createSignal(-1);

	const hasMatches = () => matches().length > 0;

	const visibleOffset = createMemo(() => {
		const idx = selectedIndex();
		if (idx < 0) return 0;
		return Math.max(0, idx - VISIBLE_ROWS + 1);
	});

	const visibleMatches = createMemo(() =>
		matches().slice(visibleOffset(), visibleOffset() + VISIBLE_ROWS),
	);

	createEffect(() => {
		const query = path();
		let cancelled = false;

		const trimmed = query.trim();
		if (!trimmed) {
			setMatches([]);
			setSearching(false);
			setSelectedIndex(-1);
			return;
		}

		setSearching(true);

		const timer = setTimeout(async () => {
			try {
				const results = await searchFiles({
					query: trimmed,
					resolveDir: workingDir,
					scope: "drive",
				});
				if (cancelled) return;
				setMatches(results);
				setSelectedIndex(results.length > 0 ? 0 : -1);
			} finally {
				if (!cancelled) setSearching(false);
			}
		}, SEARCH_DEBOUNCE_MS);

		onCleanup(() => {
			cancelled = true;
			clearTimeout(timer);
		});
	});

	async function confirm(): Promise<void> {
		const match = matches()[selectedIndex()];
		const value = (match ?? path()).trim();
		if (!value) return;
		await props.onAttach(value);
	}

	useKeyboard((e) => {
		if (e.name === "escape") {
			props.onCancel();
			return;
		}
		if (hasMatches()) {
			if (e.name === "down") {
				setSelectedIndex((i) => clamp(i + 1, 0, matches().length - 1));
				return;
			}
			if (e.name === "up") {
				setSelectedIndex((i) => moveIndex(i, -1, matches().length));
				return;
			}
		}
		if (e.name === "return" || e.name === "enter") {
			void confirm();
		}
	});

	return (
		<box flexDirection="column" paddingTop={1} paddingBottom={1} rowGap={1}>
			<text fg={t().textDim} attributes={TextAttributes.BOLD}>
				Working directory
			</text>
			<text fg={t().text}>{workingDir}</text>

			<text fg={t().border}>{"─".repeat(94)}</text>

			<text fg={t().textDim} attributes={TextAttributes.BOLD}>
				File path
			</text>
			<box flexDirection="row" height={1}>
				<input
					value={path()}
					onInput={setPath}
					placeholder="type to search or enter a path"
					focused
					backgroundColor={t().surface}
					focusedBackgroundColor={t().selBg}
					textColor={t().text}
					focusedTextColor={t().text}
					cursorColor={t().accent}
					placeholderColor={t().textDim}
					flexGrow={1}
				/>
			</box>

			<text fg={t().textDim}>
				Search uses Spotlight (macOS) or locate (Linux) plus a filesystem walk of your home
				folder and mounted volumes. Relative attach paths resolve from the working directory.
			</text>

			<Show when={path().trim()}>
				<text fg={t().border}>{"─".repeat(94)}</text>

				<box flexDirection="row" flexShrink={0} height={1}>
					<text fg={t().textDim} attributes={TextAttributes.BOLD} flexGrow={1}>
						Matching files
					</text>
					<Show when={!searching()}>
						<text fg={t().textDim}>
							{matches().length} match{matches().length === 1 ? "" : "es"}
						</text>
					</Show>
				</box>

				<Show
					when={searching()}
					fallback={
						<Show
							when={hasMatches()}
							fallback={
								<box flexDirection="column" height={VISIBLE_ROWS}>
									<text fg={t().textDim}>─── no matching files ───</text>
								</box>
							}
						>
							<box flexDirection="column">
								<For each={visibleMatches()}>
									{(match, i) => {
										const absoluteIndex = () => visibleOffset() + i();
										const sel = () => selectedIndex() === absoluteIndex();
										return (
											<SelectableRow selected={sel()}>
												<text
													fg={sel() ? t().selFg : t().text}
													attributes={sel() ? TextAttributes.BOLD : 0}
												>
													{match}
												</text>
											</SelectableRow>
										);
									}}
								</For>
							</box>
						</Show>
					}
				>
					<SearchingState />
				</Show>
			</Show>

			<box flexDirection="row" paddingTop={1} columnGap={2}>
				<KeyPill k="↑↓" label="select" />
				<KeyPill k="↵" label="attach" />
				<KeyPill k="esc" label="cancel" />
			</box>
		</box>
	);
}
