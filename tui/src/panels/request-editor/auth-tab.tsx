import { S } from "../../components/styled-span";
import { useEditorAuthScope } from "../../keyboard/scopes/editor";
import { authCursor, theme } from "../../state/store";
import { vars } from "../../utils/highlight";
import { RadioStrip } from "./radio-strip";

export function AuthTab() {
	useEditorAuthScope();

	const t = () => theme();
	const auth = () => authCursor();

	return (
		<box flexDirection="column" flexGrow={1}>
			<RadioStrip
				label="type"
				labelWidth={11}
				rowCursor={auth().row === 0}
				selectedId="bearer"
				cursorIndex={auth().typeIndex}
				highlightCursor={auth().row === 0}
				options={authTypeOptions}
			/>

			<box
				flexDirection="row"
				height={1}
				backgroundColor={auth().row === 1 ? t().selBg : undefined}
			>
				<text fg={t().accent} width={2}>
					{auth().row === 1 ? "▶ " : "  "}
				</text>
				<text fg={auth().row === 1 ? t().selFg : t().text2} width={11}>
					token
				</text>
				<text>{vars("{{api_token}}")}</text>
			</box>

			<box flexDirection="row" height={1} paddingTop={1}>
				<text width={2}>{"  "}</text>
				<text fg={t().textDim}>
					<S>resolves to: </S>
					<S fg={t().text2}>Bearer stg_8f3a2c1b9e7d4f6a8c2e1b5d3f7a9c4e</S>
				</text>
			</box>

			<box flexGrow={1} />
		</box>
	);
}

const authTypeOptions = [
	{ id: "none", label: "none" },
	{ id: "bearer", label: "bearer token" },
	{ id: "basic", label: "basic" },
	{ id: "api-key", label: "api-key" },
	{ id: "oauth2", label: "oauth2" },
];
