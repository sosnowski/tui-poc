import { Show, createEffect } from "solid-js";

import { useEditorBodyScope } from "../../keyboard/scopes/editor";
import {
	activeRequest,
	bodyCursor,
	bodyTypeCursor,
	setBodyTypeCursor,
	theme,
} from "../../state/store";
import { renderJson } from "../../utils/json-view";
import { RadioStrip } from "./radio-strip";
import {
	BODY_TYPE_OPTIONS,
	bodyTypeToOptionId,
	bodyTypeToOptionIndex,
} from "../../data/body-type-options";
import { FormUrlEncodedBody } from "./body-types/form-url-encoded-body";
import { BinaryBody } from "./body-types/binary-body";

export function BodyTab() {
	useEditorBodyScope();

	createEffect(() => {
		setBodyTypeCursor(bodyTypeToOptionIndex(activeRequest().bodyType));
	});

	const t = () => theme();
	const r = activeRequest;
	const selectedId = () => bodyTypeToOptionId(r().bodyType);
	const typeRowCursor = () => bodyCursor().section === "type";

	return (
		<box flexDirection="column" flexGrow={1}>
			<RadioStrip
				label="body type"
				labelWidth={11}
				rowCursor={typeRowCursor()}
				selectedId={selectedId()}
				cursorIndex={bodyTypeCursor()}
				options={[...BODY_TYPE_OPTIONS]}
			/>

			<Show when={r().bodyType === "form-urlencoded"}>
				<FormUrlEncodedBody />
			</Show>

			<Show when={r().bodyType === "binary"}>
				<BinaryBody />
			</Show>

			<Show
				when={
					r().bodyType !== "form-urlencoded" &&
					r().bodyType !== "binary" &&
					r().body != null
				}
			>
				<box flexDirection="column" paddingTop={1} paddingLeft={2}>
					{r().bodyType === "json" ? (
						<text>{renderJson(JSON.parse(r().body!))}</text>
					) : (
						<text fg={t().text}>{r().body!}</text>
					)}
				</box>
			</Show>

			<box flexGrow={1} />
		</box>
	);
}
