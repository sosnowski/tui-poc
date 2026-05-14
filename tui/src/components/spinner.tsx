// Animated braille spinner ("⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"). Used while a request is in flight.
// Rendered as an inline `<span>` so it can be embedded inside another <text>.

import { createSignal, onCleanup } from "solid-js";

import { S } from "./styled-span";
import { theme } from "../state/store";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner() {
	const [frame, setFrame] = createSignal(0);
	const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 90);
	onCleanup(() => clearInterval(id));
	return <S fg={theme().accent}>{FRAMES[frame()]}</S>;
}
