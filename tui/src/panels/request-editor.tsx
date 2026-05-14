// Top-right pane: the request editor.

import { Show, createMemo } from "solid-js";
import { TextAttributes } from "@opentui/core";

import { InlineInput } from "../components/inline-input";
import { Pane } from "../components/pane";
import { MethodChip, MethodChipInline, methodColor } from "../components/method-tag";
import { Tabs } from "../components/tabs";
import {
	activeRequest,
	activeRequestName,
	activeRequestParentName,
	commitEditingValue,
	editing,
	editorTab,
	focusedPane,
	hasActiveRequest,
	setEditorTab,
	setFocusedPane,
	theme,
	updateEditingDraft,
	type EditorTab,
} from "../state/store";
import { blendHex } from "../utils/color";
import { urlSpans } from "../utils/highlight";
import { AuthTab } from "./request-editor/auth-tab";
import { BodyTab } from "./request-editor/body-tab";
import { HeadersTab } from "./request-editor/headers-tab";
import { ParamsTab } from "./request-editor/params-tab";
import { TestsTab } from "./request-editor/tests-tab";

export function RequestEditor() {
	const t = () => theme();
	const focused = () => focusedPane() === "editor";
	const r = activeRequest;

	const tabs = createMemo(() => [
		{ id: "Params" as EditorTab, label: "Params", badge: r().params.length || undefined },
		{ id: "Headers" as EditorTab, label: "Headers", badge: r().headers.length || undefined },
		{ id: "Body" as EditorTab, label: "Body" },
		{ id: "Auth" as EditorTab, label: "Auth" },
		{ id: "Tests" as EditorTab, label: "Tests" },
	]);

	return (
		<Pane
			title="request"
			focused={focused()}
			flexGrow={1}
			flexBasis={0}
			paddingRight={1}
			paddingLeft={1}
			paddingTop={0}
			paddingBottom={0}
		>
			<box
				flexDirection="column"
				flexGrow={1}
				rowGap={1}
				onMouseDown={() => setFocusedPane("editor")}
			>
				<Show when={hasActiveRequest()} fallback={
					<box flexGrow={1} alignItems="center" justifyContent="center">
						<text fg={t().textDim}>no request selected — press n to create one</text>
					</box>
				}>
					<box flexDirection="row" columnGap={1} alignItems="center" justifyContent="center">
						<RequestNameRow />
						<RequestTargetRow />
					</box>

					<box flexShrink={0} height={1}>
						<text fg={t().textDim} attributes={TextAttributes.DIM}>
							preset: :default
						</text>
					</box>

					<box flexShrink={0} height={1}>
						<Tabs tabs={tabs()} active={editorTab()} onSelect={setEditorTab} />
					</box>

					<box flexGrow={1} flexDirection="column">
						<Show when={editorTab() === "Params"}>
							<ParamsTab />
						</Show>
						<Show when={editorTab() === "Headers"}>
							<HeadersTab />
						</Show>
						<Show when={editorTab() === "Body"}>
							<BodyTab />
						</Show>
						<Show when={editorTab() === "Auth"}>
							<AuthTab />
						</Show>
						<Show when={editorTab() === "Tests"}>
							<TestsTab />
						</Show>
					</box>
				</Show>
			</box>
		</Pane>
	);
}

function RequestNameRow() {
	const t = () => theme();
	const editingName = () => editing()?.tab === "Name";
	const nameBg = () => (editingName() ? blendHex(t().surface, t().accent, 0.18) : t().bg2);

	return (
		<box
			paddingLeft={1}
			paddingRight={1}
			flexDirection="row"
			alignItems="stretch"
			justifyContent="center"
			borderStyle="single"
			borderColor={editingName() ? t().borderFocus : t().border2}
			columnGap={1}
			flexGrow={1}
		>
			<text fg={t().textDim} attributes={TextAttributes.DIM}>
				{activeRequestParentName()}/
			</text>
			{editingName() ? (
				<InlineInput
					value={editing()!.draft}
					bg={nameBg()}
					fg={t().accent}
					flex={true}
					cursorColor={t().accent}
					onInput={updateEditingDraft}
					onSubmit={commitEditingValue}
				/>
			) : (
				<text fg={t().text} attributes={TextAttributes.BOLD} flexGrow={1}>
					{activeRequestName()}
				</text>
			)}
		</box>
	);
}

function RequestTargetRow() {
	const t = () => theme();
	const r = activeRequest;
	const editingUrl = () => editing()?.tab === "Url";
	const urlBorder = () => (editingUrl() ? t().borderFocus : methodColor(r().method));
	const urlBg = () => (editingUrl() ? blendHex(t().surface, t().accent, 0.18) : t().bg2);

	return (
		<box flexDirection="row" columnGap={1} flexShrink={0} alignItems="center" flexGrow={4}>
			{/* <MethodChip method={r().method} bare /> */}

			<box
				flexGrow={1}
				// backgroundColor={urlBg()}
				borderStyle="single"
				borderColor={urlBorder()}
				paddingLeft={1}
				paddingRight={1}
				flexDirection="row"
				columnGap={1}
				alignItems="center"
				justifyContent="flex-start"
			>
				{/* <text fg={t().textDim} attributes={TextAttributes.DIM}>
					Request:
				</text> */}
				<MethodChipInline method={r().method} />
				{editingUrl() ? (
					<InlineInput
						value={editing()!.draft}
						flex
						bg={urlBg()}
						fg={t().accent}
						cursorColor={t().accent}
						onInput={updateEditingDraft}
						onSubmit={commitEditingValue}
					/>
				) : (
					<text>{urlSpans(r().url)}</text>
				)}
			</box>
			<box
				paddingLeft={1}
				paddingRight={1}
				alignItems="stretch"
				justifyContent="center"
				borderStyle="single"
				borderColor={t().borderFocus}
			>
				<text fg={t().accent} attributes={TextAttributes.BOLD}>
					Send ⌘↵
				</text>
			</box>

			{/* <text fg={t().accentBg} bg={t().accent} attributes={TextAttributes.BOLD}>
				{" Send ⌘↵ "}
			</text> */}
		</box>
	);
}
