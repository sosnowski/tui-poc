import { For, createMemo } from "solid-js";
import { TextAttributes } from "@opentui/core";

import { S } from "../../components/styled-span";
import {
	activeRequestId,
	activeRequestPresetNames,
	getActivePresetName,
	presetsCursor,
	theme,
} from "../../state/store";
import { KeyHintStrip } from "../../components/key-hint-strip";
import { PRESETS_HINTS } from "../../keyboard/keybindings";

const SIDEBAR_WIDTH = 30;

export function PresetsSidebarHeader() {
	const t = () => theme();
	return (
		<box flexDirection="row" height={1} width={SIDEBAR_WIDTH}>
			<text fg={t().textDim} attributes={TextAttributes.DIM}>
				PRESETS
			</text>
			<box flexGrow={1} />
			<text>
				<KeyCap k="esc" />
				<S fg={t().textDim}> CLOSE</S>
			</text>
		</box>
	);
}

export function PresetsChip() {
	const t = () => theme();
	const names = createMemo(() => activeRequestPresetNames());
	const activeName = () => getActivePresetName(activeRequestId());

	return (
		<box flexDirection="row" columnGap={1} alignItems="center" height={1}>
			<text fg={t().accent} attributes={TextAttributes.DIM}>
				{"preset:" + activeName()}
			</text>
			{names().length > 1 ? <text fg={t().textDim}>{names().length}</text> : null}
		</box>
	);
}

export function PresetsSidebar() {
	const t = () => theme();
	const names = createMemo(() => activeRequestPresetNames());
	const activeName = () => getActivePresetName(activeRequestId());
	const cursor = () => presetsCursor();
	const clampedCursor = createMemo(() => Math.max(0, Math.min(cursor(), names().length - 1)));

	return (
		<box
			flexDirection="column"
			width={SIDEBAR_WIDTH}
			flexShrink={0}
			paddingLeft={0}
			paddingRight={0}
			paddingTop={0}
			paddingBottom={0}
			border={["right"]}
			borderStyle="single"
			borderColor={t().border}
		>
			<box
				flexDirection="row"
				height={1}
				paddingLeft={1}
				paddingRight={1}
				alignItems="center"
			>
				<text fg={t().textDim} attributes={TextAttributes.DIM}>
					PRESETS
				</text>
			</box>
			<box flexDirection="column" flexShrink={0} paddingTop={1}>
				<For each={names()}>
					{(name, i) => {
						const isActive = () => name === activeName();
						const isHighlighted = () => i() === clampedCursor();
						return (
							<box
								flexDirection="row"
								height={1}
								paddingLeft={1}
								paddingRight={1}
								backgroundColor={isHighlighted() ? t().accentBg : undefined}
							>
								<text fg={t().accent} width={3}>
									{isActive() || isHighlighted() ? "◆" : "◇"}
								</text>
								<text
									fg={isHighlighted() ? t().accent : t().text}
									attributes={isHighlighted() ? 0 : TextAttributes.BOLD}
								>
									{name}
								</text>
							</box>
						);
					}}
				</For>

			</box>

			<box flexGrow={1} />

			<KeyHintStrip items={PRESETS_HINTS} />
		</box>
	);
}

function KeyCap(props: { k: string }) {
	const t = () => theme();
	return (
		<S fg={t().text} bg={t().bg2} bold>
			{` ${props.k} `}
		</S>
	);
}
