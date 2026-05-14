import { For } from "solid-js";

import { S } from "../../components/styled-span";
import { COLLECTIONS_HINTS } from "../../keyboard/keybindings";
import { theme } from "../../state/store";

export function Footer() {
	const t = () => theme();
	return (
		<text fg={t().textDim}>
			<For each={COLLECTIONS_HINTS}>
				{(h, i) => (
					<>
						{i() > 0 && <S> </S>}
						<S fg={t().accent} bold>
							{h.k}
						</S>
						<S> {h.label}</S>
					</>
				)}
			</For>
		</text>
	);
}
