import { mkdir, rm, rename, unlink } from "node:fs/promises";
import { join } from "node:path";

import { slugify } from "./slugify";
import type { Preset, RequestDetails, RequestFile } from "../types";

function logError(op: string, err: unknown): void {
	console.error(`[core:writer] ${op} failed:`, err);
}

function buildRequestFile(
	name: string,
	details: RequestDetails,
	presets?: Record<string, Preset>,
): RequestFile {
	return {
		name,
		method: details.method,
		url: details.url,
		presets: presets ?? {
			":default": {
				pathParams: details.pathParams,
				params: details.params,
				headers: details.headers,
				body: details.body,
				bodyType: details.bodyType,
				formUrlEncoded: details.formUrlEncoded,
				binaryFile: details.binaryFile,
			},
		},
	};
}

/**
 * Save a request to disk. `collectionPath` is the relative directory path
 * from `dataDir` (e.g. "JSONPlaceholder/users"). `oldSlug` can be provided
 * when the request was previously saved under a different slug (name changed);
 * the old file will be removed.
 *
 * When `presets` is provided it is written into the file verbatim; otherwise a
 * single `:default` preset is derived from `details` for backward compatibility.
 */
export async function saveRequest(
	dataDir: string,
	collectionPath: string,
	name: string,
	details: RequestDetails,
	oldSlug?: string,
	presets?: Record<string, Preset>,
): Promise<string> {
	const slug = slugify(name) || "untitled";
	const dirPath = join(dataDir, collectionPath);
	const filePath = join(dirPath, `${slug}.json`);
	const content = JSON.stringify(buildRequestFile(name, details, presets), null, 2) + "\n";

	try {
		await mkdir(dirPath, { recursive: true });
		await Bun.write(filePath, content);

		if (oldSlug && oldSlug !== slug) {
			const oldPath = join(dirPath, `${oldSlug}.json`);
			await unlink(oldPath).catch(() => {});
		}
	} catch (err) {
		logError("saveRequest", err);
	}

	return slug;
}

/**
 * Delete a request file by its ID (relative path without .json extension).
 */
export async function deleteRequestFile(dataDir: string, requestId: string): Promise<void> {
	const filePath = join(dataDir, `${requestId}.json`);
	try {
		await unlink(filePath);
	} catch (err) {
		logError("deleteRequestFile", err);
	}
}

/**
 * Move a request file from one collection to another.
 * Returns the new request ID (relative path without .json).
 */
export async function moveRequestFile(
	dataDir: string,
	fromId: string,
	toCollectionPath: string,
	name: string,
): Promise<string> {
	const slug = slugify(name) || "untitled";
	const fromPath = join(dataDir, `${fromId}.json`);
	const toDir = join(dataDir, toCollectionPath);
	const toPath = join(toDir, `${slug}.json`);

	try {
		await mkdir(toDir, { recursive: true });
		await rename(fromPath, toPath);
	} catch (err) {
		logError("moveRequestFile", err);
	}

	return `${toCollectionPath}/${slug}`;
}

/**
 * Create a collection directory.
 */
export async function createCollectionDir(dataDir: string, collectionPath: string): Promise<void> {
	try {
		await mkdir(join(dataDir, collectionPath), { recursive: true });
	} catch (err) {
		logError("createCollectionDir", err);
	}
}

/**
 * Delete a collection directory and everything inside it.
 */
export async function deleteCollectionDir(dataDir: string, collectionPath: string): Promise<void> {
	try {
		await rm(join(dataDir, collectionPath), { recursive: true, force: true });
	} catch (err) {
		logError("deleteCollectionDir", err);
	}
}
