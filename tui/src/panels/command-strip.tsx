// Always-visible "/ type a command…" hint strip. Pressing `/` (or `Cmd+K`)
// opens the full command palette modal.

import { TextAttributes } from "@opentui/core";

import { S } from "../components/styled-span";
import { COMMANDS } from "../data";
import { theme } from "../state/store";

export function CommandStrip() {
	const t = () => theme();
	return (
		<box
			flexDirection="row"
			height={1}
			paddingLeft={1}
			paddingRight={1}
			backgroundColor={t().bg}
		>
			<text fg={t().accent} attributes={TextAttributes.BOLD}>
				/{" "}
			</text>
			<text fg={t().textDim}>
				type a command, or press{" "}
				<S fg={t().text2} bold>
					⌘K
				</S>{" "}
				for the palette
			</text>
			<box flexGrow={1} />
			<text fg={t().textDim}>─ {COMMANDS.length} commands available</text>
		</box>
	);
}
