import { copyFile, mkdir, stat, unlink } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import type { BinaryFile } from "../types";

export interface CopyBinaryAttachmentOptions {
	dataDir: string;
	collectionPath: string;
	requestSlug: string;
	presetName: string;
	sourcePath: string;
	kind?: "binary" | "form";
}

export async function copyBinaryAttachment(
	opts: CopyBinaryAttachmentOptions,
): Promise<BinaryFile> {
	const srcStat = await stat(opts.sourcePath);
	if (!srcStat.isFile()) {
		throw new Error("source path is not a file");
	}

	const originalName = basename(opts.sourcePath);
	const presetSlug =
		opts.presetName.replace(/^:/, "").replace(/[^a-zA-Z0-9_-]/g, "-") || "default";
	const timestamp = Date.now();
	const kind = opts.kind ?? "binary";
	const destName = `${opts.requestSlug}.${presetSlug}.${kind}.${timestamp}.${originalName}`;
	const destDir = join(opts.dataDir, opts.collectionPath);
	const destPath = join(destDir, destName);

	await mkdir(destDir, { recursive: true });
	await copyFile(opts.sourcePath, destPath);

	return {
		name: originalName,
		path: join(opts.collectionPath, destName).replace(/\\/g, "/"),
		sizeBytes: srcStat.size,
	};
}

export async function deleteBinaryAttachment(
	dataDir: string,
	binaryFile: BinaryFile | null,
): Promise<void> {
	if (!binaryFile?.path) return;

	const filePath = resolve(dataDir, binaryFile.path);
	const root = resolve(dataDir);
	if (!filePath.startsWith(root + "/") && filePath !== root) return;

	await unlink(filePath).catch(() => {});
}
