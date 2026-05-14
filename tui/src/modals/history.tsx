// Request history modal — full list of past requests with status, time, etc.

import { For, createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { Pane } from "../components/pane";
import { KeyPill } from "../components/key-pill";
import { Scrim } from "../components/scrim";
import { MethodTag } from "../components/method-tag";
import { SelectableRow } from "../components/selectable-row";
import { HISTORY } from "../data/history";
import { moveIndex } from "../keyboard/helpers";
import { closeModal, theme } from "../state/store";
import { httpStatusColor } from "../utils/http-status";

export function HistoryModal() {
	const t = () => theme();
	const [idx, setIdx] = createSignal(0);

	useKeyboard((e) => {
		if (e.name === "escape") return closeModal();
		if (e.name === "down" || e.name === "j") {
			setIdx((i) => moveIndex(i, 1, HISTORY.length));
			return;
		}
		if (e.name === "up" || e.name === "k") {
			setIdx((i) => moveIndex(i, -1, HISTORY.length));
		}
	});

	return (
		<Scrim>
			<box width={108}>
				<Pane title="request history" accent>
					<box flexDirection="column" rowGap={0} paddingTop={1} paddingBottom={1}>
						{/* Header */}
						<box flexDirection="row" columnGap={2}>
							<text fg={t().textDim} width={2}>
								{" "}
							</text>
							<text fg={t().textDim} attributes={TextAttributes.BOLD} width={9}>
								WHEN
							</text>
							<text fg={t().textDim} attributes={TextAttributes.BOLD} width={8}>
								METHOD
							</text>
							<text fg={t().textDim} attributes={TextAttributes.BOLD} flexGrow={1}>
								URL
							</text>
							<text fg={t().textDim} attributes={TextAttributes.BOLD} width={8}>
								STATUS
							</text>
							<text fg={t().textDim} attributes={TextAttributes.BOLD} width={8}>
								TIME
							</text>
						</box>
						<text fg={t().border}>{"─".repeat(102)}</text>

						<For each={HISTORY}>
							{(h, i) => {
								const sel = () => i() === idx();
								return (
									<SelectableRow selected={sel()} columnGap={2}>
										<text fg={t().textDim} width={9}>
											{h.when}
										</text>
										<box width={8}>
											<text>
												<MethodTag method={h.method} />
											</text>
										</box>
										<text fg={sel() ? t().selFg : t().text} flexGrow={1}>
											{h.url}
										</text>
										<text
											fg={httpStatusColor(h.status, t())}
											attributes={TextAttributes.BOLD}
											width={8}
										>
											{String(h.status)}
										</text>
										<text fg={t().textDim} width={8}>
											{h.timeMs}ms
										</text>
									</SelectableRow>
								);
							}}
						</For>

						<box flexDirection="row" paddingTop={1} columnGap={2}>
							<KeyPill k="↑↓" label="navigate" />
							<KeyPill k="↵" label="replay" />
							<KeyPill k="s" label="save" />
							<KeyPill k="esc" label="close" />
						</box>
					</box>
				</Pane>
			</box>
		</Scrim>
	);
}
