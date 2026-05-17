import { createMemo, createSignal } from "solid-js";

import { isPlainKey, moveIndex } from "../../keyboard/helpers";
import { useKeyScope } from "../../keyboard/use-key-scope";
import type { KeyBinding } from "../../keyboard/types";
import {
	activeRequestId,
	collections,
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

	const currentItem = () => args.flatItems()[cursorIndex()];
	const itemIsRequestLike = () => {
		const it = currentItem();
		return it?.kind === "request" || it?.kind === "pinned";
	};

	useKeyScope({
		id: "collections",
		priority: 10,
		active: () => args.isFocused(),
		bindings: (): KeyBinding[] => [
			{
				match: "up",
				run: () => moveCursor(-1),
				hint: { k: "↑↓←→↵", label: "nav" },
			},
			{
				match: "down",
				run: () => moveCursor(1),
			},
			{
				match: "left",
				run: () => {
					const item = currentItem();
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
				},
			},
			{
				match: "right",
				run: () => {
					const item = currentItem();
					if (!item) return;
					if (item.kind !== "directory") return;
					if (!args.expanded()[item.id]) {
						args.toggle(item.id);
						return;
					}
					const node = findNode(collections(), item.id);
					if (node?.children[0]) {
						setCursorKey(dirKey(node.children[0].id));
					} else if (node?.requests[0]) {
						setCursorKey(reqKey(node.requests[0].id));
					}
				},
			},
			{
				match: (e) => (e.name === "return" || e.name === "enter") && !e.ctrl && !e.meta,
				run: () => {
					const item = currentItem();
					if (!item) return;
					if (item.kind === "directory") args.toggle(item.id);
					else setActiveRequestId(item.id);
				},
			},
			{
				match: (e) => isPlainKey(e, "p"),
				run: () => {
					const item = currentItem();
					if (!item) return;
					if (item.kind !== "pinned" && item.kind !== "request") return;
					togglePin(item.id);
					if (item.kind === "pinned") setCursorKey(reqKey(item.id));
				},
				when: itemIsRequestLike,
				hint: { k: "p", label: "pin" },
			},
			{
				match: (e) => isPlainKey(e, "c"),
				run: () => openModal("newCollection"),
				hint: { k: "c", label: "col" },
			},
			{
				match: (e) => isPlainKey(e, "n"),
				run: () => {
					const item = currentItem();
					if (!item) return;
					if (item.kind === "directory") {
						setNewRequestTarget(item.id);
					} else if (item.kind === "request") {
						setNewRequestTarget(item.parentId);
					}
					openModal("newMethod");
				},
				hint: { k: "n", label: "req" },
			},
			{
				match: (e) => isPlainKey(e, "d"),
				run: () => {
					const item = currentItem();
					if (!item) return;
					if (item.kind !== "request" && item.kind !== "pinned") return;
					setDeleteRequestId(item.id);
					openModal("deleteConfirm");
				},
				when: itemIsRequestLike,
				hint: { k: "d", label: "del" },
			},
		],
	});

	const isCursor = (key: string) => args.isFocused() && cursorKey() === key;

	return { cursorKey, setCursorKey, isCursor };
}
