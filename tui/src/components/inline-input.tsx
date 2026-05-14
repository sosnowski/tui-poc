type Props = {
	value: string;
	fg: string;
	bg: string;
	cursorColor: string;
	width?: number;
	flex?: boolean;
	maxLength?: number;
	onInput?: (value: string) => void;
	onSubmit: (value: string) => void;
};

export function InlineInput(props: Props) {
	const autoWidth = () =>
		props.flex || props.width !== undefined ? props.width : props.value.length + 2;

	return (
		<input
			value={props.value}
			width={autoWidth()}
			flexGrow={props.flex ? 1 : undefined}
			// flexBasis={props.flex ? 0 : undefined}
			backgroundColor={props.bg}
			focusedBackgroundColor={props.bg}
			textColor={props.fg}
			focusedTextColor={props.fg}
			cursorColor={props.cursorColor}
			maxLength={props.maxLength ?? 1000}
			focused
			onInput={props.onInput}
			on:enter={props.onSubmit}
		/>
	);
}
