// Top-of-screen title bar.
// Shows the right-aligned "tui-postman · <env>" label.

import { TextAttributes } from "@opentui/core";

import { activeEnv, theme } from "../state/store";

export function TitleBar() {
	const t = () => theme();
	return (
		<box
			flexDirection="row"
			height={1}
			paddingLeft={1}
			paddingRight={1}
			backgroundColor={t().bg2}
		>
			<box flexGrow={1} />
			<text fg={t().textDim} paddingRight={1}>
				tui-postman
			</text>
			<text fg={t().accent} attributes={TextAttributes.BOLD}>
				{activeEnv().name.toLowerCase()}
			</text>
		</box>
	);
}
