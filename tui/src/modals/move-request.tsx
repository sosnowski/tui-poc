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
import {
	closeModal,
	collections,
	moveRequest,
	moveRequestId,
	theme,
} from "../state/store";

interface TargetOption {
	id: string;
	label: string;
	depth: number;
}

function buildOptions(nodes: Collection[], depth: number, out: TargetOption[]): void {
	for (const n of nodes) {
		out.push({ id: n.id, label: n.name, depth });
		buildOptions(n.children, depth + 1, out);
	}
}

function findRequestName(nodes: Collection[], id: string): string | undefined {
	for (const n of nodes) {
		const r = n.requests.find((req) => req.id === id);
		if (r) return r.name;
		const deep = findRequestName(n.children, id);
		if (deep) return deep;
	}
	return undefined;
}

export function MoveRequestModal() {
	const t = () => theme();
	const [idx, setIdx] = createSignal(0);

	const reqName = createMemo(() => {
		const id = moveRequestId();
		if (!id) return "?";
		return findRequestName(collections(), id) ?? id;
	});

	const options = createMemo<TargetOption[]>(() => {
		const out: TargetOption[] = [];
		buildOptions(collections(), 0, out);
		return out;
	});

	function confirm(): void {
		const opt = options()[idx()];
		if (!opt) return;
		moveRequest(opt.id);
		closeModal();
	}

	useKeyboard((e) => {
		if (e.name === "escape") return closeModal();
		if (e.name === "up" || e.name === "k") {
			setIdx((i) => moveIndex(i, -1, options().length));
			return;
		}
		if (e.name === "down" || e.name === "j") {
			setIdx((i) => moveIndex(i, 1, options().length));
			return;
		}
		if (e.name === "return" || e.name === "enter") {
			confirm();
		}
	});

	return (
		<Scrim>
			<box width={50}>
				<Pane title="move request" accent>
					<box flexDirection="column" paddingTop={1} paddingBottom={1} rowGap={1}>
						<text fg={t().textDim}>
							Moving <S fg={t().text} bold>{reqName()}</S>
						</text>

						<text fg={t().border}>{"─".repeat(44)}</text>

						<text fg={t().textDim} attributes={TextAttributes.BOLD}>
							Target collection
						</text>
						<box flexDirection="column">
							<For each={options()}>
								{(opt, i) => {
									const sel = () => i() === idx();
									const indent = () => "  ".repeat(opt.depth);
									return (
										<SelectableRow selected={sel()}>
											<text
												fg={sel() ? t().selFg : t().accent}
												attributes={sel() ? TextAttributes.BOLD : 0}
											>
												{indent()}■ {opt.label}
											</text>
										</SelectableRow>
									);
								}}
							</For>
						</box>

						<text fg={t().textDim}>
							<S fg={t().accent}>→</S> move to "{options()[idx()]?.label}"
						</text>

						<box flexDirection="row" paddingTop={1} columnGap={2}>
							<KeyPill k="↑↓" label="select" />
							<KeyPill k="↵" label="confirm" />
							<KeyPill k="esc" label="cancel" />
						</box>
					</box>
				</Pane>
			</box>
		</Scrim>
	);
}
