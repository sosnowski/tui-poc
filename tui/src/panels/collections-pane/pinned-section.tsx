// Pinned-requests flat list, rendered above the tree. The whole section is
// hidden when nothing is pinned. Each row mirrors the tree-request row shape
// (method tag + name + accent on active) but skips the tree gutter and uses
// a leading ★ marker instead.

import { For, Show } from "solid-js";
import { TextAttributes } from "@opentui/core";

import { S } from "../../components/styled-span";
import { MethodTag } from "../../components/method-tag";
import {
	activeRequestId,
	requestMethod,
	setActiveRequestId,
	setFocusedPane,
	theme,
} from "../../state/store";
import type { Request } from "../../data/types";
import { Row } from "./row";
import { pinKey } from "./tree";

interface PinnedSectionProps {
	requests: () => Pick<Request, "id" | "method" | "name">[];
	isCursor: (key: string) => boolean;
	setCursorKey: (key: string) => void;
}

export function PinnedSection(props: PinnedSectionProps) {
	const t = () => theme();
	return (
		<Show when={props.requests().length > 0}>
			<box flexDirection="column" flexShrink={0}>
				<For each={props.requests()}>
					{(r) => {
						const k = pinKey(r.id);
						const active = () => activeRequestId() === r.id;
						return (
							<Row
								cursor={props.isCursor(k)}
								onMouseDown={() => {
									setFocusedPane("collections");
									props.setCursorKey(k);
									setActiveRequestId(r.id);
								}}
							>
								<text
									fg={active() ? t().accent : t().text}
									attributes={active() ? TextAttributes.BOLD : 0}
								>
									<S fg={t().accent}>★ </S>
									<MethodTag method={requestMethod(r.id, r.method)} />
									<S> {r.name}</S>
								</text>
							</Row>
						);
					}}
				</For>

				{/* Subtle separator between pinned section and the tree. */}
				<text fg={t().border}>{"─".repeat(28)}</text>
			</box>
		</Show>
	);
}
