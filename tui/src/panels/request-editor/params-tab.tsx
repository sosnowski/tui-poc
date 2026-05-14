import { createMemo } from "solid-js";
import { TextAttributes } from "@opentui/core";

import { KeyHintStrip } from "../../components/key-hint-strip";
import { EDITOR_KV_HINTS } from "../../keyboard/keybindings";
import { KVTable } from "../../components/kv-table";
import {
	activeRequest,
	commitEditingValue,
	editing,
	paramsCursor,
	theme,
	updateEditingDraft,
} from "../../state/store";
import { vars } from "../../utils/highlight";

export function ParamsTab() {
	const t = () => theme();
	const r = activeRequest;

	const decoratedParams = createMemo(() => {
		const curRow = queryCursorRow();
		return r().params.map((p, i) => ({
			...p,
			value: vars(p.value),
			rawValue: p.value,
			cursor: curRow === i,
		}));
	});

	const decoratedPathParams = createMemo(() => {
		const cur = paramsCursor();
		return r().pathParams.map((p, i) => ({
			...p,
			value: vars(p.value),
			rawValue: p.value,
			cursor: cur.table === "path" && cur.row === i,
		}));
	});

	const queryAddRowCursor = () => queryCursorRow() === r().params.length;

	function queryCursorRow(): number {
		const cur = paramsCursor();
		if (cur.table === "query") return cur.row;
		if (r().pathParams.length === 0) return Math.min(cur.row, r().params.length);
		return -1;
	}

	return (
		<box flexDirection="column" flexGrow={1}>
			{r().pathParams.length > 0 ? (
				<box flexDirection="column" flexShrink={0}>
					<TableLabel>Path Params</TableLabel>
					<KVTable
						rows={decoratedPathParams()}
						cursorCol={paramsCursor().col}
						editing={editing()?.tab === "PathParams" ? editing()! : undefined}
						onEditInput={updateEditingDraft}
						onEditSubmit={commitEditingValue}
					/>
					<box flexShrink={0} height={1} />
				</box>
			) : null}
			<TableLabel>Query Params</TableLabel>
			<KVTable
				rows={decoratedParams()}
				showAddRow
				addLabel="+ key"
				addRowCursor={queryAddRowCursor()}
				cursorCol={paramsCursor().col}
				editing={editing()?.tab === "Params" ? editing()! : undefined}
				onEditInput={updateEditingDraft}
				onEditSubmit={commitEditingValue}
			/>
			<box flexGrow={1} />
			<KeyHintStrip items={EDITOR_KV_HINTS} />
		</box>
	);

	function TableLabel(props: { children: string }) {
		return (
			<box flexDirection="row" height={1}>
				<text fg={t().textDim} attributes={TextAttributes.BOLD | TextAttributes.DIM}>
					{props.children}
				</text>
			</box>
		);
	}
}
