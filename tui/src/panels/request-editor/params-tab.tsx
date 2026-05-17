import { createEffect, createMemo } from "solid-js";
import { TextAttributes } from "@opentui/core";

import { KVTable } from "../../components/kv-table";
import { clamp } from "../../keyboard/helpers";
import { useEditorParamsScope } from "../../keyboard/scopes/editor";
import {
	activeRequest,
	commitEditingValue,
	editing,
	paramsCursor,
	setParamsCursor,
	theme,
	updateEditingDraft,
} from "../../state/store";
import { vars } from "../../utils/highlight";

export function ParamsTab() {
	useEditorParamsScope();

	// If the cursor is parked on the (empty) path-params table, snap it to
	// query so arrow-keys keep working. Used to live inside the keyboard
	// handler; lifting it to a reactive effect means it stays correct even
	// when the tab is switched in without a key event.
	createEffect(() => {
		const r = activeRequest();
		const c = paramsCursor();
		if (c.table !== "path") return;
		if (r.pathParams.length > 0) return;
		setParamsCursor({ ...c, table: "query", row: clamp(c.row, 0, r.params.length) });
	});

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
		<box flexDirection="column" flexGrow={1} rowGap={0}>
			{r().pathParams.length > 0 ? (
				<box flexDirection="column" flexShrink={0} rowGap={1}>
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
				showDeleteColumn
				cursorCol={paramsCursor().col}
				editing={editing()?.tab === "Params" ? editing()! : undefined}
				onEditInput={updateEditingDraft}
				onEditSubmit={commitEditingValue}
			/>
			<box flexGrow={1} />
		</box>
	);

	function TableLabel(props: { children: string }) {
		return (
			<box flexDirection="row" height={1} paddingLeft={2}>
				<text fg={t().textDim} attributes={TextAttributes.BOLD | TextAttributes.DIM}>
					{props.children}
				</text>
			</box>
		);
	}
}
