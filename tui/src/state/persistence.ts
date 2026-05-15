import { join } from "node:path";
import {
	slugify,
	saveRequest,
	deleteRequestFile,
	moveRequestFile as coreMoveRequestFile,
	createCollectionDir,
	readCollections,
	type Collection,
	type RequestDetails,
	type LoadResult,
	type Preset,
} from "@tuipostman/core";
import { COLLECTIONS, REQUEST_PRESETS } from "../data";

let dataDir = join(import.meta.dir, "..", "..", "..", "data");

export function getDataDir(): string {
	return dataDir;
}

export function setDataDir(dir: string): void {
	dataDir = dir;
}

export async function loadOrSeed(): Promise<LoadResult> {
	const result = await readCollections(dataDir);
	if (result.collections.length > 0) {
		return result;
	}

	await seedCollections(COLLECTIONS, REQUEST_PRESETS);
	return readCollections(dataDir);
}

async function seedCollections(
	cols: Collection[],
	presetsMap: Record<string, Record<string, import("../data/types").Preset>>,
): Promise<void> {
	for (const col of cols) {
		await seedCollection(col, "", presetsMap);
	}
}

async function seedCollection(
	col: Collection,
	parentPath: string,
	presetsMap: Record<string, Record<string, import("../data/types").Preset>>,
): Promise<void> {
	const colPath = parentPath ? `${parentPath}/${col.name}` : col.name;
	await createCollectionDir(dataDir, colPath);

	for (const req of col.requests) {
		const presets = presetsMap[req.id];
		const defaultPreset = presets?.[":default"];
		const details: RequestDetails = {
			method: req.method,
			url: req.url,
			pathParams: defaultPreset?.pathParams ?? [],
			params: defaultPreset?.params ?? [],
			headers: defaultPreset?.headers ?? [],
			body: defaultPreset?.body ?? null,
			bodyType: defaultPreset?.bodyType ?? "none",
		};
		await saveRequest(dataDir, colPath, req.name, details);
	}

	for (const child of col.children) {
		await seedCollection(child, colPath, presetsMap);
	}
}

/**
 * Walk the collection tree to find the collection (directory) that contains
 * a given request ID. Returns the collection's filesystem path (its `id`).
 */
export function findCollectionPath(
	nodes: Collection[],
	requestId: string,
): string | null {
	for (const node of nodes) {
		if (node.requests.some((r) => r.id === requestId)) return node.id;
		const deep = findCollectionPath(node.children, requestId);
		if (deep) return deep;
	}
	return null;
}

/**
 * Resolve the parent collection path for creating a new collection.
 * If parentId is null, the new collection is at the root.
 */
export function resolveCollectionDirPath(
	parentId: string | null,
	name: string,
): string {
	return parentId ? `${parentId}/${name}` : name;
}

/**
 * Extract the slug (filename stem) from a request ID.
 * ID format: "CollectionPath/.../slug"
 */
export function slugFromId(requestId: string): string {
	const parts = requestId.split("/");
	return parts[parts.length - 1] ?? requestId;
}

// --- Debounced save ---

const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 500;

export function debouncedSaveRequest(
	collectionPath: string,
	requestId: string,
	name: string,
	details: RequestDetails,
	presets?: Record<string, Preset>,
): void {
	const existing = pendingTimers.get(requestId);
	if (existing) clearTimeout(existing);

	const timer = setTimeout(() => {
		pendingTimers.delete(requestId);
		const oldSlug = slugFromId(requestId);
		const newSlug = slugify(name) || "untitled";
		saveRequest(
			dataDir,
			collectionPath,
			name,
			details,
			oldSlug !== newSlug ? oldSlug : undefined,
			presets,
		);
	}, DEBOUNCE_MS);
	pendingTimers.set(requestId, timer);
}

export function persistSaveRequest(
	collectionPath: string,
	name: string,
	details: RequestDetails,
	oldSlug?: string,
	presets?: Record<string, Preset>,
): void {
	saveRequest(dataDir, collectionPath, name, details, oldSlug, presets);
}

export function persistDeleteRequest(requestId: string): void {
	deleteRequestFile(dataDir, requestId);
}

export function persistMoveRequest(
	fromId: string,
	toCollectionPath: string,
	name: string,
): Promise<string> {
	return coreMoveRequestFile(dataDir, fromId, toCollectionPath, name);
}

export function persistCreateCollection(collectionPath: string): void {
	createCollectionDir(dataDir, collectionPath);
}
