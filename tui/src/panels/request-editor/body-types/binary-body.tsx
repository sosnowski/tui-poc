import { Show } from "solid-js";
import { TextAttributes } from "@opentui/core";

import { activeRequest, bodyCursor, theme } from "../../../state/store";

function formatBytes(sizeBytes: number | undefined): string {
	if (sizeBytes == null) return "unknown size";
	if (sizeBytes < 1024) return `${sizeBytes} B`;
	if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
	return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BinaryBody() {
	const r = activeRequest;
	const t = () => theme();
	const rowCursor = () => bodyCursor().section === "binary";
	const file = () => r().binaryFile;

	return (
		<box flexDirection="column" flexGrow={1} paddingTop={1}>
			<box
				flexDirection="row"
				flexShrink={0}
				height={1}
				backgroundColor={rowCursor() ? t().selBg : undefined}
			>
				<text fg={rowCursor() ? t().accent : t().textDim} width={2}>
					{rowCursor() ? "▶ " : "  "}
				</text>
				<text
					fg={rowCursor() ? t().selFg : t().textDim}
					width={11}
					attributes={TextAttributes.BOLD}
				>
					file
				</text>
				<Show
					when={file()}
					fallback={
						<text fg={rowCursor() ? t().selFg : t().textDim}>
							no file attached — press ↵ to attach
						</text>
					}
				>
					<text fg={rowCursor() ? t().selFg : t().accent} attributes={TextAttributes.BOLD}>
						{file()!.name}
					</text>
					<text fg={t().textDim}> {formatBytes(file()!.sizeBytes)}</text>
				</Show>
			</box>

			<Show when={file()}>
				<box flexDirection="row" flexShrink={0} height={1} paddingLeft={13}>
					<text fg={t().textDim}>{file()!.path}</text>
				</box>
			</Show>

			<box flexGrow={1} />
		</box>
	);
}
