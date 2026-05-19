import { createMemo, createSignal } from "solid-js";

import { executeRequest, slugify, copyBinaryAttachment, deleteBinaryAttachment } from "@tuipostman/core";
import type {
	BodyType,
	Collection,
	HttpMethod,
	KV,
	Preset,
	Request,
	RequestDetails,
	SampleResponse,
} from "../data/types";
import { contentTypeForBodyType } from "../data/body-type-options";
import { pushToast } from "./app";
import { activeEnv } from "./environments";
import {
	findCollectionPath,
	resolveCollectionDirPath,
	slugFromId,
	persistSaveRequest,
	persistDeleteRequest,
	persistMoveRequest,
	persistCreateCollection,
	debouncedSaveRequest,
	getDataDir,
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
	loadedPresets?: Record<string, Record<string, Preset>>,
): void {
	setCollectionsSig(loadedCollections);
	setPresetsMap(
		Object.fromEntries(
			Object.entries(loadedDetails).map(([id, details]) => {
				const req = findRequest(loadedCollections, id);
				const syncedPathParams = req
					? syncPathParams(req.url, details.pathParams)
					: details.pathParams;
				const filePresets = loadedPresets?.[id];
				return [
					id,
					{
						...filePresets,
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

const [activePresetMap, setActivePresetMapSig] = createSignal<Record<string, string>>({});
export { activePresetMap };

export function getActivePresetName(requestId: string): string {
	return activePresetMap()[requestId] ?? ":default";
}

export function setActivePresetForRequest(requestId: string, presetName: string): void {
	setActivePresetMapSig((prev) => ({ ...prev, [requestId]: presetName }));
}

export function activeRequestPresetNames(): string[] {
	const id = activeRequestId();
	const presets = presetsMap()[id];
	return presets ? Object.keys(presets) : [];
}

export function cycleActivePreset(): void {
	const id = activeRequestId();
	const names = activeRequestPresetNames();
	if (names.length === 0) return;

	const current = getActivePresetName(id);
	const idx = names.indexOf(current);
	const nextIdx = (idx + 1) % names.length;
	const next = names[nextIdx]!;
	setActivePresetForRequest(id, next);
}

export function createNewPreset(name: string): void {
	const trimmed = name.trim();
	if (!trimmed) {
		pushToast("preset name cannot be empty", "err");
		return;
	}

	const id = activeRequestId();
	const presets = presetsMap()[id];
	if (!presets) return;

	if (presets[trimmed]) {
		pushToast("preset already exists", "err");
		return;
	}

	const activeName = getActivePresetName(id);
	const source = presets[activeName] ?? EMPTY_PRESET;
	const cloned: Preset = JSON.parse(JSON.stringify(source));

	setPresetsMap((prev) => ({
		...prev,
		[id]: { ...prev[id], [trimmed]: cloned },
	}));

	setActivePresetForRequest(id, trimmed);
	scheduleDebouncedSave();
	pushToast(`preset "${trimmed}" created`, "ok");
}

const EMPTY_REQUEST: RequestDetails = {
	method: "GET",
	url: "",
	pathParams: [],
	params: [],
	headers: [],
	body: null,
	bodyType: "none",
	formUrlEncoded: [],
	binaryFile: null,
};

const EMPTY_PRESET: Preset = {
	pathParams: [],
	params: [],
	headers: [],
	body: null,
	bodyType: "none",
	formUrlEncoded: [],
	binaryFile: null,
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
	const activePresetName = getActivePresetName(id);
	const activePreset = presets?.[activePresetName] ?? presets?.[":default"];
	if (!activePreset) {
		return {
			method: collReq.method,
			url: collReq.url,
			pathParams: syncPathParams(collReq.url, []),
			params: [],
			headers: [],
			body: null,
			bodyType: "none",
			formUrlEncoded: [],
			binaryFile: null,
		};
	}

	return {
		method: collReq.method,
		url: collReq.url,
		pathParams: syncPathParams(collReq.url, activePreset.pathParams),
		params: activePreset.params,
		headers: activePreset.headers,
		body: activePreset.body,
		bodyType: activePreset.bodyType,
		formUrlEncoded: activePreset.formUrlEncoded ?? [],
		binaryFile: activePreset.binaryFile ?? null,
	};
});

function detailsToPreset(details: RequestDetails): Preset {
	return {
		pathParams: details.pathParams,
		params: details.params,
		headers: details.headers,
		body: details.body,
		bodyType: details.bodyType,
		formUrlEncoded: details.formUrlEncoded,
		binaryFile: details.binaryFile,
	};
}

function updateActive(updater: (r: RequestDetails) => RequestDetails): void {
	setPresetsMap((prev) => {
		const id = activeRequestId();
		const cur = activeRequest();
		const next = updater(cur);
		const activePresetName = getActivePresetName(id);
		return {
			...prev,
			[id]: {
				...(prev[id] ?? {}),
				[activePresetName]: {
					pathParams: next.pathParams,
					params: next.params,
					headers: next.headers,
					body: next.body,
					bodyType: next.bodyType,
					formUrlEncoded: next.formUrlEncoded,
					binaryFile: next.binaryFile,
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
		const presets = presetsMap()[id];
		persistSaveRequest(colPath, req.name, details, slugFromId(id), presets);
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
		const presets = presetsMap()[id];
		const oldSlug = slugFromId(id);
		const newSlug = slugify(name) || "untitled";
		persistSaveRequest(
			colPath,
			name,
			details,
			oldSlug !== newSlug ? oldSlug : undefined,
			presets,
		);

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

export function addQueryParam(index?: number): void {
	updateActive((r) => ({
		...r,
		params: insertKVRow(r.params, index),
	}));
	scheduleDebouncedSave();
}

export function addHeader(index?: number): void {
	updateActive((r) => ({
		...r,
		headers: insertKVRow(r.headers, index),
	}));
	scheduleDebouncedSave();
}

export function deleteQueryParam(idx: number): void {
	updateActive((r) => ({
		...r,
		params: r.params.filter((_, i) => i !== idx),
	}));
	scheduleDebouncedSave();
}

export function deleteHeader(idx: number): void {
	updateActive((r) => ({
		...r,
		headers: r.headers.filter((_, i) => i !== idx),
	}));
	scheduleDebouncedSave();
}

function insertKVRow(rows: KV[], index = rows.length): KV[] {
	const next = [...rows];
	next.splice(clampIndex(index, rows.length), 0, { key: "", value: "", enabled: true });
	return next;
}

function clampIndex(index: number, max: number): number {
	return Math.max(0, Math.min(index, max));
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
					pathParams: preset.pathParams.map((p, i) => (i === idx ? { ...p, key } : p)),
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
	const presets = presetsMap()[id];
	debouncedSaveRequest(colPath, id, req.name, details, presets);
}

function buildMergedDetails(id: string): RequestDetails {
	const req = findRequest(collections(), id);
	if (!req) return EMPTY_REQUEST;
	const presets = presetsMap()[id];
	const activePresetName = getActivePresetName(id);
	const activePreset = presets?.[activePresetName] ?? EMPTY_PRESET;
	return {
		method: req.method,
		url: req.url,
		pathParams: syncPathParams(req.url, activePreset.pathParams),
		params: activePreset.params,
		headers: activePreset.headers,
		body: activePreset.body,
		bodyType: activePreset.bodyType,
		formUrlEncoded: activePreset.formUrlEncoded ?? [],
		binaryFile: activePreset.binaryFile ?? null,
	};
}

function syncContentTypeHeader(headers: KV[], bodyType: BodyType): KV[] {
	const contentType = contentTypeForBodyType(bodyType);
	const idx = headers.findIndex((h) => h.key.trim().toLowerCase() === "content-type");

	if (contentType === null) {
		if (idx === -1) return headers;
		return headers.map((h, i) => (i === idx ? { ...h, enabled: false } : h));
	}

	if (idx === -1) {
		return [...headers, { key: "Content-Type", value: contentType, enabled: true }];
	}

	return headers.map((h, i) =>
		i === idx ? { ...h, key: "Content-Type", value: contentType, enabled: true } : h,
	);
}

export function setActiveBodyType(bodyType: BodyType): void {
	updateActive((r) => ({
		...r,
		bodyType,
		headers: syncContentTypeHeader(r.headers, bodyType),
	}));
	scheduleDebouncedSave();
}

export function toggleFormUrlEncoded(idx: number): void {
	updateActive((r) => ({
		...r,
		formUrlEncoded: r.formUrlEncoded.map((row, i) =>
			i === idx ? { ...row, enabled: row.enabled === false ? true : false } : row,
		),
	}));
	scheduleDebouncedSave();
}

export function addFormUrlEncoded(index?: number): void {
	updateActive((r) => ({
		...r,
		formUrlEncoded: insertKVRow(r.formUrlEncoded, index),
	}));
	scheduleDebouncedSave();
}

export function deleteFormUrlEncoded(idx: number): void {
	updateActive((r) => ({
		...r,
		formUrlEncoded: r.formUrlEncoded.filter((_, i) => i !== idx),
	}));
	scheduleDebouncedSave();
}

export function setFormUrlEncodedCell(idx: number, col: 0 | 1, value: string): void {
	updateActive((r) => ({
		...r,
		formUrlEncoded: r.formUrlEncoded.map((row, i) =>
			i === idx ? (col === 0 ? { ...row, key: value } : { ...row, value }) : row,
		),
	}));
	scheduleDebouncedSave();
}

export async function attachBinaryFile(sourcePath: string): Promise<void> {
	const id = activeRequestId();
	const req = findRequest(collections(), id);
	const colPath = findCollectionPath(collections(), id);
	if (!req || !colPath) return;

	const trimmed = sourcePath.trim();
	if (!trimmed) {
		pushToast("file path cannot be empty", "err");
		return;
	}

	try {
		const activePresetName = getActivePresetName(id);
		const current = activeRequest().binaryFile;
		const binaryFile = await copyBinaryAttachment({
			dataDir: getDataDir(),
			collectionPath: colPath,
			requestSlug: slugFromId(id),
			presetName: activePresetName,
			sourcePath: trimmed,
		});

		if (current) {
			await deleteBinaryAttachment(getDataDir(), current);
		}

		updateActive((r) => ({
			...r,
			bodyType: "binary",
			binaryFile,
			headers: syncContentTypeHeader(r.headers, "binary"),
		}));
		scheduleDebouncedSave();
		pushToast(`attached "${binaryFile.name}"`, "ok");
	} catch (err) {
		const message = err instanceof Error ? err.message : "failed to attach file";
		pushToast(message, "err");
	}
}

export async function clearBinaryFile(): Promise<void> {
	const current = activeRequest().binaryFile;
	if (!current) return;

	await deleteBinaryAttachment(getDataDir(), current);
	updateActive((r) => ({
		...r,
		binaryFile: null,
	}));
	scheduleDebouncedSave();
	pushToast("attachment removed", "ok");
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
		formUrlEncoded: [],
		binaryFile: null,
	};
	setPresetsMap((prev) => ({ ...prev, [id]: { ":default": defaultPreset } }));

	const presets = { ":default": defaultPreset };
	const details: RequestDetails = {
		method,
		url: "",
		pathParams: [],
		params: [],
		headers: [],
		body: null,
		bodyType: "none",
		formUrlEncoded: [],
		binaryFile: null,
	};
	persistSaveRequest(colPath, name, details, undefined, presets);

	setActiveRequestIdSig(id);
}

const [sending, setSendingSig] = createSignal<boolean>(false);
export { sending };

const [response, setResponseSig] = createSignal<SampleResponse | null>(null);
export { response };

export function fireRequest(): void {
	if (sending()) return;

	void sendActiveRequest();
}

async function sendActiveRequest(): Promise<void> {
	setSendingSig(true);
	setResponseSig(null);

	try {
		const result = await executeRequest(activeRequest(), {
			environment: activeEnv(),
			dataDir: getDataDir(),
		});
		setResponseSig(result);
		if (result.status === 0) {
			pushToast(`request failed · ${result.timeMs}ms`, "err");
		} else {
			const kind = result.status >= 400 ? "err" : "ok";
			pushToast(`${result.status} ${result.statusText} · ${result.timeMs}ms`, kind);
		}
	} finally {
		setSendingSig(false);
	}
}
