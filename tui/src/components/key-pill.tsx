// Compact "[k] label" hint pair shown in the status bar / modal footers.

import { S } from "./styled-span";
import { theme } from "../state/store";

export function KeyPill(props: { k: string; label: string }) {
	const t = theme();
	return (
		<text>
			<S fg={t.accent} bold>
				{props.k}
			</S>
			<S fg={t.textDim}> {props.label} </S>
		</text>
	);
}
