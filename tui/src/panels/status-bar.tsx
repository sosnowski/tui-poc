// Bottom-of-screen status bar (vim-style):
// [MODE] · ◆ env │ pane │ request          [contextual key pills, driven by the
// keyboard scope registry — re-rendered live as focus / mode changes]

import { For } from "solid-js";
import { TextAttributes } from "@opentui/core";

import { S } from "../components/styled-span";
import { KeyPill } from "../components/key-pill";
import { activeHints } from "../keyboard/registry";
import { activeEnv, activeRequest, focusedPane, theme } from "../state/store";

export function StatusBar() {
	const t = () => theme();
	return (
		<box
			flexDirection="row"
			height={1}
			paddingLeft={1}
			paddingRight={1}
			backgroundColor={t().bg2}
			columnGap={1}
		>
			<text fg={t().bg2} bg={t().accent} attributes={TextAttributes.BOLD}>
				{" NORMAL "}
			</text>

			<text fg={t().border2}>│</text>

			<box flexGrow={1} />

			<For each={activeHints()}>
				{(h) =>
					h === "-" ? (
						<text attributes={TextAttributes.DIM}>│</text>
					) : (
						<KeyPill k={h.k} label={h.label} />
					)
				}
			</For>
		</box>
	);
}
