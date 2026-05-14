import { For, createMemo, createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { KeyPill } from "../components/key-pill";
import { Pane } from "../components/pane";
import { Scrim } from "../components/scrim";
import { S } from "../components/styled-span";
import { SelectableRow } from "../components/selectable-row";
import { moveIndex } from "../keyboard/helpers";
import type { Collection } from "../data/types";
import { addCollection, closeModal, collections, pushToast, theme } from "../state/store";

interface ParentOption {
	id: string | null;
	label: string;
	depth: number;
}

function buildOptions(nodes: Collection[], depth: number, out: ParentOption[]): void {
	for (const n of nodes) {
		out.push({ id: n.id, label: n.name, depth });
		buildOptions(n.children, depth + 1, out);
	}
}

export function NewCollectionModal() {
	const t = () => theme();
	const [name, setName] = createSignal("");
	const [focus, setFocus] = createSignal<"name" | "parent">("name");
	const [parentIdx, setParentIdx] = createSignal(0);

	const [inputReady, setInputReady] = createSignal(false);
	queueMicrotask(() => setInputReady(true));

	const parentOptions = createMemo<ParentOption[]>(() => {
		const out: ParentOption[] = [{ id: null, label: "(root)", depth: 0 }];
		buildOptions(collections(), 0, out);
		return out;
	});

	function selectedDescription(): string {
		const opt = parentOptions()[parentIdx()];
		if (!opt || opt.id === null) return "top-level collection";
		return `sub-collection inside "${opt.label}"`;
	}

	function confirm(): void {
		const trimmed = name().trim();
		if (!trimmed) {
			pushToast("name cannot be empty", "err");
			return;
		}
		const opt = parentOptions()[parentIdx()]!;
		addCollection(trimmed, opt.id);
		closeModal();
	}

	useKeyboard((e) => {
		if (e.name === "escape") return closeModal();

		if (e.name === "tab") {
			setFocus((f) => (f === "name" ? "parent" : "name"));
			return;
		}

		if (e.name === "return" || e.name === "enter") {
			if (focus() === "name") {
				setFocus("parent");
			} else {
				confirm();
			}
			return;
		}

		if (focus() === "parent") {
			if (e.name === "up" || e.name === "k") {
				setParentIdx((i) => moveIndex(i, -1, parentOptions().length));
			} else if (e.name === "down" || e.name === "j") {
				setParentIdx((i) => moveIndex(i, 1, parentOptions().length));
			}
		}
	});

	const inputFocused = () => inputReady() && focus() === "name";

	return (
		<Scrim>
			<box width={50}>
				<Pane title="new collection" accent>
					<box flexDirection="column" paddingTop={1} paddingBottom={1} rowGap={1}>
						<text fg={t().textDim} attributes={TextAttributes.BOLD}>
							Name
						</text>
						<box flexDirection="row" height={1}>
							<input
								value={name()}
								onInput={setName}
								placeholder="collection name…"
								focused={inputFocused()}
								backgroundColor={inputFocused() ? t().selBg : t().surface}
								focusedBackgroundColor={t().selBg}
								textColor={t().text}
								focusedTextColor={t().text}
								cursorColor={t().accent}
								placeholderColor={t().textDim}
								flexGrow={1}
							/>
						</box>

						<text fg={t().border}>{"─".repeat(44)}</text>

						<text fg={t().textDim} attributes={TextAttributes.BOLD}>
							Parent
						</text>
						<box flexDirection="column">
							<For each={parentOptions()}>
								{(opt, i) => {
									const sel = () => focus() === "parent" && i() === parentIdx();
									const isRoot = () => opt.id === null;
									const indent = () => "  ".repeat(opt.depth);
									return (
										<SelectableRow selected={sel()}>
											<text
												fg={
													sel()
														? t().selFg
														: isRoot()
															? t().text
															: t().accent
												}
												attributes={
													sel() || isRoot()
														? TextAttributes.BOLD
														: 0
												}
											>
												{indent()}
												{isRoot() ? "  " : "■ "}
												{opt.label}
											</text>
										</SelectableRow>
									);
								}}
							</For>
						</box>

						<text fg={t().textDim}>
							<S fg={t().accent}>→</S> {selectedDescription()}
						</text>

						<box flexDirection="row" paddingTop={1} columnGap={2}>
							<KeyPill k="tab" label="switch" />
							<KeyPill k="↑↓" label="select parent" />
							<KeyPill k="↵" label="confirm" />
							<KeyPill k="esc" label="cancel" />
						</box>
					</box>
				</Pane>
			</box>
		</Scrim>
	);
}
