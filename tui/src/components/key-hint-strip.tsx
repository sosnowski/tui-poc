import { For, Show } from "solid-js";

import type { KeyHint } from "../keyboard/keybindings";
import { theme } from "../state/store";
import { S } from "./styled-span";

export function KeyHintStrip(props: { items: KeyHint[] }) {
	const t = () => theme();

	return (
		<box flexDirection="row" flexShrink={0} height={1}>
			<text fg={t().textDim}>{"  ── "}</text>
			<text>
				<For each={props.items}>
					{(it, i) => (
						<>
							<Show when={i() !== 0}>
								<S fg={t().textDim}> · </S>
							</Show>
							<S fg={t().accent} bold>
								{it.k}
							</S>
							<S fg={t().textDim}> {it.label}</S>
						</>
					)}
				</For>
			</text>
			<text fg={t().textDim}>{" ──"}</text>
		</box>
	);
}
