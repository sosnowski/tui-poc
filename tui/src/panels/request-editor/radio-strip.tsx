import { For } from "solid-js";

import { S } from "../../components/styled-span";
import { theme } from "../../state/store";
import { blendHex } from "../../utils/color";

interface RadioOption {
	id: string;
	label: string;
}

interface RadioStripProps {
	label: string;
	labelWidth: number;
	options: RadioOption[];
	/** ID of the option whose `[●]` is filled; reflects the data-bound value. */
	selectedId: string;
	/** Index of the option under the keyboard cursor. */
	cursorIndex: number;
	/** Render the row with the chevron and selection background. */
	rowCursor?: boolean;
	/** Paint the per-option cursor highlight. Defaults to `rowCursor`. */
	highlightCursor?: boolean;
}

export function RadioStrip(props: RadioStripProps) {
	const t = () => theme();
	const showCursor = () => props.highlightCursor ?? props.rowCursor ?? false;
	const activeBg = () => blendHex(t().surface, t().accent, 0.18);

	return (
		<box
			flexDirection="row"
			flexShrink={0}
			height={1}
			backgroundColor={props.rowCursor ? t().selBg : undefined}
		>
			<text fg={t().accent} width={2}>
				{props.rowCursor ? "▶ " : "  "}
			</text>
			<text fg={props.rowCursor ? t().selFg : t().text2} width={props.labelWidth}>
				{props.label}
			</text>
			<text>
				<For each={props.options}>
					{(opt, i) => {
						const isSelected = () => opt.id === props.selectedId;
						const isCursor = () => showCursor() && i() === props.cursorIndex;
						const sep = i() === 0 ? "" : "  ";
						return (
							<>
								<S>{sep}</S>
								{isCursor() ? (
									<S fg={t().accent} bg={activeBg()} bold>
										[{isSelected() ? "●" : " "}] {opt.label}
									</S>
								) : (
									<S
										fg={isSelected() ? t().accent : t().text2}
										bold={isSelected()}
									>
										[{isSelected() ? "●" : " "}] {opt.label}
									</S>
								)}
							</>
						);
					}}
				</For>
			</text>
		</box>
	);
}
