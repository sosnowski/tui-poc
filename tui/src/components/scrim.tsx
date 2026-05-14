// Modal scrim/backdrop. Renders a translucent fill underneath modal content.
// Because OpenTUI doesn't support opacity blending we just paint a solid bg
// in the theme's "bg2" color which approximates the dim effect of the POC.

import type { JSX } from "@opentui/solid";

import { theme } from "../state/store";

interface Props {
	/** Where the modal should live within the viewport. Defaults to centered. */
	align?: "center" | "top";
	children?: JSX.Element;
}

export function Scrim(props: Props) {
	const align = props.align ?? "center";
	return (
		<box
			position="absolute"
			top={0}
			left={0}
			right={0}
			bottom={0}
			zIndex={100}
			backgroundColor={theme().bg2}
			flexDirection="column"
			alignItems="center"
			justifyContent={align === "center" ? "center" : "flex-start"}
			paddingTop={align === "top" ? 4 : 0}
		>
			{props.children}
		</box>
	);
}
