import { createMemo } from "solid-js";

import { KVTable } from "../../../components/kv-table";
import {
	activeRequest,
	bodyCursor,
	commitEditingValue,
	editing,
	updateEditingDraft,
} from "../../../state/store";
import { vars } from "../../../utils/highlight";

export function FormUrlEncodedBody() {
	const r = activeRequest;

	const decoratedRows = createMemo(() => {
		const curRow = bodyCursor().section === "form" ? bodyCursor().row : -1;
		return r().formUrlEncoded.map((row, i) => ({
			...row,
			value: vars(row.value),
			rawValue: row.value,
			cursor: curRow === i,
		}));
	});

	const addRowCursor = () =>
		bodyCursor().section === "form" && bodyCursor().row === r().formUrlEncoded.length;

	return (
		<box flexDirection="column" flexGrow={1} paddingTop={1}>
			<KVTable
				rows={decoratedRows()}
				noDesc
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
