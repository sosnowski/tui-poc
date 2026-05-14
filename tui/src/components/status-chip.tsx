// Status chip rendered in the response pane: "● 200 OK", "● 500 Server Error".
// Color encodes the family (2xx OK / 3xx warn / 4xx-5xx err).

import { TextAttributes } from "@opentui/core";

import { theme } from "../state/store";
import { httpStatusColor, httpStatusText } from "../utils/http-status";

export function StatusChip(props: { code: number }) {
	const t = theme();
	const text = httpStatusText(props.code);
	return (
		<text fg={httpStatusColor(props.code, t)} attributes={TextAttributes.BOLD}>
			● {text}
		</text>
	);
}
