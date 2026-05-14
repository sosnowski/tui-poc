import { createMemo, createSignal } from "solid-js";

import { slugify } from "@tuipostman/core";
import { SAMPLE_RESPONSE } from "../data";
import type {
	Collection,
	HttpMethod,
	KV,
	Request,
	RequestDetails,
	SampleResponse,
} from "../data/types";
import { pushToast } from "./app";
import {
	findCollectionPath,
	resolveCollectionDirPath,
	slugFromId,
	persistSaveRequest,
	persistDeleteRequest,
	persistMoveRequest,
	persistCreateCollection,
	debouncedSaveRequest,
} from "./persistence";

const [activeRequestId, setActiveRequestIdSig] = createSignal<string>("");
export { activeRequestId };

export function setActiveRequestId(id: string): void {
	setActiveRequestIdSig(id);
}

const [collections, setCollectionsSig] = createSignal<Collection[]>([]);
export { collections };

/**
 * Initialize the collections and request details from loaded data.
 * Called once on startup after reading from disk.
 */
export function initCollections(
	loadedCollections: Collection[],
	loadedDetails: Record<string, RequestDetails>,
): void {
	setCollectionsSig(loadedCollections);
	setRequestDetailsMap(normalizeDetailsMap(loadedDetails));

	const allIds = collectAllRequestIds(loadedCollections);
	if (allIds.length > 0) {
		setActiveRequestIdSig(allIds[0]!);
	}
}

function findRequest(nodes: Collection[], id: string): Request | undefined {
	for (const node of nodes) {
		const r = node.requests.find((req) => req.id === id);
		if (r) return r;
		const deep = findRequest(node.children, id);
		if (deep) return deep;
	}
	return undefined;
}

export const activeCollectionRequest = createMemo<Request | undefined>(() =>
	findRequest(collections(), activeRequestId()),
);

export const activeRequestName = createMemo<string>(
	() => activeCollectionRequest()?.name ?? activeRequestId(),
);

function findParentCollection(nodes: Collection[], id: string): Collection | null {
	for (const node of nodes) {
		if (node.requests.some((r) => r.id === id)) return node;
		const deep = findParentCollection(node.children, id);
		if (deep) return deep;
	}
	return null;
}

export const activeRequestParentName = createMemo<string>(() => {
	const parent = findParentCollection(collections(), activeRequestId());
	return parent?.name ?? "/";
});

const [pinnedRequestIds, setPinnedRequestIdsSig] = createSignal<string[]>([]);
export { pinnedRequestIds };

export function isPinned(id: string): boolean {
	return pinnedRequestIds().includes(id);
}

export function togglePin(id: string): void {
	setPinnedRequestIdsSig((prev) => {
		const idx = prev.indexOf(id);
		if (idx === -1) return [...prev, id];
		return prev.filter((x) => x !== id);
	});
}

const [requestDetailsMap, setRequestDetailsMap] = createSignal<Record<string, RequestDetails>>({});

const EMPTY_REQUEST: RequestDetails = {
	method: "GET",
	url: "",
	pathParams: [],
	params: [],
	headers: [],
	body: null,
	bodyType: "none",
};

export const hasActiveRequest = createMemo<boolean>(() => {
	const id = activeRequestId();
	if (!id) return false;
	if (requestDetailsMap()[id]) return true;
	return !!findRequest(collections(), id);
});

export const activeRequest = createMemo<RequestDetails>(() => {
	const id = activeRequestId();
	if (!id) return EMPTY_REQUEST;

	const existing = requestDetailsMap()[id];
	if (existing) return existing;

	const collReq = findRequest(collections(), id);
	if (collReq) {
		return {
			method: collReq.method,
			url: collReq.url,
			pathParams: syncPathParams(collReq.url, []),
			params: [],
			headers: [],
			body: null,
			bodyType: "none",
		};
	}

	return EMPTY_REQUEST;
});

function updateActive(updater: (r: RequestDetails) => RequestDetails): void {
	setRequestDetailsMap((prev) => {
		const id = activeRequestId();
		const cur = prev[id] ?? activeRequest();
		return { ...prev, [id]: updater(cur) };
	});
}

