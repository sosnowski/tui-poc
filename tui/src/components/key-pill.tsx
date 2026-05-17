// Compact "[k] label" hint pair shown in the status bar / modal footers.
//
// Renders as "KEY label" with no trailing whitespace — the surrounding
// container is responsible for spacing between adjacent pills (we use
// `columnGap` in the status bar). Keeping the pill self-contained makes the
// hint strip predictable when bindings come and go reactively.

import { S } from "./styled-span";
import { theme } from "../state/store";

export function KeyPill(props: { k: string; label: string }) {
	const t = theme();
	return (
		<text>
			<S fg={t.accent} bold>
				{props.k}
			</S>
			<S fg={t.textDim}> {props.label}</S>
		</text>
	);
}
