// Generic key/value table used by params, headers, response headers, and env editors.

import { For, createMemo } from "solid-js";
import type { JSX } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { theme } from "../state/store";
import { blendHex } from "../utils/color";
import { InlineInput } from "./inline-input";

export interface KVRow {
	key: string;
	value: string | JSX.Element;
	/** Plain string version used when the value cell is rendered as a chip. */
	rawValue?: string;
	enabled?: boolean;
	desc?: string;
	muted?: boolean;
	cursor?: boolean;
}

interface Props {
	rows: KVRow[];
	noCheck?: boolean;
	noDesc?: boolean;
	noHeader?: boolean;
	noCursor?: boolean;
	keyWidth?: number;
	headers?: { key: string; value: string; desc?: string };
	showAddRow?: boolean;
	addLabel?: string;
	addRowCursor?: boolean;
	showDeleteColumn?: boolean;
	cursorCol?: 0 | 1 | 2;
	editing?: { row: number; col: 0 | 1 | 2; draft: string; cursor: number };
	onEditInput?: (value: string) => void;
	onEditSubmit?: (value: string) => void;
}

const DEFAULT_KEY_WIDTH = 18;

type RenderRow = { kind: "row"; row: KVRow; rowIndex: number } | { kind: "add" };

export function KVTable(props: Props) {
	const keyWidth = () => props.keyWidth ?? DEFAULT_KEY_WIDTH;
	const headers = () => props.headers ?? { key: "KEY", value: "VALUE", desc: "DESCRIPTION" };
	const showCursorCol = () => !props.noCursor;
	const renderRows = createMemo<RenderRow[]>(() => {
		const rows: RenderRow[] = props.rows.map((row, rowIndex) => ({
			kind: "row",
			row,
			rowIndex,
		}));
		if (props.showAddRow) rows.push({ kind: "add" });
		return rows;
	});

	return (
		<box flexDirection="column" flexShrink={0}>
			{props.noHeader ? null : (
				<KVTableHeader
					headers={headers()}
					keyWidth={keyWidth()}
					showCursorCol={showCursorCol()}
					noCheck={props.noCheck}
					noDesc={props.noDesc}
					showDeleteColumn={props.showDeleteColumn}
				/>
			)}

			<For each={renderRows()}>
				{(row) =>
					row.kind === "row" ? (
						<KVTableRow
							row={row.row}
							rowIndex={row.rowIndex}
							keyWidth={keyWidth()}
							showCursorCol={showCursorCol()}
							noCheck={props.noCheck}
							noDesc={props.noDesc}
							showDeleteColumn={props.showDeleteColumn}
							cursorCol={props.cursorCol}
							editing={props.editing}
							onEditInput={props.onEditInput}
							onEditSubmit={props.onEditSubmit}
						/>
					) : (
						<KVTableAddRow
							label={props.addLabel ?? "+ key"}
							keyWidth={keyWidth()}
							showCursorCol={showCursorCol()}
							noCheck={true}
							noDesc={true}
							showDeleteColumn={false}
							cursor={props.addRowCursor}
						/>
					)
				}
			</For>
		</box>
	);
}

function KVTableHeader(props: {
	headers: { key: string; value: string; desc?: string };
	keyWidth: number;
	showCursorCol: boolean;
	noCheck?: boolean;
	noDesc?: boolean;
	showDeleteColumn?: boolean;
}) {
	const t = () => theme();

	return (
		<box flexDirection="row" flexShrink={0} height={1}>
			{props.showCursorCol ? <text width={2}>{"  "}</text> : null}
			{props.noCheck ? null : (
				<text fg={t().textDim} width={4}>
					{" "}
				</text>
			)}
			<text fg={t().textDim} width={props.keyWidth} attributes={TextAttributes.BOLD}>
				{props.headers.key}
			</text>
			<FlexTextHeader>{props.headers.value}</FlexTextHeader>
			{props.noDesc ? null : (
				<FlexTextHeader>{props.headers.desc ?? "DESCRIPTION"}</FlexTextHeader>
			)}
			{props.showDeleteColumn ? <text width={7}> </text> : null}
		</box>
	);
}

function FlexTextHeader(props: { children: JSX.Element }) {
	const t = () => theme();

	// flexBasis={0} forces Yoga to split VALUE/DESC from flexGrow rather than
	// content width, keeping headers aligned with row cells.
	return (
		<box flexGrow={1} flexBasis={0}>
			<text fg={t().textDim} attributes={TextAttributes.BOLD}>
				{props.children}
			</text>
		</box>
	);
}

