import { Show } from "solid-js";

import { FileSearchPane } from "../components/file-search-pane";
import { Pane } from "../components/pane";
import { Scrim } from "../components/scrim";
import {
	attachBinaryFile,
	attachFormDataFile,
	attachFileTarget,
	closeModal,
} from "../state/store";

export function AttachBinaryFileModal() {
	const target = () => attachFileTarget();

	const title = () => {
		const t = target();
		if (t?.kind === "form-data") return "attach form-data file";
		return "attach binary file";
	};

	async function onAttach(path: string): Promise<void> {
		const t = target();
		if (t?.kind === "form-data") {
			await attachFormDataFile(t.rowIndex, path);
		} else {
			await attachBinaryFile(path);
		}
		closeModal();
	}

	return (
		<Scrim>
			<box width={100}>
				<Pane title={title()} accent>
					<Show when={target()}>
						<FileSearchPane onAttach={onAttach} onCancel={closeModal} />
					</Show>
				</Pane>
			</box>
		</Scrim>
	);
}
