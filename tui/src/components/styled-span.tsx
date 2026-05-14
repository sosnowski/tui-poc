// `<S fg={...} bold dim … >` — a typed wrapper around `<span>` that funnels
// its colour/attribute props through the only path the OpenTUI reconciler
// actually honours for span elements: `style={{ fg, bg, bold, italic, … }}`.
//
// IMPORTANT — OpenTUI bug workaround:
//
// OpenTUI's reconciler applies `<span style>` updates with OR-merge for
// attributes (`node.attributes |= createTextAttributes(value)`) and a truthy
// fallback for fg/bg (`node.fg = value.fg ? … : node.fg`). That means once a
// span has accumulated `bold` or any other attribute, *no later setProperty
// call can clear it*. Reactively flipping `bold={isActive()}` from true to
// false leaves the bit stuck on the existing renderable.
//
// We work around it with `<Show keyed>`: any change to a relevant prop
// produces a fresh signature, which keys the Show and forces it to mount a
// brand-new `<span>` (with attributes initially zero) so the next style
// application produces the correct flags. Cost is one tear-down/build per
// style flip — fine for the occasional active-tab / cursor toggle.

import { Show, createMemo } from "solid-js";
import type { JSX } from "@opentui/solid";

export interface StyledSpanProps {
	fg?: string;
	bg?: string;
	bold?: boolean;
	dim?: boolean;
	italic?: boolean;
	underline?: boolean;
	inverse?: boolean;
	strikethrough?: boolean;
	children?:
		| string
		| number
		| boolean
		| null
		| undefined
		| JSX.Element
		| Array<string | number | boolean | null | undefined | JSX.Element>;
}

export function S(props: StyledSpanProps) {
	// Signature collapses every style-affecting prop to a stable string. Any
	// change re-keys the Show below and remounts the span. We always prefix
	// with a literal so the signature is truthy even when no styles are set.
	const sig = createMemo(() =>
		[
			"S",
			props.fg ?? "",
			props.bg ?? "",
			props.bold ? "B" : "",
			props.dim ? "D" : "",
			props.italic ? "I" : "",
			props.underline ? "U" : "",
			props.inverse ? "V" : "",
			props.strikethrough ? "K" : "",
		].join("|"),
	);

	return (
		<Show when={sig()} keyed>
			{() => {
				const style: Record<string, unknown> = {};
				if (props.fg !== undefined) style.fg = props.fg;
				if (props.bg !== undefined) style.bg = props.bg;
				if (props.bold) style.bold = true;
				if (props.dim) style.dim = true;
				if (props.italic) style.italic = true;
				if (props.underline) style.underline = true;
				if (props.inverse) style.inverse = true;
				if (props.strikethrough) style.strikethrough = true;
				return <span style={style as any}>{props.children}</span>;
			}}
		</Show>
	);
}
