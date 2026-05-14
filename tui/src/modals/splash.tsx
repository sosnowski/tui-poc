// Welcome / splash modal — the first thing the user sees on launch.
// Shows the ASCII logo, three columns of quick actions, and a dismiss hint.
// Press Enter (or any key) to dismiss.

import { useKeyboard } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { S } from "../components/styled-span";
import { Scrim } from "../components/scrim";
import { closeModal, theme } from "../state/store";

const ASCII_LOGO = String.raw`
  ████████╗██╗   ██╗██╗    ██████╗  ██████╗ ███████╗████████╗███╗   ███╗ █████╗ ███╗   ██╗
  ╚══██╔══╝██║   ██║██║    ██╔══██╗██╔═══██╗██╔════╝╚══██╔══╝████╗ ████║██╔══██╗████╗  ██║
     ██║   ██║   ██║██║    ██████╔╝██║   ██║███████╗   ██║   ██╔████╔██║███████║██╔██╗ ██║
     ██║   ██║   ██║██║    ██╔═══╝ ██║   ██║╚════██║   ██║   ██║╚██╔╝██║██╔══██║██║╚██╗██║
     ██║   ╚██████╔╝██║    ██║     ╚██████╔╝███████║   ██║   ██║ ╚═╝ ██║██║  ██║██║ ╚████║
     ╚═╝    ╚═════╝ ╚═╝    ╚═╝      ╚═════╝ ╚══════╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝`;

export function Splash() {
	const t = () => theme();

	// Any key dismisses the splash.
	useKeyboard(() => closeModal());

	return (
		<Scrim align="top">
			<box flexDirection="column" alignItems="center" rowGap={1} paddingTop={2}>
				{/* ASCII logo */}
				<text fg={t().accent} attributes={TextAttributes.BOLD}>
					{ASCII_LOGO}
				</text>

				<text fg={t().textDim} attributes={TextAttributes.DIM}>
					a postman in your terminal · v0.4.1
				</text>

				{/* Three-column quick actions */}
				<box
					border
					borderStyle="single"
					borderColor={t().border}
					backgroundColor={t().surface}
					flexDirection="row"
					width={88}
					paddingTop={1}
					paddingBottom={1}
					paddingLeft={2}
					paddingRight={2}
					columnGap={4}
				>
					<SplashCol head="START">
						<SplashRow keyHint="⏎" label="open last collection" sub="JSONPlaceholder" />
						<SplashRow keyHint="n" label="new request" />
						<SplashRow keyHint="o" label="open collection from file…" />
						<SplashRow keyHint="i" label="import OpenAPI / Postman" />
					</SplashCol>

					<SplashCol head="RECENT">
						<text fg={t().textDim}>today · users/7</text>
						<text fg={t().textDim}>today · posts</text>
						<text fg={t().textDim}>y'day · auth/login</text>
						<text fg={t().textDim}>2d ago · billing/invoices</text>
					</SplashCol>

					<SplashCol head="HELP">
						<SplashRow keyHint="/" label="command palette" />
						<SplashRow keyHint="?" label="keybinding cheatsheet" />
						<SplashRow keyHint="e" label="environment manager" />
						<SplashRow keyHint="h" label="history" />
					</SplashCol>
				</box>

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

function SplashCol(props: { head: string; children: any }) {
	const t = () => theme();
	return (
		<box flexDirection="column" rowGap={0} flexGrow={1}>
			<text fg={t().textDim} attributes={TextAttributes.BOLD | TextAttributes.DIM}>
				{props.head}
			</text>
			{/* spacer line under the column heading, mirrors the "underline" in the POC */}
			<text fg={t().border}>{"─".repeat(20)}</text>
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
