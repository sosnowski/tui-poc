// Environment manager modal — left column lists envs, right column shows
// the selected env's variables. Enter activates envs or toggles variable edit mode.

import { For, createEffect, createMemo, createSignal } from "solid-js";
import { useKeyboard, type JSX } from "@opentui/solid";
import { TextAttributes, type KeyEvent } from "@opentui/core";

import { Pane } from "../components/pane";
import { Scrim } from "../components/scrim";
import { KeyPill } from "../components/key-pill";
import { InlineInput } from "../components/inline-input";
import { S } from "../components/styled-span";
import { clamp, moveIndex } from "../keyboard/helpers";
import { blendHex } from "../utils/color";
import {
	activateEnvironment,
	closeModal,
	environments,
	setEnvironmentVariableCell,
	theme,
} from "../state/store";

const MAX_VISIBLE_VARIABLES = 12;
type FocusArea = "environments" | "variables";
type VarCursor = { row: number; col: 0 | 1 };
type EditingVariable = { row: number; col: 0 | 1; draft: string } | null;

export function EnvironmentManager() {
	const t = () => theme();

	const [selectedId, setSelectedId] = createSignal(
		environments().find((e) => e.active)?.id ?? environments()[0]!.id,
	);
	const [focusArea, setFocusArea] = createSignal<FocusArea>("environments");
	const [varCursor, setVarCursor] = createSignal<VarCursor>({ row: 0, col: 0 });
	const [varOffset, setVarOffset] = createSignal(0);
	const [editingVariable, setEditingVariable] = createSignal<EditingVariable>(null);

	const env = () => environments().find((e) => e.id === selectedId()) ?? environments()[0]!;
	const visibleVarRows = createMemo(() => {
		const tallestEnvVarCount = Math.max(0, ...environments().map((e) => e.vars.length));
		return Math.max(1, Math.min(MAX_VISIBLE_VARIABLES, tallestEnvVarCount));
	});
	const maxVarOffset = createMemo(() => Math.max(0, env().vars.length - visibleVarRows()));
	const visibleVars = createMemo(() =>
		env().vars.slice(varOffset(), varOffset() + visibleVarRows()),
	);
	const hasVarScroll = () => maxVarOffset() > 0;
	const activeCellBg = () => blendHex(t().surface, t().accent, 0.18);
	const bodyRows = createMemo(() => {
		const envListRows = 1 + 1 + environments().length + 1;
		const variableDetailsRows = 1 + 1 + 1 + visibleVarRows() + 1 + 1;
		return Math.max(envListRows, variableDetailsRows);
	});

	createEffect(() => {
		selectedId();
		setFocusArea("environments");
		setVarCursor({ row: 0, col: 0 });
		setVarOffset(0);
		setEditingVariable(null);
	});

	createEffect(() => {
		const maxRow = Math.max(0, env().vars.length - 1);
		setVarCursor((cursor) => ({ ...cursor, row: clamp(cursor.row, 0, maxRow) }));
		setVarOffset((offset) => Math.min(offset, maxVarOffset()));
	});

	function enterVariables(): void {
		if (env().vars.length === 0) return;
		setFocusArea("variables");
		ensureVarVisible(varCursor().row);
	}

	function ensureVarVisible(row: number): void {
		setVarOffset((offset) => {
			if (row < offset) return row;
			if (row >= offset + visibleVarRows()) return row - visibleVarRows() + 1;
			return Math.min(offset, maxVarOffset());
		});
	}

	function moveVarCursor(delta: number): void {
		const nextRow = clamp(varCursor().row + delta, 0, Math.max(0, env().vars.length - 1));
		setVarCursor((cursor) => ({ ...cursor, row: nextRow }));
		ensureVarVisible(nextRow);
	}

	function setVarCursorCol(col: 0 | 1): void {
		setVarCursor((cursor) => ({ ...cursor, col }));
	}

	function startEditingVariable(): void {
		const cursor = varCursor();
		const variable = env().vars[cursor.row];
		if (!variable) return;
		setEditingVariable({
			row: cursor.row,
			col: cursor.col,
			draft: cursor.col === 0 ? variable.key : variable.value,
		});
	}

	function commitEditingVariable(value: string): void {
		const current = editingVariable();
		if (!current) return;
		setEnvironmentVariableCell(env().id, current.row, current.col, value);
		setEditingVariable(null);
	}

	function updateEditingVariableDraft(value: string): void {
		const current = editingVariable();
		if (!current) return;
		setEditingVariable({ ...current, draft: value });
	}

	function handleVariableEditMode(e: KeyEvent): boolean {
		const current = editingVariable();
		if (!current) return false;

		if (e.name === "escape") {
			setEditingVariable(null);
			e.preventDefault();
			return true;
		}

		return false;
	}

	useKeyboard((e: KeyEvent) => {
		if (editingVariable() !== null) {
			handleVariableEditMode(e);
			return;
		}
		if (e.name === "escape") return closeModal();
		if (e.name === "pagedown") {
			if (focusArea() === "variables") {
				moveVarCursor(visibleVarRows());
			} else {
				setVarOffset((offset) => Math.min(offset + visibleVarRows(), maxVarOffset()));
			}
			return;
		}
		if (e.name === "pageup") {
			if (focusArea() === "variables") {
				moveVarCursor(-visibleVarRows());
			} else {
				setVarOffset((offset) => Math.max(0, offset - visibleVarRows()));
			}
			return;
		}

		if (focusArea() === "variables") {
			if (e.name === "tab") {
				setFocusArea("environments");
				return;
			}
			if (e.name === "down") {
				moveVarCursor(1);
				return;
			}
			if (e.name === "up") {
				moveVarCursor(-1);
				return;
			}
			if (e.name === "right") {
				setVarCursorCol(1);
				return;
			}
			if (e.name === "left") {
				if (varCursor().col === 0) {
					setFocusArea("environments");
				} else {
					setVarCursorCol(0);
				}
				return;
			}
			if (e.name === "return") {
				startEditingVariable();
				return;
			}
			return;
		}

		if (e.name === "tab" || e.name === "right") {
			enterVariables();
			return;
		}

		const list = environments();
		const cur = list.findIndex((x) => x.id === selectedId());
		if (e.name === "down" || e.name === "j") {
			setSelectedId(list[moveIndex(cur, 1, list.length)]!.id);
			return;
		}
		if (e.name === "up" || e.name === "k") {
			setSelectedId(list[moveIndex(cur, -1, list.length)]!.id);
			return;
		}
		if (e.name === "return") {
			activateEnvironment(env().id);
		}
	});

	return (
		<Scrim>
			<box width={110}>
				<Pane title="environment manager" accent>
					<box flexDirection="column" flexShrink={0}>
						<box flexShrink={0} height={1} />
						<box flexDirection="row" columnGap={2} height={bodyRows()} flexGrow={1}>
							{/* Env list (left) */}
							<box flexDirection="column" width={28} height={bodyRows()}>
								<text
									fg={t().textDim}
									attributes={TextAttributes.BOLD | TextAttributes.DIM}
								>
									ENVIRONMENTS
								</text>
								<text fg={t().border}>{"─".repeat(24)}</text>
								<For each={environments()}>
									{(e) => {
										const sel = () => e.id === selectedId();
										return (
											<box
												flexDirection="row"
												flexShrink={0}
												height={1}
												backgroundColor={sel() ? t().selBg : undefined}
											>
												<text fg={t().accent} width={3}>
													{e.active ? "◆" : "◇"}
												</text>
												<text
													fg={sel() ? t().selFg : t().text}
													attributes={sel() ? TextAttributes.BOLD : 0}
													flexGrow={1}
												>
													{e.name}
												</text>
												{e.active ? (
													<text
														fg={t().accent}
														attributes={TextAttributes.DIM}
													>
														active
													</text>
												) : null}
											</box>
										);
									}}
								</For>
								<text fg={t().textDim}>+ new environment…</text>
							</box>

							{/* Vertical divider */}
							<box width={1} height={bodyRows()}>
								<text fg={t().border}>│</text>
							</box>

							{/* Variables (right) */}
							<box flexDirection="column" flexGrow={1} height={bodyRows()}>
								<box flexDirection="row" flexShrink={0} height={1}>
									<text
										fg={t().textDim}
										attributes={TextAttributes.BOLD | TextAttributes.DIM}
									>
										VARIABLES IN
									</text>
									<text fg={t().accent} attributes={TextAttributes.BOLD}>
										{" "}
										{env().name}
									</text>
									<box flexGrow={1} />
									{hasVarScroll() ? (
										<text fg={t().textDim}>
											{varOffset() + 1}-{varOffset() + visibleVars().length}/
											{env().vars.length} · pgup/pgdn
										</text>
									) : null}
									{!env().active ? (
										<text fg={t().accent} attributes={TextAttributes.BOLD}>
											{" "}
											[ enter · activate ]
										</text>
									) : null}
								</box>

								{/* Variables table separator + header */}
								<text fg={t().border}>{"─".repeat(72)}</text>
								<box flexDirection="row" flexShrink={0} height={1}>
									<text
										fg={t().textDim}
										width={18}
										attributes={TextAttributes.BOLD}
									>
										KEY
									</text>
									<text
										fg={t().textDim}
										flexGrow={1}
										attributes={TextAttributes.BOLD}
									>
										VALUE
									</text>
									<text
										fg={t().textDim}
										width={10}
										attributes={TextAttributes.BOLD}
									>
										TYPE
									</text>
								</box>

								<box
									flexDirection="column"
									flexShrink={0}
									height={visibleVarRows()}
								>
									<For each={visibleVars()}>
										{(v, i) => {
											const row = () => varOffset() + i();
											const rowFocused = () =>
												focusArea() === "variables" &&
												varCursor().row === row();
											const cellFocused = (col: 0 | 1) =>
												rowFocused() && varCursor().col === col;
											const cellEditing = (col: 0 | 1) => {
												const current = editingVariable();
												return (
													current !== null &&
													current.row === row() &&
													current.col === col
												);
											};
											const cellBg = (col: 0 | 1) =>
												cellFocused(col)
													? activeCellBg()
													: rowFocused()
														? t().selBg
														: undefined;
											const cellFg = (col: 0 | 1, base: string) =>
												cellFocused(col)
													? t().accent
													: rowFocused()
														? t().selFg
														: base;
											const valueText = () =>
												v.secret && !cellFocused(1)
													? "●●●●●●●●●●●●●●●●●●"
													: v.value;
											return (
												<box flexDirection="row" flexShrink={0} height={1}>
													<VariableCell
														width={18}
														bg={cellBg(0)}
														fg={cellFg(0, t().text)}
														active={cellFocused(0)}
														raw={cellEditing(0)}
													>
														{cellEditing(0) ? (
															<InlineInput
																value={editingVariable()!.draft}
																width={18}
																bg={activeCellBg()}
																fg={t().accent}
																cursorColor={t().accent}
																onInput={updateEditingVariableDraft}
																onSubmit={commitEditingVariable}
															/>
														) : (
															v.key
														)}
													</VariableCell>
													<VariableCell
														flex
														bg={cellBg(1)}
														fg={cellFg(
															1,
															v.secret ? t().textDim : t().text,
														)}
														active={cellFocused(1)}
														raw={cellEditing(1)}
													>
														{cellEditing(1) ? (
															<InlineInput
																value={editingVariable()!.draft}
																flex
																bg={activeCellBg()}
																fg={t().accent}
																cursorColor={t().accent}
																onInput={updateEditingVariableDraft}
																onSubmit={commitEditingVariable}
															/>
														) : (
															valueText()
														)}
													</VariableCell>
													<box
														width={10}
														backgroundColor={
															rowFocused() ? t().selBg : undefined
														}
													>
														<text
															fg={
																rowFocused()
																	? t().selFg
																	: t().textDim
															}
														>
															{v.secret ? "secret" : "string"}
														</text>
													</box>
												</box>
											);
										}}
									</For>
								</box>

								<box flexShrink={0} height={1} />

								<box flexDirection="row" flexShrink={0} height={1}>
									<text fg={t().textDim}>+ add variable</text>
								</box>
							</box>
						</box>
						<box flexShrink={0} height={1} />
					</box>

					{/* Footer */}
					<box flexDirection="row" columnGap={2} paddingTop={1}>
						<KeyPill k="↑↓" label="env" />
						<KeyPill k="tab/→" label="vars" />
						<KeyPill k="←→↑↓" label="cell" />
						<KeyPill k="⏎" label="edit/save" />
						{hasVarScroll() ? <KeyPill k="pgup/pgdn" label="vars" /> : null}
						<KeyPill k="esc" label="cancel/close" />
					</box>
				</Pane>
			</box>
		</Scrim>
	);
}

function VariableCell(props: {
	children: JSX.Element;
	width?: number;
	flex?: boolean;
	bg?: string;
	fg: string;
	active: boolean;
	raw?: boolean;
}) {
	return (
		<box
			width={props.width}
			flexGrow={props.flex ? 1 : undefined}
			flexBasis={props.flex ? 0 : undefined}
			backgroundColor={props.bg}
		>
			{props.raw ? (
				props.children
			) : (
				<text fg={props.fg} attributes={props.active ? TextAttributes.BOLD : 0}>
					{props.children}
				</text>
			)}
		</box>
	);
}
