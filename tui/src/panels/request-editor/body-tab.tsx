import { Show } from "solid-js";

import { KeyHintStrip } from "../../components/key-hint-strip";
import { EDITOR_BODY_HINTS } from "../../keyboard/keybindings";
import { activeRequest, bodyTypeCursor, theme } from "../../state/store";
import { renderJson } from "../../utils/json-view";
import { RadioStrip } from "./radio-strip";

export function BodyTab() {
	const t = () => theme();
	const r = activeRequest;
	const selectedId = () =>
		r().bodyType === "json"
			? "raw"
			: r().bodyType === "form"
				? "form-data"
				: r().bodyType === "binary"
					? "binary"
					: "none";

	return (
		<box flexDirection="column" flexGrow={1}>
			<RadioStrip
				label="body type"
				labelWidth={11}
				rowCursor
				selectedId={selectedId()}
				cursorIndex={bodyTypeCursor()}
				options={bodyTypeOptions}
			/>

			<Show when={r().body != null}>
				<box flexDirection="column" paddingTop={1} paddingLeft={2}>
					{r().bodyType === "json" ? (
						<text>{renderJson(JSON.parse(r().body!))}</text>
					) : (
						<text fg={t().text}>{r().body!}</text>
					)}
				</box>
			</Show>

			<box flexGrow={1} />
			<KeyHintStrip items={EDITOR_BODY_HINTS} />
		</box>
	);
}

const bodyTypeOptions = [
	{ id: "none", label: "none" },
	{ id: "form-data", label: "form-data" },
	{ id: "form-url", label: "x-www-form-urlencoded" },
	{ id: "raw", label: "raw / json" },
	{ id: "binary", label: "binary" },
];
