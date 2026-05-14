// Colored 6-char method chip ("GET   ", "POST  " etc.) used by the
// collections tree and the URL bar. Colors come from the active theme.
//
// Rendered as an inline span so the chip can sit *inside* another `<text>`
// (which OpenTUI requires for inline composition). Use `MethodChip` (block
// flavour) when you need a standalone widget instead.

import { S } from "./styled-span";
import { theme } from "../state/store";
import type { HttpMethod } from "../data/types";
import { blendHex } from "../utils/color";
import { TextAttributes } from "@opentui/core";

interface Props {
	method: HttpMethod;
	/** Drop the chip's intensity (used for inactive pinned tabs). */
	dim?: boolean;
	bold?: boolean;
	/** Use the bare method label without 6-char right-padding. */
	bare?: boolean;
}

const FIELD_KEY = {
	GET: "methodGet",
	POST: "methodPost",
	PUT: "methodPut",
	PATCH: "methodPatch",
	DELETE: "methodDelete",
} as const satisfies Record<HttpMethod, keyof ReturnType<typeof theme>>;

export function methodColor(method: HttpMethod) {
	return theme()[FIELD_KEY[method]];
}

function methodLabel(props: Props) {
	return props.bare ? props.method : props.method.padEnd(6, " ");
}

export function MethodTag(props: Props) {
	const color = () => methodColor(props.method);
	const label = () => methodLabel(props);
	return (
		<S fg={color()} dim={!!props.dim} bold={props.bold !== false}>
			{label}
		</S>
	);
}

export function MethodChipInline(props: Props) {
	const color = () => methodColor(props.method);
	const label = () => methodLabel(props);
	const bg = () => blendHex(theme().surface, color(), props.dim ? 0.1 : 0.18);
	return (
		<text fg={color()} attributes={TextAttributes.BOLD} bg={bg()}>
			{" " + props.method + " "}
		</text>
	);
}

/** Standalone block-level method chip (wraps MethodTag in its own `<text>`). */
export function MethodChip(props: Props) {
	const color = () => methodColor(props.method);
	const bg = () => blendHex(theme().surface, color(), props.dim ? 0.1 : 0.18);
	return (
		<box padding={0} margin={0} borderStyle="single" borderColor={color()}>
			<text>
				<S fg={color()} dim={!!props.dim} bold={props.bold !== false}>
					{methodLabel(props)}
				</S>
			</text>
		</box>
	);
}
