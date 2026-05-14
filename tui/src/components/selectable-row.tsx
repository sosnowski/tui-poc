import { TextAttributes } from "@opentui/core";
import type { JSX } from "@opentui/solid";

import { theme } from "../state/store";

export function SelectableRow(props: {
	selected: boolean;
	marker?: string;
	markerWidth?: number;
	columnGap?: number;
	children: JSX.Element;
}) {
	const t = () => theme();

	return (
		<box
			flexDirection="row"
			flexShrink={0}
			height={1}
			columnGap={props.columnGap}
			backgroundColor={props.selected ? t().selBg : undefined}
		>
			<text
				fg={t().accent}
				attributes={TextAttributes.BOLD}
				width={props.markerWidth ?? 2}
			>
				{props.selected ? (props.marker ?? "▸") : " "}
			</text>
			{props.children}
		</box>
	);
}
