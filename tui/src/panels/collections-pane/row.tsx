// Highlightable row primitive used by every entry in the collections pane.
// Centralises the "what does the cursor look like?" decision and the click
// handler wiring so per-row components only have to think about their own
// content.

import type { JSX } from "@opentui/solid";

import { theme } from "../../state/store";

interface RowProps {
	cursor: boolean;
	onMouseDown?: () => void;
	children?: JSX.Element;
}

export function Row(props: RowProps) {
	const t = () => theme();
	return (
		<box
			flexDirection="row"
			flexShrink={0}
			height={1}
			backgroundColor={props.cursor ? t().selBg : undefined}
			onMouseDown={props.onMouseDown}
		>
			{props.children}
		</box>
	);
}
