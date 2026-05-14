// Bordered pane wrapper. Visualises focus by switching the border color and
// keeps the title styling consistent across the three main panels and modals.

import type { JSX } from "@opentui/solid";

import { theme } from "../state/store";

interface Props {
	title?: string;
	/** When true, paint the border in the accent / focus color. */
	focused?: boolean;
	/** When true, force the accent border (used by modals). */
	accent?: boolean;
	/** Optional bottom-anchored title (shown on the bottom border, like tmux). */
	bottomTitle?: string;
	width?: number | "auto" | `${number}%`;
	height?: number | "auto" | `${number}%`;
	padding?: number;
	paddingRight?: number;
	paddingLeft?: number;
	paddingTop?: number;
	paddingBottom?: number;
	flexGrow?: number;
	flexShrink?: number;
	flexBasis?: number | "auto";
	children?: JSX.Element;
}

export function Pane(props: Props) {
	const t = () => theme();
	// We compute borderColor reactively so the user sees the focus halo
	// change instantly when they Tab between panes.
	const borderColor = () => {
		if (props.accent) return t().accent;
		if (props.focused) return t().borderFocus;
		return t().border;
	};

	return (
		<box
			title={props.title}
			titleAlignment="left"
			bottomTitle={props.bottomTitle}
			bottomTitleAlignment="right"
			border
			borderStyle="single"
			borderColor={borderColor()}
			backgroundColor={t().surface}
			flexDirection="column"
			flexGrow={props.flexGrow ?? 0}
			flexShrink={props.flexShrink ?? 1}
			flexBasis={props.flexBasis ?? "auto"}
			width={props.width}
			height={props.height}
			paddingLeft={props.paddingLeft ?? props.padding ?? 1}
			paddingRight={props.paddingRight ?? props.padding ?? 1}
			paddingTop={props.paddingTop ?? props.padding ?? 0}
			paddingBottom={props.paddingBottom ?? props.padding ?? 0}
			overflow="hidden"
		>
			{props.children}
		</box>
	);
}
