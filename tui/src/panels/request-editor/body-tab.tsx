import { Show, createEffect } from "solid-js";

import { useEditorBodyScope } from "../../keyboard/scopes/editor";
import {
	activeRequest,
	bodyCursor,
	bodyTypeCursor,
	setBodyTypeCursor,
} from "../../state/store";
import { RadioStrip } from "./radio-strip";
import {
	BODY_TYPE_OPTIONS,
	bodyTypeToOptionId,
	bodyTypeToOptionIndex,
} from "../../data/body-type-options";
import { FormUrlEncodedBody } from "./body-types/form-url-encoded-body";
import { FormDataBody } from "./body-types/form-data-body";
import { BinaryBody } from "./body-types/binary-body";
import { JsonBody } from "./body-types/json-body";

export function BodyTab() {
	useEditorBodyScope();

	createEffect(() => {
		setBodyTypeCursor(bodyTypeToOptionIndex(activeRequest().bodyType));
	});

	const r = activeRequest;
	const selectedId = () => bodyTypeToOptionId(r().bodyType);
	const typeRowCursor = () => bodyCursor().section === "type";

	return (
		<box flexDirection="column" flexGrow={1} flexBasis={0}>
			<RadioStrip
				label="body type"
				labelWidth={11}
				rowCursor={typeRowCursor()}
				selectedId={selectedId()}
				cursorIndex={bodyTypeCursor()}
				options={[...BODY_TYPE_OPTIONS]}
			/>

			<Show when={r().bodyType === "form"}>
				<FormDataBody />
			</Show>

			<Show when={r().bodyType === "form-urlencoded"}>
				<FormUrlEncodedBody />
			</Show>

			<Show when={r().bodyType === "binary"}>
				<BinaryBody />
			</Show>

			<Show when={r().bodyType === "json"}>
				<box flexDirection="column" flexGrow={1} flexBasis={0}>
					<JsonBody />
				</box>
			</Show>

			<Show when={r().bodyType !== "json"}>
				<box flexGrow={1} />
			</Show>
		</box>
	);
}
