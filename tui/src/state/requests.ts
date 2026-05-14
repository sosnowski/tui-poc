import { createMemo, createSignal } from "solid-js";

import { slugify } from "@tuipostman/core";
import { SAMPLE_RESPONSE } from "../data";
import type {
	Collection,
	HttpMethod,
	KV,
	Preset,
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
	setPresetsMap(
		Object.fromEntries(
			Object.entries(loadedDetails).map(([id, details]) => {
				const req = findRequest(loadedCollections, id);
				const syncedPathParams = req
					? syncPathParams(req.url, details.pathParams)
					: details.pathParams;
				return [
					id,
					{
						":default": {
							...detailsToPreset(details),
							pathParams: syncedPathParams,
						},
					},
				];
			}),
		),
	);

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

const [presetsMap, setPresetsMap] = createSignal<Record<string, Record<string, Preset>>>({});

const EMPTY_REQUEST: RequestDetails = {
	method: "GET",
	url: "",
	pathParams: [],
	params: [],
	headers: [],
	body: null,
	bodyType: "none",
};

const EMPTY_PRESET: Preset = {
	pathParams: [],
	params: [],
	headers: [],
	body: null,
	bodyType: "none",
};

export const hasActiveRequest = createMemo<boolean>(() => {
	const id = activeRequestId();
	if (!id) return false;
	if (presetsMap()[id]) return true;
	return !!findRequest(collections(), id);
});

export const activeRequest = createMemo<RequestDetails>(() => {
	const id = activeRequestId();
	if (!id) return EMPTY_REQUEST;

	const collReq = findRequest(collections(), id);
	if (!collReq) return EMPTY_REQUEST;

	const presets = presetsMap()[id];
	const defaultPreset = presets?.[":default"];
	if (!defaultPreset) {
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

	return {
		method: collReq.method,
		url: collReq.url,
		pathParams: syncPathParams(collReq.url, defaultPreset.pathParams),
		params: defaultPreset.params,
		headers: defaultPreset.headers,
		body: defaultPreset.body,
		bodyType: defaultPreset.bodyType,
	};
});

function detailsToPreset(details: RequestDetails): Preset {
	return {
		pathParams: details.pathParams,
		params: details.params,
		headers: details.headers,
		body: details.body,
		bodyType: details.bodyType,
	};
}

function updateActive(updater: (r: RequestDetails) => RequestDetails): void {
	setPresetsMap((prev) => {
		const id = activeRequestId();
		const cur = activeRequest();
		const next = updater(cur);
		return {
			...prev,
			[id]: {
				...(prev[id] ?? {}),
				":default": {
					pathParams: next.pathParams,
					params: next.params,
					headers: next.headers,
					body: next.body,
					bodyType: next.bodyType,
				},
			},
		};
	});
}

export function requestMethod(id: string, fallback: HttpMethod): HttpMethod {
	const req = findRequest(collections(), id);
	return req?.method ?? fallback;
}

export function setActiveRequestMethod(method: HttpMethod): void {
	const id = activeRequestId();
	setCollectionsSig((prev) => mapRequests(prev, id, (r) => ({ ...r, method })));

	const req = findRequest(collections(), id);
	const colPath = findCollectionPath(collections(), id);
	if (req && colPath) {
		const details = buildMergedDetails(id);
		persistSaveRequest(colPath, req.name, details, slugFromId(id));
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
		const details = buildMergedDetails(id);
		const oldSlug = slugFromId(id);
		const newSlug = slugify(name) || "untitled";
		persistSaveRequest(colPath, name, details, oldSlug !== newSlug ? oldSlug : undefined);

		if (oldSlug !== newSlug) {
			const newId = `${colPath}/${newSlug}`;
			setCollectionsSig((prev) => mapRequests(prev, id, (r) => ({ ...r, id: newId })));
			setPresetsMap((prev) => {
				const next = { ...prev };
				const p = next[id];
				if (p) {
					delete next[id];
					next[newId] = p;
				}
				return next;
			});
			setPinnedRequestIdsSig((prev) => prev.map((pid) => (pid === id ? newId : pid)));
			if (activeRequestId() === id) setActiveRequestIdSig(newId);
		}
	}
}

export function setActiveRequestUrl(url: string): void {
	const id = activeRequestId();
	setCollectionsSig((prev) => mapRequests(prev, id, (r) => ({ ...r, url })));

	// Resync path param keys for ALL presets of this request
	setPresetsMap((prev) => {
		const requestPresets = prev[id];
		if (!requestPresets) return prev;
		const next: Record<string, Preset> = {};
		for (const [name, preset] of Object.entries(requestPresets)) {
			next[name] = { ...preset, pathParams: syncPathParams(url, preset.pathParams) };
		}
		return { ...prev, [id]: next };
	});

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
	const keyPattern = new RegExp(`(^|\/):${escapeRegExp(oldKey)}(?=$|\/|[^A-Za-z0-9_])`, "g");

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
	if (col === 0) {
		const id = activeRequestId();
		const req = findRequest(collections(), id);
		if (!req) return;
		const current = activeRequest().pathParams[idx];
		if (!current) return;
		const key = normalizePathParamKey(value);
		if (!key) return;
		const newUrl = replacePathParamKey(req.url, current.key, key);

		// Update URL in collections (request-level)
		setCollectionsSig((prev) => mapRequests(prev, id, (r) => ({ ...r, url: newUrl })));

		// Update path param keys for ALL presets
		setPresetsMap((prev) => {
			const requestPresets = prev[id];
			if (!requestPresets) return prev;
			const next: Record<string, Preset> = {};
			for (const [name, preset] of Object.entries(requestPresets)) {
				next[name] = {
					...preset,
					pathParams: preset.pathParams.map((p, i) =>
						i === idx ? { ...p, key } : p,
					),
				};
			}
			return { ...prev, [id]: next };
		});
	} else {
		updateActive((r) => ({
			...r,
			pathParams: r.pathParams.map((p, i) => {
				if (i !== idx) return p;
				if (col === 1) return { ...p, value };
				return { ...p, desc: value };
			}),
		}));
	}
	scheduleDebouncedSave();
}

function scheduleDebouncedSave(): void {
	const id = activeRequestId();
	const req = findRequest(collections(), id);
	const colPath = findCollectionPath(collections(), id);
	if (!colPath || !req) return;
	const details = buildMergedDetails(id);
	debouncedSaveRequest(colPath, id, req.name, details);
}

function buildMergedDetails(id: string): RequestDetails {
	const req = findRequest(collections(), id);
	if (!req) return EMPTY_REQUEST;
	const presets = presetsMap()[id];
	const defaultPreset = presets?.[":default"] ?? EMPTY_PRESET;
	return {
		method: req.method,
		url: req.url,
		pathParams: syncPathParams(req.url, defaultPreset.pathParams),
		params: defaultPreset.params,
		headers: defaultPreset.headers,
		body: defaultPreset.body,
		bodyType: defaultPreset.bodyType,
	};
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

	setPresetsMap((prev) => {
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

	const presets = presetsMap()[reqId];

	setCollectionsSig((prev) => {
		const after = removeRequest(prev, reqId);
		return insertRequest(after, targetCollectionId, req);
	});

	persistMoveRequest(reqId, targetCollectionId, req.name).then((newId) => {
		setCollectionsSig((prev) => mapRequests(prev, reqId, (r) => ({ ...r, id: newId })));
		if (presets) {
			setPresetsMap((prev) => {
				const next = { ...prev };
				delete next[reqId];
				next[newId] = presets;
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

	const defaultPreset: Preset = {
		pathParams: [],
		params: [],
		headers: [],
		body: null,
		bodyType: "none",
	};
	setPresetsMap((prev) => ({ ...prev, [id]: { ":default": defaultPreset } }));

	const details: RequestDetails = {
		method,
		url: "",
		pathParams: [],
		params: [],
		headers: [],
		body: null,
		bodyType: "none",
	};
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
