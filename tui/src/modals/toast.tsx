// Transient toast notification anchored at the bottom of the viewport.
// Auto-dismisses via store.pushToast's setTimeout.

import { Show } from "solid-js";

import { S } from "../components/styled-span";
import { theme, toast, type Toast } from "../state/store";

export function ToastView() {
	const t = () => theme();

	return (
		<Show when={toast()}>
			{(active: () => Toast) => {
				const kind = active().kind;
				const color = () => (kind === "ok" ? t().ok : kind === "err" ? t().err : t().info);
				const icon = kind === "ok" ? "✓" : kind === "err" ? "✗" : "ℹ";
				return (
					<box
						position="absolute"
						bottom={3}
						right={2}
						zIndex={200}
						border
						borderStyle="single"
						borderColor={color()}
						backgroundColor={t().surface}
						paddingLeft={1}
						paddingRight={1}
						flexDirection="row"
					>
						<text>
							<S fg={color()} bold>
								{icon}
							</S>
							<S fg={t().text}> {active().message}</S>
						</text>
					</box>
				);
			}}
		</Show>
	);
}
