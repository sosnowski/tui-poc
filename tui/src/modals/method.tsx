// HTTP method picker modal. Opened from the request editor with `m`.

import { For, createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { KeyPill } from "../components/key-pill";
import { MethodChip } from "../components/method-tag";
import { Pane } from "../components/pane";
import { Scrim } from "../components/scrim";
import { HTTP_METHODS } from "../data/types";
import { moveIndex } from "../keyboard/helpers";
import {
	activeRequest,
	closeModal,
	createNewRequest,
	modal,
	setActiveRequestMethod,
	setEditing,
	setFocusedPane,
	theme,
} from "../state/store";

export function MethodModal() {
	const t = () => theme();
	const isNewRequest = () => modal() === "newMethod";
	const initial = isNewRequest() ? 0 : Math.max(0, HTTP_METHODS.indexOf(activeRequest().method));
	const [idx, setIdx] = createSignal(initial);

	function move(delta: 1 | -1): void {
		setIdx((i) => moveIndex(i, delta, HTTP_METHODS.length));
	}

	function selectCurrent(): void {
		const method = HTTP_METHODS[idx()];
		if (!method) return;

		if (isNewRequest()) {
			createNewRequest(method);
			closeModal();
			setFocusedPane("editor");
			queueMicrotask(() => {
				setEditing({ tab: "Url", row: 0, col: 0, draft: "", cursor: 0 });
			});
			return;
		}

		setActiveRequestMethod(method);
		closeModal();
	}

	useKeyboard((e) => {
		if (e.name === "escape") return closeModal();
		if (e.name === "left" || e.name === "up" || e.name === "h" || e.name === "k") {
			move(-1);
			return;
		}
		if (e.name === "right" || e.name === "down" || e.name === "l" || e.name === "j") {
			move(1);
			return;
		}
		if (e.name === "return") {
			selectCurrent();
		}
	});

	return (
		<Scrim>
			<box>
				<Pane title={isNewRequest() ? "new request" : "change method"} accent>
					<box flexDirection="column" paddingTop={1} paddingBottom={1} rowGap={1}>
						<text fg={t().textDim} attributes={TextAttributes.BOLD}>
							Select HTTP method
						</text>

						<box
							flexDirection="row"
							columnGap={1}
							alignItems="center"
							justifyContent="center"
						>
							<For each={HTTP_METHODS}>
								{(method, i) => {
									const selected = () => i() === idx();
									return (
										<box
											flexDirection="column"
											backgroundColor={selected() ? t().selBg : undefined}
										>
											<MethodChip method={method} bare />
											<text
												fg={selected() ? t().accent : t().textDim}
												attributes={selected() ? TextAttributes.BOLD : 0}
											>
												{selected() ? "  ▲" : "   "}
											</text>
										</box>
									);
								}}
							</For>
						</box>

						<box flexDirection="row" columnGap={2}>
							<KeyPill k="←→/↑↓" label="select" />
							<KeyPill k="↵" label="confirm" />
							<KeyPill k="esc" label="close" />
						</box>
					</box>
				</Pane>
			</box>
		</Scrim>
	);
}
