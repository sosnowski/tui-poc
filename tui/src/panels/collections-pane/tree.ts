import { createMemo } from "solid-js";

import type { Collection, HttpMethod, Request } from "../../data/types";
import { collections, pinnedRequestIds } from "../../state/store";

export type PinnedItem = {
	kind: "pinned";
	key: string;
	id: string;
	method: HttpMethod;
	name: string;
};
export type DirectoryItem = {
	kind: "directory";
	key: string;
	id: string;
	parentId: string | null;
	depth: number;
};
export type RequestItem = {
	kind: "request";
	key: string;
	id: string;
	parentId: string;
	depth: number;
	method: HttpMethod;
	name: string;
	last: boolean;
};
export type FlatItem = PinnedItem | DirectoryItem | RequestItem;

export const pinKey = (id: string) => `pin:${id}`;
export const dirKey = (id: string) => `dir:${id}`;
export const reqKey = (id: string) => `req:${id}`;

interface UseFlatTreeArgs {
	expanded: () => Record<string, boolean>;
}

function collectAllRequests(nodes: Collection[]): Record<string, Request> {
	const out: Record<string, Request> = {};
	for (const node of nodes) {
		for (const r of node.requests) out[r.id] = r;
		Object.assign(out, collectAllRequests(node.children));
	}
	return out;
}

function countRequests(node: Collection): number {
	let n = node.requests.length;
	for (const child of node.children) n += countRequests(child);
	return n;
}

export { countRequests };

function flattenNodes(
	nodes: Collection[],
	expanded: Record<string, boolean>,
	parentId: string | null,
	depth: number,
	out: FlatItem[],
): void {
	for (const node of nodes) {
		out.push({
			kind: "directory",
			key: dirKey(node.id),
			id: node.id,
			parentId,
			depth,
		});
		if (!expanded[node.id]) continue;
		flattenNodes(node.children, expanded, node.id, depth + 1, out);
		const reqs = node.requests;
		for (let i = 0; i < reqs.length; i++) {
			const r = reqs[i]!;
			out.push({
				kind: "request",
				key: reqKey(r.id),
				id: r.id,
				parentId: node.id,
				depth: depth + 1,
				method: r.method,
				name: r.name,
				last: i === reqs.length - 1 && node.children.length === 0,
			});
		}
	}
}

export function useFlatTree({ expanded }: UseFlatTreeArgs) {
	const requestsById = createMemo<Record<string, Request>>(() =>
		collectAllRequests(collections()),
	);

	const pinnedRequests = createMemo<Pick<Request, "id" | "method" | "name">[]>(() =>
		pinnedRequestIds()
			.map((id) => requestsById()[id])
			.filter((r): r is Request => r !== undefined),
	);

	const flatItems = createMemo<FlatItem[]>(() => {
		const out: FlatItem[] = [];
		for (const r of pinnedRequests()) {
			out.push({
				kind: "pinned",
				key: pinKey(r.id),
				id: r.id,
				method: r.method,
				name: r.name,
			});
		}
		flattenNodes(collections(), expanded(), null, 0, out);
		return out;
	});

	return { pinnedRequests, flatItems };
}
