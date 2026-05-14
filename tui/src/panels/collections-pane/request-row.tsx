import { TextAttributes } from "@opentui/core";

import { S } from "../../components/styled-span";
import { MethodTag } from "../../components/method-tag";
import type { Request } from "../../data/types";
import {
	activeRequestId,
	isPinned,
	requestMethod,
	setActiveRequestId,
	setFocusedPane,
	theme,
} from "../../state/store";
import { Row } from "./row";
import { reqKey } from "./tree";

interface RequestRowProps {
	request: Request;
	depth: number;
	last: boolean;
	cursor: boolean;
	setCursorKey: (key: string) => void;
}

export function RequestRow(props: RequestRowProps) {
	const t = () => theme();
	const active = () => activeRequestId() === props.request.id;
	const pinned = () => isPinned(props.request.id);
	const indent = () => "  ".repeat(props.depth);

	return (
		<Row
			cursor={props.cursor}
			onMouseDown={() => {
				setFocusedPane("collections");
				props.setCursorKey(reqKey(props.request.id));
				setActiveRequestId(props.request.id);
			}}
		>
			<text
				fg={active() ? t().accent : t().text}
				attributes={active() ? TextAttributes.BOLD : 0}
			>
				{indent()}
				<S fg={t().border2}>{props.last ? "└─" : "├─"}</S>
				{active() ? (
					<S fg={t().accent} bold>
						▸{" "}
					</S>
				) : (
					<S>{"  "}</S>
				)}
				<MethodTag method={requestMethod(props.request.id, props.request.method)} />
				<S> {props.request.name}</S>
				{pinned() ? <S fg={t().accent}> ★</S> : null}
			</text>
		</Row>
	);
}
