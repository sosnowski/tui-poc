import { createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { KeyPill } from "../components/key-pill";
import { Pane } from "../components/pane";
import { Scrim } from "../components/scrim";
import { attachBinaryFile, closeModal, theme } from "../state/store";

export function AttachBinaryFileModal() {
	const t = () => theme();
	const [path, setPath] = createSignal("");

	async function confirm(): Promise<void> {
		await attachBinaryFile(path());
		closeModal();
	}

	useKeyboard((e) => {
		if (e.name === "escape") {
			closeModal();
			return;
		}
		if (e.name === "return" || e.name === "enter") {
			void confirm();
		}
	});

	return (
		<Scrim>
			<box width={60}>
				<Pane title="attach binary file" accent>
					<box flexDirection="column" paddingTop={1} paddingBottom={1} rowGap={1}>
						<text fg={t().textDim} attributes={TextAttributes.BOLD}>
							Source file path
						</text>
						<box flexDirection="row" height={1}>
							<input
								value={path()}
								onInput={setPath}
								placeholder="/path/to/file.bin"
								focused
								backgroundColor={t().surface}
								focusedBackgroundColor={t().selBg}
								textColor={t().text}
								focusedTextColor={t().text}
								cursorColor={t().accent}
								placeholderColor={t().textDim}
								flexGrow={1}
							/>
						</box>

						<text fg={t().textDim}>
							The file will be copied into the collection folder under data/.
						</text>

						<box flexDirection="row" paddingTop={1} columnGap={2}>
							<KeyPill k="↵" label="attach" />
							<KeyPill k="esc" label="cancel" />
						</box>
					</box>
				</Pane>
			</box>
		</Scrim>
	);
}
