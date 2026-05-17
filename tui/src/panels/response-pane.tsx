// Bottom-right pane: the response viewer.
//
//   ┌ response ────────────────────────────┐
//   │ ● 200 OK   time 184ms · size 612B · …  │
//   │ 1 Body · 2 Headers · 3 Cookies · …      │
//   │ <body / headers / cookies content…>     │
//   └────────────────────────────────────────┘

import { Show, createMemo } from "solid-js";

import { Pane } from "../components/pane";
import { S } from "../components/styled-span";
import { Tabs } from "../components/tabs";
import { Spinner } from "../components/spinner";
import { StatusChip } from "../components/status-chip";
import { KVTable } from "../components/kv-table";
import { useResponseScope } from "../keyboard/scopes/response";
import { renderJson } from "../utils/json-view";
import {
	focusedPane,
	hasActiveRequest,
	response,
	responseTab,
	sending,
	setFocusedPane,
	setResponseTab,
	theme,
	type ResponseTab,
} from "../state/store";

export function ResponsePane() {
	useResponseScope();

	const t = () => theme();
	const focused = () => focusedPane() === "response";
	const resp = response;

	// Surface "content-type" in the status row.
	const contentType = createMemo(
		() => resp()?.headers.find((h) => h.key.toLowerCase() === "content-type")?.value ?? "",
	);

	const tabs = createMemo(() => [
		{ id: "Body" as ResponseTab, label: "Body" },
		{
			id: "Headers" as ResponseTab,
			label: "Headers",
			badge: resp()?.headers.length || undefined,
		},
		{ id: "Cookies" as ResponseTab, label: "Cookies" },
		{ id: "Tests" as ResponseTab, label: "Tests", badge: "2/2", badgeColor: t().ok },
		{ id: "Timeline" as ResponseTab, label: "Timeline" },
	]);

	return (
		<Pane title="response" focused={focused()} flexGrow={1} flexBasis={0}>
			<box
				flexDirection="column"
				flexGrow={1}
				rowGap={1}
				onMouseDown={() => setFocusedPane("response")}
			>
				<Show when={sending()}>
					<SendingState />
				</Show>

				<Show when={!sending() && resp() != null}>
					{/* Status row */}
					<box flexDirection="row" columnGap={2} flexShrink={0} height={1}>
						<StatusChip code={resp()!.status} />
						<text fg={t().textDim}>
							<S>time </S>
							<S fg={t().text}>{resp()!.timeMs}ms</S>
							<S> · size </S>
							<S fg={t().text}>{formatBytes(resp()!.sizeBytes)}</S>
							<S> · </S>
							<S fg={t().text}>{contentType()}</S>
						</text>
					</box>

					<box flexShrink={0} height={1} flexDirection="row">
						<Tabs tabs={tabs()} active={responseTab()} onSelect={setResponseTab} />
						<box flexGrow={1} />
						<text fg={t().textDim}>
							<S>view: </S>
							<S fg={t().text}>pretty</S>
						</text>
					</box>

					{/* Tab content */}
					<box flexGrow={1} flexDirection="column">
						<Show when={responseTab() === "Body"}>
							<ResponseBody body={resp()!.body} />
						</Show>
						<Show when={responseTab() === "Headers"}>
							<KVTable rows={resp()!.headers} noCheck noDesc noCursor keyWidth={28} />
						</Show>
						<Show when={responseTab() === "Cookies"}>
							<text fg={t().textDim}>(no cookies)</text>
						</Show>
						<Show when={responseTab() === "Tests"}>
							<text fg={t().ok}>✓ 2/2 passing</text>
						</Show>
						<Show when={responseTab() === "Timeline"}>
							<text fg={t().textDim}>DNS · TCP · TLS · request · response</text>
						</Show>
						<box flexGrow={1} />
					</box>
				</Show>

				<Show when={!sending() && resp() == null && hasActiveRequest()}>
					<text fg={t().textDim}>(press ⌘↵ to send the request)</text>
				</Show>

				<Show when={!hasActiveRequest()}>
					<text fg={t().textDim}>no request selected</text>
				</Show>
			</box>
		</Pane>
	);
}

function ResponseBody(props: { body: unknown }) {
	const t = () => theme();

	if (props.body == null) {
		return <text fg={t().textDim}>(empty response body)</text>;
	}

	if (typeof props.body === "string") {
		return <text>{props.body}</text>;
	}

	return <text>{renderJson(props.body)}</text>;
}

function SendingState() {
	const t = () => theme();
	return (
		<text>
			<Spinner />
			<S fg={t().textDim}> sending request…</S>
		</text>
	);
}

function formatBytes(n: number): string {
	if (n < 1024) return `${n}B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
	return `${(n / 1024 / 1024).toFixed(1)}MB`;
}
