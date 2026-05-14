import { createMemo, createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { KeyPill } from "../components/key-pill";
import { Pane } from "../components/pane";
import { Scrim } from "../components/scrim";
import { S } from "../components/styled-span";
import { SelectableRow } from "../components/selectable-row";
import type { Collection } from "../data/types";
import {
	closeModal,
	collections,
	deleteRequest,
	deleteRequestId,
	theme,
} from "../state/store";

function findRequestName(nodes: Collection[], id: string): string | undefined {
	for (const n of nodes) {
		const r = n.requests.find((req) => req.id === id);
		if (r) return r.name;
		const deep = findRequestName(n.children, id);
		if (deep) return deep;
	}
	return undefined;
}

export function DeleteConfirmModal() {
	const t = () => theme();
	const [selected, setSelected] = createSignal<"cancel" | "delete">("cancel");

	const reqName = createMemo(() => {
		const id = deleteRequestId();
		if (!id) return "?";
		return findRequestName(collections(), id) ?? id;
	});

	function confirm(): void {
		if (selected() === "delete") {
			deleteRequest();
		}
		closeModal();
	}

	useKeyboard((e) => {
		if (e.name === "escape") return closeModal();
		if (e.name === "left" || e.name === "right" || e.name === "tab") {
			setSelected((s) => (s === "cancel" ? "delete" : "cancel"));
			return;
		}
		if (e.name === "return" || e.name === "enter") {
			confirm();
			return;
		}
	});

	return (
		<Scrim>
			<box width={46}>
				<Pane title="delete request" accent>
					<box flexDirection="column" paddingTop={1} paddingBottom={1} rowGap={1}>
						<text fg={t().textDim}>
							Delete <S fg={t().text} bold>{reqName()}</S>?
						</text>
						<text fg={t().textDim}>This action cannot be undone.</text>

						<text fg={t().border}>{"─".repeat(40)}</text>

						<box flexDirection="row" columnGap={2}>
							<SelectableRow selected={selected() === "cancel"}>
								<text
									fg={selected() === "cancel" ? t().selFg : t().text}
									attributes={selected() === "cancel" ? TextAttributes.BOLD : 0}
								>
									{" Cancel "}
								</text>
							</SelectableRow>
							<SelectableRow selected={selected() === "delete"}>
								<text
									fg={selected() === "delete" ? t().selFg : t().err}
									attributes={TextAttributes.BOLD}
								>
									{" Delete "}
								</text>
							</SelectableRow>
						</box>

						<box flexDirection="row" paddingTop={1} columnGap={2}>
							<KeyPill k="←→" label="select" />
							<KeyPill k="↵" label="confirm" />
							<KeyPill k="esc" label="cancel" />
						</box>
					</box>
				</Pane>
			</box>
		</Scrim>
	);
}
