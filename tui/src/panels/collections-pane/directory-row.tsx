import { TextAttributes } from "@opentui/core";

import { S } from "../../components/styled-span";
import type { Collection } from "../../data/types";
import { setFocusedPane, theme } from "../../state/store";
import { Row } from "./row";
import { countRequests, dirKey } from "./tree";

interface DirectoryRowProps {
	collection: Collection;
	expanded: boolean;
	depth: number;
	cursor: boolean;
	setCursorKey: (key: string) => void;
	onToggle: () => void;
}

export function DirectoryRow(props: DirectoryRowProps) {
	const t = () => theme();
	const isRoot = () => props.depth === 0;
	const total = () => countRequests(props.collection);

	return (
		<Row
			cursor={props.cursor}
			onMouseDown={() => {
				setFocusedPane("collections");
				props.setCursorKey(dirKey(props.collection.id));
				props.onToggle();
			}}
		>
			<text
				fg={isRoot() ? t().text : t().text2}
				attributes={isRoot() ? TextAttributes.BOLD : 0}
				flexGrow={1}
			>
				{"  ".repeat(props.depth)}
				<S fg={isRoot() ? t().textDim : t().border2}>
					{props.depth > 0 ? "│ " : ""}
				</S>
				<S fg={t().textDim}>{props.expanded ? "▾ " : "▸ "}</S>
				<S fg={isRoot() ? t().accent : t().textDim}>
					{isRoot() ? "■ " : "▤ "}
				</S>
				<S>{props.collection.name}{isRoot() ? "" : "/"}</S>
			</text>
			<text fg={isRoot() ? t().text : t().textDim} paddingRight={1}>
				{total()}
			</text>
		</Row>
	);
}
