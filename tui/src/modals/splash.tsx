// Welcome / splash modal — the first thing the user sees on launch.
// Shows the ASCII logo, three columns of quick actions, and a dismiss hint.
// Press Enter (or any key) to dismiss.

import { Show } from "solid-js";
import { useKeyboard, useTerminalDimensions } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { S } from "../components/styled-span";
import { Scrim } from "../components/scrim";
import { closeModal, theme } from "../state/store";

const WIDE_LOGO = [
	"████████╗██╗   ██╗██╗    ██████╗  ██████╗ ███████╗████████╗███╗   ███╗ █████╗ ███╗   ██╗",
	"╚══██╔══╝██║   ██║██║    ██╔══██╗██╔═══██╗██╔════╝╚══██╔══╝████╗ ████║██╔══██╗████╗  ██║",
	"   ██║   ██║   ██║██║    ██████╔╝██║   ██║███████╗   ██║   ██╔████╔██║███████║██╔██╗ ██║",
	"   ██║   ██║   ██║██║    ██╔═══╝ ██║   ██║╚════██║   ██║   ██║╚██╔╝██║██╔══██║██║╚██╗██║",
	"   ██║   ╚██████╔╝██║    ██║     ╚██████╔╝███████║   ██║   ██║ ╚═╝ ██║██║  ██║██║ ╚████║",
	"   ╚═╝    ╚═════╝ ╚═╝    ╚═╝      ╚═════╝ ╚══════╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝",
];

const COMPACT_LOGO = ["TUI POSTMAN"];

export function Splash() {
	const t = () => theme();
	const dims = useTerminalDimensions();
	const compact = () => dims().width < 112;
	const panelWidth = () => Math.max(1, Math.min(88, dims().width - 4));

	// Any key dismisses the splash.
	useKeyboard(() => closeModal());

	return (
		<Scrim align="top">
			<box
				flexDirection="column"
				alignItems="center"
				rowGap={1}
				paddingTop={compact() ? 1 : 2}
			>
				<Logo compact={compact()} />

				<text fg={t().textDim} attributes={TextAttributes.DIM}>
					a postman in your terminal · v0.4.1
				</text>

				<SplashPanel compact={compact()} width={panelWidth()} />

				<text fg={t().textDim}>
					<S>press </S>
					<S fg={t().accent} bold>
						⏎
					</S>
					<S> to enter · </S>
					<S fg={t().accent} bold>
						esc
					</S>
					<S> to dismiss</S>
				</text>
			</box>
		</Scrim>
	);
}

function Logo(props: { compact: boolean }) {
	const t = () => theme();
	const lines = () => (props.compact ? COMPACT_LOGO : WIDE_LOGO);
	return (
		<box flexDirection="column" alignItems="center" rowGap={0}>
			{lines().map((line) => (
				<text fg={t().accent} attributes={TextAttributes.BOLD}>
					{line}
				</text>
			))}
		</box>
	);
}

function SplashPanel(props: { compact: boolean; width: number }) {
	const t = () => theme();
	return (
		<box
			border
			borderStyle="single"
			borderColor={t().border}
			backgroundColor={t().surface}
			flexDirection={props.compact ? "column" : "row"}
			width={props.width}
			paddingTop={1}
			paddingBottom={1}
			paddingLeft={props.compact ? 1 : 2}
			paddingRight={props.compact ? 1 : 2}
			columnGap={4}
		>
			<SplashCol head="START" underlineWidth={props.compact ? 14 : 20}>
				<SplashRow keyHint="⏎" label="open last collection" sub="JSONPlaceholder" />
				<SplashRow keyHint="n" label="new request" />
				<Show when={!props.compact}>
					<SplashRow keyHint="o" label="open collection from file…" />
					<SplashRow keyHint="i" label="import OpenAPI / Postman" />
				</Show>
			</SplashCol>

			<Show when={!props.compact}>
				<SplashCol head="RECENT" underlineWidth={20}>
					<text fg={t().textDim}>today · users/7</text>
					<text fg={t().textDim}>today · posts</text>
					<text fg={t().textDim}>y'day · auth/login</text>
					<text fg={t().textDim}>2d ago · billing/invoices</text>
				</SplashCol>
			</Show>

			<SplashCol head="HELP" underlineWidth={props.compact ? 14 : 20}>
				<SplashRow keyHint="/" label="command palette" />
				<SplashRow keyHint="?" label="keybinding cheatsheet" />
				<SplashRow keyHint="e" label="environment manager" />
				<SplashRow keyHint="h" label="history" />
			</SplashCol>
		</box>
	);
}

function SplashCol(props: { head: string; underlineWidth: number; children: any }) {
	const t = () => theme();
	return (
		<box flexDirection="column" rowGap={0} flexGrow={1}>
			<text fg={t().textDim} attributes={TextAttributes.BOLD | TextAttributes.DIM}>
				{props.head}
			</text>
			{/* spacer line under the column heading, mirrors the "underline" in the POC */}
			<text fg={t().border}>{"─".repeat(props.underlineWidth)}</text>
			{props.children}
		</box>
	);
}

function SplashRow(props: { keyHint: string; label: string; sub?: string }) {
	const t = () => theme();
	return (
		<text>
			<S fg={t().accent} bold>
				{props.keyHint}
			</S>
			<S> </S>
			<S fg={t().text}>{props.label}</S>
			{props.sub ? <S fg={t().textDim}> {props.sub}</S> : null}
		</text>
	);
}
