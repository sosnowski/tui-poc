import { For } from "solid-js";

import { S } from "../../components/styled-span";
import { theme } from "../../state/store";
import type { Theme } from "../../state/themes";

type TokenColor = "text" | "textDim" | "key" | "str" | "num" | "punct";

interface Segment {
	text: string;
	color: TokenColor;
}

const testPreview: Segment[][] = [
	[{ text: "// runs after response received", color: "textDim" }],
	[
		{ text: "pm.test", color: "key" },
		{ text: "(", color: "punct" },
		{ text: "\"status is 200\"", color: "str" },
		{ text: ", () => {", color: "punct" },
	],
	[
		{ text: "  ", color: "punct" },
		{ text: "pm.expect", color: "key" },
		{ text: "(", color: "punct" },
		{ text: "pm.response.code", color: "text" },
		{ text: ")", color: "punct" },
		{ text: ".to.equal", color: "text" },
		{ text: "(", color: "punct" },
		{ text: "200", color: "num" },
		{ text: ");", color: "punct" },
	],
	[{ text: "});", color: "punct" }],
	[{ text: " ", color: "text" }],
	[
		{ text: "pm.test", color: "key" },
		{ text: "(", color: "punct" },
		{ text: "\"returns user object\"", color: "str" },
		{ text: ", () => {", color: "punct" },
	],
	[{ text: "  const j = pm.response.json();", color: "text" }],
	[
		{ text: "  ", color: "punct" },
		{ text: "pm.expect", color: "key" },
		{ text: "(j).", color: "punct" },
		{ text: "to.have.property", color: "text" },
		{ text: "(", color: "punct" },
		{ text: "\"id\"", color: "str" },
		{ text: ");", color: "punct" },
	],
	[{ text: "});", color: "punct" }],
];

export function TestsTab() {
	const t = () => theme();

	return (
		<box flexDirection="column" flexGrow={1}>
			<box flexDirection="column" paddingLeft={2}>
				<For each={testPreview}>
					{(line) => (
						<text>
							<For each={line}>
								{(segment) => <S fg={colorFor(segment.color, t())}>{segment.text}</S>}
							</For>
						</text>
					)}
				</For>
			</box>
			<box flexGrow={1} />
		</box>
	);
}

function colorFor(color: TokenColor, t: Theme): string {
	return t[color];
}
