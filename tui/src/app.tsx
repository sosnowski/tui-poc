// Top-level App component. Composes the title bar / main / footer rows and
// renders modals on top via absolute positioning.

import { Show } from "solid-js";

import { TitleBar } from "./panels/title-bar";
import { CollectionsPane } from "./panels/collections-pane";
import { RequestEditor } from "./panels/request-editor";
import { ResponsePane } from "./panels/response-pane";
import { CommandStrip } from "./panels/command-strip";
import { StatusBar } from "./panels/status-bar";

import { Splash } from "./modals/splash";
import { CommandPalette } from "./modals/command-palette";
import { EnvironmentManager } from "./modals/environment-manager";
import { HistoryModal } from "./modals/history";
import { MethodModal } from "./modals/method";
import { DeleteConfirmModal } from "./modals/delete-confirm";
import { MoveRequestModal } from "./modals/move-request";
import { NewCollectionModal } from "./modals/new-collection";
import { ToastView } from "./modals/toast";

import { Spinner } from "./components/spinner";

import { loading, modal, theme } from "./state/store";
import { useGlobalKeyboard } from "./state/keyboard";
import { useEditorKeyboard } from "./state/editor-keyboard";
import { useResponseKeyboard } from "./state/response-keyboard";

export function App() {
	useGlobalKeyboard();
	useEditorKeyboard();
	useResponseKeyboard();

	const t = () => theme();

	return (
		<box flexDirection="column" padding={0} margin={0} flexGrow={1} backgroundColor={t().bg}>
			<Show
				when={!loading()}
				fallback={
					<box
						flexDirection="column"
						flexGrow={1}
						justifyContent="center"
						alignItems="center"
						rowGap={1}
					>
						<text><Spinner /></text>
						<text fg={t().textDim}>Loading collections…</text>
					</box>
				}
			>
				<TitleBar />

				{/* Main 3-pane layout */}
				<box flexDirection="row" flexGrow={1}>
					<CollectionsPane />
					<box flexDirection="column" flexGrow={1}>
						<RequestEditor />
						<ResponsePane />
					</box>
				</box>

				<CommandStrip />
				<StatusBar />

				{/* Modal layer */}
				<Show when={modal() === "splash"}>
					<Splash />
				</Show>
				<Show when={modal() === "command"}>
					<CommandPalette />
				</Show>
				<Show when={modal() === "env"}>
					<EnvironmentManager />
				</Show>
				<Show when={modal() === "history"}>
					<HistoryModal />
				</Show>
				<Show when={modal() === "method" || modal() === "newMethod"}>
					<MethodModal />
				</Show>
				<Show when={modal() === "newCollection"}>
					<NewCollectionModal />
				</Show>
				<Show when={modal() === "moveRequest"}>
					<MoveRequestModal />
				</Show>
				<Show when={modal() === "deleteConfirm"}>
					<DeleteConfirmModal />
				</Show>

				{/* Toast layer (always mounted, only renders when toast() is set) */}
				<ToastView />
			</Show>
		</box>
	);
}
