import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { TextAttributes } from "@opentui/core";

import { useKeyScope } from "../keyboard/use-key-scope";
import { clamp } from "../keyboard/helpers";
import { theme } from "../state/store";

export type AutocompleteOption =
	| string
	| {
			value: string;
			label?: string;
			description?: string;
	  };

type NormalizedOption = {
	value: string;
	label: string;
	description?: string;
	score: number;
};

type Props = {
	value: string;
	fg: string;
	bg: string;
	cursorColor: string;
	width?: number;
	flex?: boolean;
	maxLength?: number;
	options: AutocompleteOption[];
	maxSuggestions?: number;
	onInput?: (value: string) => void;
	onSubmit: (value: string) => void;
};

export function AutocompleteInput(props: Props) {
	const [open, setOpen] = createSignal(true);
	const [selectedIndex, setSelectedIndex] = createSignal(-1);

	const t = () => theme();

	const autoWidth = () =>
		props.flex || props.width !== undefined ? props.width : props.value.length + 2;

	const suggestions = createMemo(() =>
		rankOptions(props.options, props.value).slice(0, props.maxSuggestions ?? 6),
	);

	const dropdownOpen = () => open() && suggestions().length > 0;

	createEffect(() => {
		const max = suggestions().length - 1;
		const current = selectedIndex();

		if (max < 0) {
			setSelectedIndex(-1);
			return;
		}

		if (current > max) setSelectedIndex(max);
	});

	useKeyScope({
		id: "autocomplete.input",
		priority: 110,
		exclusive: true,
		active: dropdownOpen,
		bindings: () => [
			{
				match: "down",
				run: () => {
					setSelectedIndex((i) => clamp(i + 1, 0, suggestions().length - 1));
				},
				hint: { k: "↑↓", label: "suggest" },
			},
			{
				match: "up",
				run: () => {
					const last = suggestions().length - 1;
					setSelectedIndex((i) => (i < 0 ? last : clamp(i - 1, 0, last)));
				},
			},
			{
				match: (e) => e.name === "return" || e.name === "enter",
				run: () => {
					const suggestion = suggestions()[selectedIndex()];
					props.onSubmit(suggestion?.value ?? props.value);
				},
				hint: { k: "↵", label: "save" },
			},
			{
				match: "escape",
				run: () => setOpen(false),
				hint: { k: "esc", label: "close" },
			},
		],
	});

	return (
		<box
			position="relative"
			height={1}
			width={props.width}
			flexGrow={props.flex ? 1 : undefined}
		>
			<input
				value={props.value}
				width={autoWidth()}
				flexGrow={props.flex ? 1 : undefined}
				backgroundColor={props.bg}
				focusedBackgroundColor={props.bg}
				textColor={props.fg}
				focusedTextColor={props.fg}
				cursorColor={props.cursorColor}
				maxLength={props.maxLength ?? 1000}
				focused
				onInput={(value) => {
					setOpen(true);
					setSelectedIndex(-1);
					props.onInput?.(value);
				}}
				on:enter={props.onSubmit}
			/>

			<Show when={dropdownOpen()}>
				<box
					position="absolute"
					top={1}
					left={0}
					zIndex={60}
					flexDirection="column"
					width={props.width ?? 28}
					backgroundColor={t().accentBg}
				>
					<For each={suggestions()}>
						{(option, index) => {
							const selected = () => selectedIndex() === index();
							return (
								<box
									height={1}
									backgroundColor={selected() ? t().selBg : t().accentBg}
								>
									<text
										fg={selected() ? t().selFg : t().text}
										attributes={selected() ? TextAttributes.BOLD : 0}
									>
										{option.label}
									</text>
								</box>
							);
						}}
					</For>
				</box>
			</Show>
		</box>
	);
}

function rankOptions(options: AutocompleteOption[], query: string): NormalizedOption[] {
	const normalized = options.map(normalizeOption);
	const q = query.trim().toLowerCase();

	if (!q) {
		return normalized.map((option, index) => ({ ...option, score: index }));
	}

	return normalized
		.map((option, index) => {
			const haystack = `${option.label} ${option.value}`.toLowerCase();
			const score = fuzzyScore(haystack, q);
			return score === null ? null : { ...option, score: score * 1000 + index };
		})
		.filter((option): option is NormalizedOption => option !== null)
		.sort((a, b) => a.score - b.score);
}

function normalizeOption(option: AutocompleteOption): Omit<NormalizedOption, "score"> {
	if (typeof option === "string") {
		return { value: option, label: option };
	}

	return {
		value: option.value,
		label: option.label ?? option.value,
		description: option.description,
	};
}

import { fuzzyScore } from "@tuipostman/core";
