import { readdir } from "node:fs/promises";
import { join } from "node:path";

import type {
	Collection,
	HttpMethod,
	KV,
	Preset,
	Request,
	RequestDetails,
	RequestFile,
} from "./types";

export interface LoadResult {
	collections: Collection[];
	requestDetails: Record<string, RequestDetails>;
	presets: Record<string, Record<string, Preset>>;
}

export async function readCollections(dataDir: string): Promise<LoadResult> {
	try {
		await readdir(dataDir);
	} catch {
		return { collections: [], requestDetails: {}, presets: {} };
	}

	const requestDetails: Record<string, RequestDetails> = {};
	const presets: Record<string, Record<string, Preset>> = {};
	const collections = await walkDir(dataDir, dataDir, requestDetails, presets);
	return { collections, requestDetails, presets };
}

async function walkDir(
	baseDir: string,
	currentDir: string,
	requestDetails: Record<string, RequestDetails>,
	presets: Record<string, Record<string, Preset>>,
): Promise<Collection[]> {
	let entries;
	try {
		entries = await readdir(currentDir, { withFileTypes: true });
	} catch {
		return [];
	}

	const dirs = entries.filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));

	const collections: Collection[] = [];

	for (const dir of dirs) {
		const dirPath = join(currentDir, dir.name);
		const relPath = dirPath.slice(baseDir.length + 1);

		const children = await walkDir(baseDir, dirPath, requestDetails, presets);
		const requests = await loadRequestsInDir(baseDir, dirPath);

		for (const { request, details, filePresets } of requests) {
			requestDetails[request.id] = details;
			if (filePresets) presets[request.id] = filePresets;
		}

		collections.push({
			id: relPath,
			name: dir.name,
			expanded: true,
			children,
			requests: requests.map((r) => r.request),
		});
	}

	return collections;
}

interface LoadedRequest {
	request: Request;
	details: RequestDetails;
	filePresets: Record<string, Preset> | null;
}

async function loadRequestsInDir(baseDir: string, dirPath: string): Promise<LoadedRequest[]> {
	let entries;
	try {
		entries = await readdir(dirPath, { withFileTypes: true });
	} catch {
		return [];
	}

	const jsonFiles = entries
		.filter((e) => e.isFile() && e.name.endsWith(".json"))
		.sort((a, b) => a.name.localeCompare(b.name));

	const results: LoadedRequest[] = [];
	for (const file of jsonFiles) {
		const loaded = await loadRequestFile(baseDir, join(dirPath, file.name));
		if (loaded) results.push(loaded);
	}
	return results;
}

async function loadRequestFile(
	baseDir: string,
	filePath: string,
): Promise<LoadedRequest | null> {
	try {
		const raw = await Bun.file(filePath).text();
		const data: RequestFile = JSON.parse(raw);

		const stem = filePath.slice(0, -".json".length);
		const id = stem.slice(baseDir.length + 1);

		const method: HttpMethod = data.method ?? "GET";

		const request: Request = {
			id,
			method,
			name: data.name ?? id.split("/").pop() ?? id,
			url: data.url ?? "",
		};

		const defaultPreset = data.presets?.[":default"];

		const details: RequestDetails = {
			method,
			url: data.url ?? "",
			pathParams: normalizeKVArray(defaultPreset?.pathParams),
			params: normalizeKVArray(defaultPreset?.params),
			headers: normalizeKVArray(defaultPreset?.headers),
			body: defaultPreset?.body ?? null,
			bodyType: defaultPreset?.bodyType ?? "none",
		};

		const filePresets = data.presets ?? null;

		return { request, details, filePresets };
	} catch (err) {
		console.error(`[core] failed to load ${filePath}:`, err);
		return null;
	}
}

function normalizeKVArray(arr: KV[] | undefined): KV[] {
	if (!Array.isArray(arr)) return [];
	return arr;
}