function normalizeDetailsMap(
	detailsMap: Record<string, RequestDetails>,
): Record<string, RequestDetails> {
	return Object.fromEntries(
		Object.entries(detailsMap).map(([id, details]) => [
			id,
			{ ...details, pathParams: syncPathParams(details.url, details.pathParams) },
		]),
	);
}

export function requestMethod(id: string, fallback: HttpMethod): HttpMethod {
	return requestDetailsMap()[id]?.method ?? fallback;
}

export function setActiveRequestMethod(method: HttpMethod): void {
	updateActive((r) => ({ ...r, method }));

	const id = activeRequestId();
	const req = findRequest(collections(), id);
	const colPath = findCollectionPath(collections(), id);
	if (req && colPath) {
		const details = requestDetailsMap()[id] ?? activeRequest();
		persistSaveRequest(colPath, req.name, { ...details, method }, slugFromId(id));
	}

	pushToast(`method: ${method}`, "ok");
}

function mapRequests(
	nodes: Collection[],
	requestId: string,
	fn: (r: Request) => Request,
): Collection[] {
	return nodes.map((node) => ({
		...node,
		requests: node.requests.map((r) => (r.id === requestId ? fn(r) : r)),
		children: mapRequests(node.children, requestId, fn),
	}));
}

export function setActiveRequestName(name: string): void {
	const id = activeRequestId();
	const oldReq = findRequest(collections(), id);
	const colPath = findCollectionPath(collections(), id);

	setCollectionsSig((prev) => mapRequests(prev, id, (r) => ({ ...r, name })));

	if (colPath && oldReq) {
		const details = requestDetailsMap()[id] ?? activeRequest();
		const oldSlug = slugFromId(id);
		const newSlug = slugify(name) || "untitled";
		persistSaveRequest(colPath, name, details, oldSlug !== newSlug ? oldSlug : undefined);

		if (oldSlug !== newSlug) {
			const newId = `${colPath}/${newSlug}`;
			setCollectionsSig((prev) => mapRequests(prev, id, (r) => ({ ...r, id: newId })));
			setRequestDetailsMap((prev) => {
				const next = { ...prev };
				const d = next[id];
				if (d) {
					delete next[id];
					next[newId] = d;
				}
				return next;
			});
			setPinnedRequestIdsSig((prev) => prev.map((pid) => (pid === id ? newId : pid)));
			if (activeRequestId() === id) setActiveRequestIdSig(newId);
		}
	}
}

export function setActiveRequestUrl(url: string): void {
	updateActive((r) => ({ ...r, url, pathParams: syncPathParams(url, r.pathParams) }));
	scheduleDebouncedSave();
}

function syncPathParams(url: string, current: KV[]): KV[] {
	const keys = extractPathParamKeys(url);
	return keys.map(
		(key) => current.find((p) => p.key === key) ?? { key, value: "", enabled: true },
	);
}

