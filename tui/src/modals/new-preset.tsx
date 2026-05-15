// New-preset name modal. Opened from the presets panel when the user
// highlights "+ new preset" and presses Enter.

import { createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

import { KeyPill } from "../components/key-pill";
import { Pane } from "../components/pane";
import { Scrim } from "../components/scrim";
import {
	closeModal,
	createNewPreset,
	theme,
} from "../state/store";

export function NewPresetModal() {
	const t = () => theme();
	const [name, setName] = createSignal("");

	function confirm(): void {
		const trimmed = name().trim();
		if (!trimmed) return;
		createNewPreset(trimmed);
		closeModal();
	}

	useKeyboard((e) => {
		if (e.name === "escape") {
			closeModal();
			return;
		}
		if (e.name === "return" || e.name === "enter") {
			confirm();
			return;
		}
	});

	return (
		<Scrim>
			<box width={50}>
				<Pane title="new preset" accent>
					<box flexDirection="column" paddingTop={1} paddingBottom={1} rowGap={1}>
						<text fg={t().textDim} attributes={TextAttributes.BOLD}>
							Name
						</text>
						<box flexDirection="row" height={1}>
							<input
								value={name()}
								onInput={setName}
								placeholder="preset name…"
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

						<box flexDirection="row" paddingTop={1} columnGap={2}>
							<KeyPill k="↵" label="confirm" />
							<KeyPill k="esc" label="cancel" />
						</box>
					</box>
				</Pane>
			</box>
		</Scrim>
	);
}
