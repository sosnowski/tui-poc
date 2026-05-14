import { For, Show, createMemo, createSignal } from "solid-js";

import { Pane } from "../../components/pane";
import { focusedPane, setFocusedPane } from "../../state/app";
import { collections } from "../../state/store";

import { DirectoryRow } from "./directory-row";
import { Footer } from "./footer";
import { PinnedSection } from "./pinned-section";
import { RequestRow } from "./request-row";
import type { Collection } from "../../data/types";
import { useFlatTree } from "./tree";
import { useCursorNav } from "./use-cursor-nav";

function collectExpanded(nodes: Collection[]): Record<string, boolean> {
	const out: Record<string, boolean> = {};
	for (const n of nodes) {
		out[n.id] = n.expanded;
		Object.assign(out, collectExpanded(n.children));
	}
	return out;
}

function findNode(nodes: Collection[], id: string): Collection | undefined {
	for (const n of nodes) {
		if (n.id === id) return n;
		const deep = findNode(n.children, id);
		if (deep) return deep;
	}
	return undefined;
}

export function CollectionsPane() {
	const isFocused = () => focusedPane() === "collections";

	const [expanded, setExpanded] = createSignal<Record<string, boolean>>(
		collectExpanded(collections()),
	);
	const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

	const { pinnedRequests, flatItems } = useFlatTree({ expanded });
	const { setCursorKey, isCursor } = useCursorNav({
		flatItems,
		isFocused,
		expanded,
		toggle,
	});

	const nodeById = createMemo(() => {
		const map: Record<string, Collection> = {};
		function walk(nodes: Collection[]) {
			for (const n of nodes) {
				map[n.id] = n;
				walk(n.children);
			}
		}
		walk(collections());
		return map;
	});

	return (
		<Pane
			title="collections"
			focused={isFocused()}
			flexGrow={0}
			width={32}
			padding={1}
			paddingBottom={0}
		>
			<box
				flexDirection="column"
				flexGrow={1}
				onMouseDown={() => setFocusedPane("collections")}
			>
				<PinnedSection
					requests={pinnedRequests}
					isCursor={isCursor}
					setCursorKey={setCursorKey}
				/>

				<For each={flatItems()}>
					{(item) => (
						<Show when={item.kind !== "pinned"} fallback={null}>
							{item.kind === "directory" ? (
								<DirectoryRow
									collection={nodeById()[item.id]!}
									expanded={!!expanded()[item.id]}
									depth={item.depth}
									cursor={isCursor(item.key)}
									setCursorKey={setCursorKey}
									onToggle={() => toggle(item.id)}
								/>
							) : item.kind === "request" ? (
								<RequestRow
									request={{
										id: item.id,
										method: item.method,
										name: item.name,
										url: "",
									}}
									depth={item.depth}
									last={item.last}
									cursor={isCursor(item.key)}
									setCursorKey={setCursorKey}
								/>
							) : null}
						</Show>
					)}
				</For>

				<box flexGrow={1} />
				<Footer />
			</box>
		</Pane>
	);
}