function extractPathParamKeys(url: string): string[] {
	const path = url.split(/[?#]/, 1)[0] ?? "";
	const keys: string[] = [];
	const seen = new Set<string>();
	const paramPattern = /(?:^|\/):([A-Za-z_][A-Za-z0-9_]*)(?=$|\/|[^A-Za-z0-9_])/g;

	for (const match of path.matchAll(paramPattern)) {
		const key = match[1];
		if (!key || seen.has(key)) continue;
		seen.add(key);
		keys.push(key);
	}

	return keys;
}

function normalizePathParamKey(value: string): string | null {
	const key = value.trim().replace(/^:/, "");
	return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : null;
}

function replacePathParamKey(url: string, oldKey: string, newKey: string): string {
	const splitAt = url.search(/[?#]/);
	const path = splitAt === -1 ? url : url.slice(0, splitAt);
	const suffix = splitAt === -1 ? "" : url.slice(splitAt);
	const keyPattern = new RegExp(`(^|/):${escapeRegExp(oldKey)}(?=$|/|[^A-Za-z0-9_])`, "g");

	return `${path.replace(keyPattern, `$1:${newKey}`)}${suffix}`;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toggleHeader(idx: number): void {
	updateActive((r) => ({
		...r,
		headers: r.headers.map((h, i) =>
			i === idx ? { ...h, enabled: h.enabled === false ? true : false } : h,
		),
	}));
	scheduleDebouncedSave();
}

export function toggleParam(idx: number): void {
	updateActive((r) => ({
		...r,
		params: r.params.map((p, i) =>
			i === idx ? { ...p, enabled: p.enabled === false ? true : false } : p,
		),
	}));
	scheduleDebouncedSave();
}

export function togglePathParam(idx: number): void {
	updateActive((r) => ({
		...r,
		pathParams: r.pathParams.map((p, i) =>
			i === idx ? { ...p, enabled: p.enabled === false ? true : false } : p,
		),
	}));
	scheduleDebouncedSave();
}

export function setHeaderCell(idx: number, col: 0 | 1, value: string): void {
	updateActive((r) => ({
		...r,
		headers: r.headers.map((h, i) =>
			i === idx ? (col === 0 ? { ...h, key: value } : { ...h, value }) : h,
		),
	}));
	scheduleDebouncedSave();
}

export function setParamCell(idx: number, col: 0 | 1 | 2, value: string): void {
	updateActive((r) => ({
		...r,
		params: r.params.map((p, i) => {
			if (i !== idx) return p;
			if (col === 0) return { ...p, key: value };
			if (col === 1) return { ...p, value };
			return { ...p, desc: value };
		}),
	}));
	scheduleDebouncedSave();
}

export function setPathParamCell(idx: number, col: 0 | 1 | 2, value: string): void {
	updateActive((r) => ({
		...r,
		...updatePathParam(r, idx, col, value),
	}));
	scheduleDebouncedSave();
}

function updatePathParam(
	request: RequestDetails,
	idx: number,
	col: 0 | 1 | 2,
	value: string,
): Pick<RequestDetails, "url" | "pathParams"> {
	const current = request.pathParams[idx];
	if (!current) return { url: request.url, pathParams: request.pathParams };

	if (col === 0) {
		const key = normalizePathParamKey(value);
		if (!key) return { url: request.url, pathParams: request.pathParams };

		const url = replacePathParamKey(request.url, current.key, key);
		const pathParams = request.pathParams.map((p, i) => (i === idx ? { ...p, key } : p));
		return { url, pathParams: syncPathParams(url, pathParams) };
	}

	return {
		url: request.url,
		pathParams: request.pathParams.map((p, i) => {
			if (i !== idx) return p;
			if (col === 1) return { ...p, value };
			return { ...p, desc: value };
		}),
	};
}

function scheduleDebouncedSave(): void {
	const id = activeRequestId();
	const req = findRequest(collections(), id);
	const colPath = findCollectionPath(collections(), id);
	if (!colPath || !req) return;
	const details = requestDetailsMap()[id] ?? activeRequest();
	debouncedSaveRequest(colPath, id, req.name, details);
}

function insertChild(nodes: Collection[], parentId: string, child: Collection): Collection[] {
	return nodes.map((node) => {
		if (node.id === parentId) {
			return { ...node, expanded: true, children: [...node.children, child] };
		}
		return { ...node, children: insertChild(node.children, parentId, child) };
	});
}

export function addCollection(name: string, parentId: string | null): void {
	const colPath = resolveCollectionDirPath(parentId, name);
	const newNode: Collection = { id: colPath, name, expanded: true, children: [], requests: [] };

	if (parentId === null) {
		setCollectionsSig((prev) => [...prev, newNode]);
	} else {
		setCollectionsSig((prev) => insertChild(prev, parentId, newNode));
	}

	persistCreateCollection(colPath);
	pushToast(`created "${name}"`, "ok");
}

const [moveRequestId, setMoveRequestIdSig] = createSignal<string | null>(null);
export { moveRequestId };

export function setMoveRequestId(id: string | null): void {
	setMoveRequestIdSig(id);
}

const [deleteRequestId, setDeleteRequestIdSig] = createSignal<string | null>(null);
export { deleteRequestId };

export function setDeleteRequestId(id: string | null): void {
	setDeleteRequestIdSig(id);
}

function collectAllRequestIds(nodes: Collection[]): string[] {
	const ids: string[] = [];
	for (const node of nodes) {
		for (const r of node.requests) ids.push(r.id);
		ids.push(...collectAllRequestIds(node.children));
	}
	return ids;
}

export function deleteRequest(): void {
	const reqId = deleteRequestId();
	if (!reqId) return;

	const req = findRequest(collections(), reqId);
	if (!req) return;

	const wasActive = activeRequestId() === reqId;

	setCollectionsSig((prev) => removeRequest(prev, reqId));

	setPinnedRequestIdsSig((prev) => prev.filter((id) => id !== reqId));

	setRequestDetailsMap((prev) => {
		const next = { ...prev };
		delete next[reqId];
		return next;
	});

	if (wasActive) {
		const allIds = collectAllRequestIds(collections());
		setActiveRequestIdSig(allIds[0] ?? "");
		setResponseSig(null);
	}

	persistDeleteRequest(reqId);
	setDeleteRequestIdSig(null);
	pushToast(`deleted "${req.name}"`, "ok");
}

function removeRequest(nodes: Collection[], requestId: string): Collection[] {
	return nodes.map((node) => ({
		...node,
		requests: node.requests.filter((r) => r.id !== requestId),
		children: removeRequest(node.children, requestId),
	}));
}

export function moveRequest(targetCollectionId: string): void {
	const reqId = moveRequestId();
	if (!reqId) return;

	const req = findRequest(collections(), reqId);
	if (!req) return;

	const details = requestDetailsMap()[reqId];

	setCollectionsSig((prev) => {
		const after = removeRequest(prev, reqId);
		return insertRequest(after, targetCollectionId, req);
	});

	persistMoveRequest(reqId, targetCollectionId, req.name).then((newId) => {
		setCollectionsSig((prev) => mapRequests(prev, reqId, (r) => ({ ...r, id: newId })));
		if (details) {
			setRequestDetailsMap((prev) => {
				const next = { ...prev };
				delete next[reqId];
				next[newId] = details;
				return next;
			});
		}
		setPinnedRequestIdsSig((prev) => prev.map((pid) => (pid === reqId ? newId : pid)));
		if (activeRequestId() === reqId) setActiveRequestIdSig(newId);
	});

	setMoveRequestIdSig(null);
	pushToast(`moved "${req.name}"`, "ok");
}

const [newRequestTarget, setNewRequestTargetSig] = createSignal<string | null>(null);
export { newRequestTarget };

export function setNewRequestTarget(id: string | null): void {
	setNewRequestTargetSig(id);
}

function insertRequest(nodes: Collection[], targetId: string, request: Request): Collection[] {
	return nodes.map((node) => {
		if (node.id === targetId) {
			return { ...node, expanded: true, requests: [...node.requests, request] };
		}
		return { ...node, children: insertRequest(node.children, targetId, request) };
	});
}

export function createNewRequest(method: HttpMethod): void {
	const name = `New ${method} request`;
	const target = newRequestTarget();
	const colPath = target ?? collections()[0]?.id;
	if (!colPath) return;

	const slug = slugify(name) || "untitled";
	const id = `${colPath}/${slug}`;
	const newRequest: Request = { id, method, name, url: "" };

	if (target) {
		setCollectionsSig((prev) => insertRequest(prev, target, newRequest));
	} else {
		setCollectionsSig((prev) => {
			if (prev.length === 0) return prev;
			const first = prev[0]!;
			return [
				{ ...first, expanded: true, requests: [...first.requests, newRequest] },
				...prev.slice(1),
			];
		});
	}

	setNewRequestTargetSig(null);

	const details: RequestDetails = {
		method,
		url: "",
		pathParams: [],
		params: [],
		headers: [],
		body: null,
		bodyType: "none",
	};
	setRequestDetailsMap((prev) => ({ ...prev, [id]: details }));

	persistSaveRequest(colPath, name, details);

	setActiveRequestIdSig(id);
}

const [sending, setSendingSig] = createSignal<boolean>(false);
export { sending };

const [response, setResponseSig] = createSignal<SampleResponse | null>(null);
export { response };

export function fireRequest(): void {
	setSendingSig(true);
	setResponseSig(null);
	setTimeout(() => {
		setSendingSig(false);
		setResponseSig(SAMPLE_RESPONSE);
		pushToast("200 OK · 184ms", "ok");
	}, 1400);
}
