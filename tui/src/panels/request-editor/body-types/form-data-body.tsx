import { createMemo } from "solid-js";

import { KVTable } from "../../../components/kv-table";
import { S } from "../../../components/styled-span";
import {
	activeRequest,
	bodyCursor,
	commitEditingValue,
	editing,
	theme,
	updateEditingDraft,
} from "../../../state/store";
import type { FormDataValueType } from "../../../data/types";
import { vars } from "../../../utils/highlight";

function formatBytes(sizeBytes: number | undefined): string {
	if (sizeBytes == null) return "unknown size";
	if (sizeBytes < 1024) return `${sizeBytes} B`;
	if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
	return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileValue(name: string, sizeBytes: number | undefined): string {
	return `${name} (${formatBytes(sizeBytes)})`;
}

function FormDataTypeCell(props: { valueType: FormDataValueType }) {
	const t = () => theme();
	const isText = () => props.valueType === "text";

	return (
		<>
			<S fg={isText() ? t().accent : t().textDim} bold={isText()}>
				[{isText() ? "●" : " "}] text
			</S>
			<S> </S>
			<S fg={!isText() ? t().accent : t().textDim} bold={!isText()}>
				[{!isText() ? "●" : " "}] file
			</S>
		</>
	);
}

export function FormDataBody() {
	const r = activeRequest;

	const decoratedRows = createMemo(() => {
		const curRow = bodyCursor().section === "form" ? bodyCursor().row : -1;
		return r().formData.map((row, i) => {
			const valueDisplay =
				row.valueType === "file"
					? row.file
						? formatFileValue(row.file.name, row.file.sizeBytes)
						: "no file — press ↵ to attach"
					: vars(row.textValue);

			return {
				key: row.key,
				value: <FormDataTypeCell valueType={row.valueType} />,
				desc: valueDisplay,
				enabled: row.enabled,
				cursor: curRow === i,
			};
		});
	});

	const addRowCursor = () =>
		bodyCursor().section === "form" && bodyCursor().row === r().formData.length;

	return (
		<box flexDirection="column" flexGrow={1} paddingTop={1}>
			<KVTable
				rows={decoratedRows()}
				headers={{ key: "KEY", value: "TYPE", desc: "VALUE" }}
				noDesc={false}
				showAddRow
				addLabel="+ key"
				addRowCursor={addRowCursor()}
				showDeleteColumn
				cursorCol={bodyCursor().section === "form" ? bodyCursor().col : undefined}
				editing={editing()?.tab === "Body" ? editing()! : undefined}
				onEditInput={updateEditingDraft}
				onEditSubmit={commitEditingValue}
			/>
			<box flexGrow={1} />
		</box>
	);
}
