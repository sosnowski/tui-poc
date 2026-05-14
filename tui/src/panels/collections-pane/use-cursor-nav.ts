import { createMemo, createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import type { KeyEvent } from "@opentui/core";

import { isPlainKey, moveIndex } from "../../keyboard/helpers";
import {
	activeRequestId,
	collections,
	modal,
	openModal,
	setActiveRequestId,
	setDeleteRequestId,
	setNewRequestTarget,
	togglePin,
} from "../../state/store";
import type { Collection } from "../../data/types";
import { type FlatItem, dirKey, reqKey } from "./tree";

interface UseCursorNavArgs {
	flatItems: () => FlatItem[];
	isFocused: () => boolean;
	expanded: () => Record<string, boolean>;
	toggle: (id: string) => void;
}

function findNode(nodes: Collection[], id: string): Collection | undefined {
	for (const n of nodes) {
		if (n.id === id) return n;
		const deep = findNode(n.children, id);
		if (deep) return deep;
	}
	return undefined;
}

export function useCursorNav(args: UseCursorNavArgs) {
	const [cursorKey, setCursorKey] = createSignal<string>(reqKey(activeRequestId()));

	const cursorIndex = createMemo(() => {
		const key = cursorKey();
		const items = args.flatItems();
		const i = items.findIndex((x) => x.key === key);
		return i >= 0 ? i : 0;
	});

	function moveCursor(delta: number): void {
		const items = args.flatItems();
		if (items.length === 0) return;
		const next = moveIndex(cursorIndex(), delta, items.length);
		const item = items[next];
		if (!item) return;
		setCursorKey(item.key);
		if (item.kind === "request" || item.kind === "pinned") {
			setActiveRequestId(item.id);
		}
	}

	useKeyboard((e: KeyEvent) => {
		if (!args.isFocused()) return;
		if (modal() !== null) return;

		const item = args.flatItems()[cursorIndex()];

		switch (e.name) {
			case "up":
				moveCursor(-1);
				return;
			case "down":
				moveCursor(1);
				return;
			case "left":
				if (!item) return;
				if (item.kind === "directory") {
					if (args.expanded()[item.id]) {
						args.toggle(item.id);
					} else if (item.parentId) {
						setCursorKey(dirKey(item.parentId));
					}
				} else if (item.kind === "request") {
					setCursorKey(dirKey(item.parentId));
				}
				return;
			case "right":
				if (!item) return;
				if (item.kind === "directory") {
					if (!args.expanded()[item.id]) {
						args.toggle(item.id);
					} else {
						const node = findNode(collections(), item.id);
						if (node?.children[0]) {
							setCursorKey(dirKey(node.children[0].id));
						} else if (node?.requests[0]) {
							setCursorKey(reqKey(node.requests[0].id));
						}
					}
				}
				return;
			case "return":
				if (e.ctrl || e.meta) return;
				if (!item) return;
				if (item.kind === "directory") args.toggle(item.id);
				else setActiveRequestId(item.id);
				return;
			case "p":
				if (!isPlainKey(e, "p")) return;
				if (!item) return;
				if (item.kind !== "pinned" && item.kind !== "request") return;
				togglePin(item.id);
				if (item.kind === "pinned") setCursorKey(reqKey(item.id));
				return;
			case "c":
				if (!isPlainKey(e, "c")) return;
				openModal("newCollection");
				return;
		case "n":
			if (!isPlainKey(e, "n")) return;
			if (!item) return;
			if (item.kind === "directory") {
				setNewRequestTarget(item.id);
			} else if (item.kind === "request") {
				setNewRequestTarget(item.parentId);
			}
			openModal("newMethod");
			return;
		case "d":
			if (!isPlainKey(e, "d")) return;
			if (!item) return;
			if (item.kind !== "request" && item.kind !== "pinned") return;
			setDeleteRequestId(item.id);
			openModal("deleteConfirm");
			return;
		}
	});

	const isCursor = (key: string) => args.isFocused() && cursorKey() === key;

	return { cursorKey, setCursorKey, isCursor };
}
