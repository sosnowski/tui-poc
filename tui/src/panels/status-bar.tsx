// Bottom-of-screen status bar (vim-style):
// [MODE] · ◆ env │ pane │ request          [/cmd] [e env] [h hist] [⌘↵ send] [q quit]

import { For } from "solid-js";
import { TextAttributes } from "@opentui/core";

import { S } from "../components/styled-span";
import { KeyPill } from "../components/key-pill";
import { GLOBAL_HINTS } from "../keyboard/keybindings";
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
			{/* Mode chip */}
			<text fg={t().bg2} bg={t().accent} attributes={TextAttributes.BOLD}>
				{" NORMAL "}
			</text>

			{/* Env */}
			<text>
				<S fg={t().accent}>◆ </S>
				<S fg={t().text}>{activeEnv().name.toLowerCase()}</S>
			</text>

			<text fg={t().border2}>│</text>

			<text>
				<S fg={t().textDim}>pane </S>
				<S fg={t().text}>{focusedPane()}</S>
			</text>

			<text fg={t().border2}>│</text>

			<text>
				<S fg={t().textDim}>request </S>
				<S fg={t().accent}>
					{activeRequest().url.replace("{{base_url}}", "").replace(/^\//, "") || "/"}
				</S>
			</text>

			{/* Spacer pushes the keypills to the right edge */}
			<box flexGrow={1} />

			<For each={GLOBAL_HINTS}>{(h) => <KeyPill k={h.k} label={h.label} />}</For>
		</box>
	);
}