function KVTableRow(props: {
	row: KVRow;
	rowIndex: number;
	keyWidth: number;
	showCursorCol: boolean;
	noCheck?: boolean;
	noDesc?: boolean;
	showDeleteColumn?: boolean;
	cursorCol?: 0 | 1 | 2;
	editing?: { row: number; col: 0 | 1 | 2; draft: string; cursor: number };
	onEditInput?: (value: string) => void;
	onEditSubmit?: (value: string) => void;
}) {
	const t = () => theme();
	const dim = () => props.row.enabled === false || props.row.muted === true;
	const fg = () => (dim() ? t().textDim : t().text);
	const isEditing = (col: 0 | 1 | 2) =>
		props.editing !== undefined &&
		props.editing.row === props.rowIndex &&
		props.editing.col === col;
	const isColCursor = (col: 0 | 1 | 2) =>
		props.row.cursor === true && props.cursorCol === col && !isEditing(col);
	const isChip = (col: 0 | 1 | 2) => isColCursor(col) || isEditing(col);
	const hasChip = () => isChip(0) || isChip(1) || isChip(2);
	const rowTint = () => (props.row.cursor && !hasChip() ? t().selBg : undefined);
	const activeCellBg = () => blendHex(t().surface, t().accent, 0.18);
	const cellBg = (col: 0 | 1 | 2) => (isChip(col) ? activeCellBg() : rowTint());
	const cellFg = (col: 0 | 1 | 2, base: string) => (isChip(col) ? t().accent : base);
	const cellAttr = (col: 0 | 1 | 2) => (isChip(col) ? TextAttributes.BOLD : 0);
	const valueText = () =>
		props.row.rawValue ?? (typeof props.row.value === "string" ? props.row.value : "");

	return (
		<box flexDirection="row" flexShrink={0} height={1}>
			{props.showCursorCol ? (
				<box width={2} backgroundColor={rowTint()}>
					<text fg={t().accent}>{props.row.cursor ? "▶ " : "  "}</text>
				</box>
			) : null}
			{props.noCheck ? null : (
				<box width={4} backgroundColor={rowTint()}>
					<text fg={fg()}>{props.row.enabled === false ? "[ ]" : "[×]"}</text>
				</box>
			)}
			<KVCell
				width={props.keyWidth}
				bg={cellBg(0)}
				fg={cellFg(0, props.row.cursor ? t().selFg : fg())}
				attributes={cellAttr(0)}
				active={isChip(0)}
				raw={isEditing(0)}
			>
				{isEditing(0) ? (
					<InlineInput
						value={props.editing!.draft}
						width={props.keyWidth}
						bg={activeCellBg()}
						fg={t().accent}
						cursorColor={t().accent}
						onInput={props.onEditInput}
						onSubmit={(value) => props.onEditSubmit?.(value)}
					/>
				) : (
					props.row.key
				)}
			</KVCell>
			<KVCell
				flex
				bg={cellBg(1)}
				fg={cellFg(1, fg())}
				attributes={cellAttr(1)}
				active={isChip(1)}
				raw={isEditing(1)}
			>
				{isEditing(1) ? (
					<InlineInput
						value={props.editing!.draft}
						flex
						bg={activeCellBg()}
						fg={t().accent}
						cursorColor={t().accent}
						onInput={props.onEditInput}
						onSubmit={(value) => props.onEditSubmit?.(value)}
					/>
				) : isColCursor(1) ? (
					valueText()
				) : (
					(props.row.value as any)
				)}
			</KVCell>
			{props.noDesc ? null : (
				<KVCell
					flex
					bg={cellBg(2)}
					fg={cellFg(2, t().textDim)}
					attributes={cellAttr(2)}
					active={isChip(2)}
					raw={isEditing(2)}
				>
					{isEditing(2) ? (
						<InlineInput
							value={props.editing!.draft}
							flex
							bg={activeCellBg()}
							fg={t().accent}
							cursorColor={t().accent}
							onInput={props.onEditInput}
							onSubmit={(value) => props.onEditSubmit?.(value)}
						/>
					) : (
						(props.row.desc ?? "")
					)}
				</KVCell>
			)}
			{props.showDeleteColumn ? (
				<box width={7} backgroundColor={rowTint()}>
					<text fg={props.row.cursor ? t().err : t().textDim}>
						{props.row.muted ? "     " : "[del]"}
					</text>
				</box>
			) : null}
		</box>
	);
}

function KVCell(props: {
	children: JSX.Element;
	width?: number;
	flex?: boolean;
	bg?: string;
	fg: string;
	attributes?: number;
	active?: boolean;
	raw?: boolean;
}) {
	return (
		<box
			width={props.width}
			flexGrow={props.flex ? 1 : undefined}
			flexBasis={props.flex ? 0 : undefined}
			backgroundColor={props.bg}
		>
			{props.raw ? (
				props.children
			) : (
				<text fg={props.fg} attributes={props.attributes ?? 0}>
					{props.children}
				</text>
			)}
		</box>
	);
}

function KVTableAddRow(props: {
	label: string;
	keyWidth: number;
	showCursorCol: boolean;
	noCheck?: boolean;
	noDesc?: boolean;
	showDeleteColumn?: boolean;
	cursor?: boolean;
}) {
	const t = () => theme();

	return (
		<box
			flexDirection="row"
			flexShrink={0}
			height={1}
			backgroundColor={props.cursor ? t().selBg : undefined}
		>
			{props.showCursorCol ? (
				<text fg={t().accent} width={2}>
					{props.cursor ? "▶ " : "  "}
				</text>
			) : null}
			{props.noCheck ? null : (
				<text fg={t().textDim} width={4}>
					[ ]
				</text>
			)}
			<text fg={t().textDim} width={props.keyWidth}>
				{props.label}
			</text>
			<box flexGrow={1} flexBasis={0} />
			{props.noDesc ? null : <box flexGrow={1} flexBasis={0} />}
			{props.showDeleteColumn ? <text width={7}> </text> : null}
		</box>
	);
}
