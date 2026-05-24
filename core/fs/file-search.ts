import { readdirSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

import { fuzzyScore } from "./fuzzy";

const DEFAULT_IGNORE = new Set([
	".git",
	".svn",
	".hg",
	".cache",
	".next",
	".turbo",
	".bun",
	"__pycache__",
	"build",
	"coverage",
	"dist",
	"node_modules",
	"target",
	"vendor",
]);

const SKIP_WALK_PREFIXES = [
	"/System",
	"/private/var/folders",
	"/dev",
	"/proc",
	"/run",
	"/Library/Caches",
	"/.Trashes",
];

const SPOTLIGHT_SKIP_PREFIXES = [
	"/System/",
	"/Library/Caches/",
	"/private/var/",
	"/.Trashes/",
];

export type FileSearchScope = "drive" | "workingDir";

export interface SearchFilesOptions {
	query: string;
	/** Base directory for resolving relative direct-path checks. */
	resolveDir?: string;
	scope?: FileSearchScope;
	maxResults?: number;
	maxDepth?: number;
	maxVisited?: number;
	ignoreDirs?: Set<string>;
}

interface ScoredPath {
	path: string;
	score: number;
}

export function getDriveWalkRoots(): string[] {
	const roots = new Set<string>([homedir()]);

	try {
		for (const name of readdirSync("/Volumes")) {
			roots.add(join("/Volumes", name));
		}
	} catch {
		// no mounted volumes
	}

	if (process.platform === "linux") {
		for (const mountRoot of ["/mnt", "/media"]) {
			try {
				for (const name of readdirSync(mountRoot)) {
					roots.add(join(mountRoot, name));
				}
			} catch {
				// mount root unavailable
			}
		}
	}

	if (process.platform === "win32") {
		const profile = process.env.USERPROFILE;
		if (profile) roots.add(profile);
	}

	return [...roots];
}

export async function searchFiles(options: SearchFilesOptions): Promise<string[]> {
	const {
		query,
		resolveDir = process.cwd(),
		scope = "drive",
		maxResults = 50,
		maxDepth = scope === "drive" ? Number.POSITIVE_INFINITY : 10,
		maxVisited = scope === "drive" ? 30_000 : 8_000,
		ignoreDirs = DEFAULT_IGNORE,
	} = options;

	const q = query.trim();
	if (!q) return [];

	const resolveBase = resolve(resolveDir);
	const scored: ScoredPath[] = [];
	const seen = new Set<string>();
	const qLower = q.toLowerCase();

	await addDirectPathCandidate(q, resolveBase, scored, seen);

	const indexCandidates = await searchIndexedFiles(q, maxResults * 20);
	scorePaths(indexCandidates, qLower, scored, seen, maxResults * 6);

	const walkRoots =
		scope === "drive" ? getDriveWalkRoots() : [resolveBase];
	const state = { visited: 0 };

	for (const root of walkRoots) {
		if (scored.length >= maxResults * 6 || state.visited >= maxVisited) break;

		await walkFiles(root, 0, maxDepth, ignoreDirs, maxVisited, state, (filePath) => {
			if (seen.has(filePath)) return true;

			const pathLower = filePath.toLowerCase();
			const baseLower = basename(filePath).toLowerCase();
			const pathScore = fuzzyScore(pathLower, qLower);
			const baseScore = fuzzyScore(baseLower, qLower);
			const score =
				pathScore === null
					? baseScore
					: baseScore === null
						? pathScore
						: Math.min(pathScore, baseScore);

			if (score !== null) {
				seen.add(filePath);
				scored.push({ path: filePath, score });
			}

			return scored.length < maxResults * 6;
		});
	}

	return scored
		.sort((a, b) => a.score - b.score || a.path.localeCompare(b.path))
		.slice(0, maxResults)
		.map((entry) => entry.path);
}

async function addDirectPathCandidate(
	query: string,
	resolveBase: string,
	scored: ScoredPath[],
	seen: Set<string>,
): Promise<void> {
	const directPath = query.startsWith("/") ? resolve(query) : resolve(resolveBase, query);
	try {
		const directStat = await stat(directPath);
		if (directStat.isFile()) {
			scored.push({ path: directPath, score: -2 });
			seen.add(directPath);
		}
	} catch {
		// not a resolvable file path yet
	}
}

function scorePaths(
	paths: string[],
	queryLower: string,
	scored: ScoredPath[],
	seen: Set<string>,
	limit: number,
): void {
	for (const filePath of paths) {
		if (seen.has(filePath) || scored.length >= limit) return;
		if (shouldSkipIndexedPath(filePath)) continue;

		const pathLower = filePath.toLowerCase();
		const baseLower = basename(filePath).toLowerCase();
		const pathScore = fuzzyScore(pathLower, queryLower);
		const baseScore = fuzzyScore(baseLower, queryLower);
		const score =
			pathScore === null
				? baseScore
				: baseScore === null
					? pathScore
					: Math.min(pathScore, baseScore);

		if (score !== null) {
			seen.add(filePath);
			scored.push({ path: filePath, score });
		}
	}
}

function shouldSkipIndexedPath(filePath: string): boolean {
	return SPOTLIGHT_SKIP_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function shouldSkipWalkDir(dirPath: string): boolean {
	return SKIP_WALK_PREFIXES.some(
		(prefix) => dirPath === prefix || dirPath.startsWith(`${prefix}/`),
	);
}

async function searchIndexedFiles(query: string, maxCandidates: number): Promise<string[]> {
	if (process.platform === "darwin") {
		return searchSpotlight(query, maxCandidates);
	}
	if (process.platform === "linux") {
		return searchLocate(query, maxCandidates);
	}
	return [];
}

async function searchSpotlight(query: string, maxCandidates: number): Promise<string[]> {
	try {
		const proc = Bun.spawn(["mdfind", "-name", query], {
			stdout: "pipe",
			stderr: "ignore",
		});
		const exitCode = await proc.exited;
		if (exitCode !== 0) return [];

		const text = await new Response(proc.stdout).text();
		return text
			.split("\n")
			.filter(Boolean)
			.filter((path) => !shouldSkipIndexedPath(path))
			.slice(0, maxCandidates);
	} catch {
		return [];
	}
}

async function searchLocate(query: string, maxCandidates: number): Promise<string[]> {
	try {
		const proc = Bun.spawn(["locate", "-il", String(maxCandidates), query], {
			stdout: "pipe",
			stderr: "ignore",
		});
		const exitCode = await proc.exited;
		if (exitCode !== 0) return [];

		const text = await new Response(proc.stdout).text();
		return text.split("\n").filter(Boolean).slice(0, maxCandidates);
	} catch {
		return [];
	}
}

async function walkFiles(
	currentDir: string,
	depth: number,
	maxDepth: number,
	ignoreDirs: Set<string>,
	maxVisited: number,
	state: { visited: number },
	onFile: (filePath: string) => boolean,
): Promise<void> {
	if (depth > maxDepth || state.visited >= maxVisited || shouldSkipWalkDir(currentDir)) {
		return;
	}

	let entries;
	try {
		entries = await readdir(currentDir, { withFileTypes: true });
	} catch {
		return;
	}

	for (const entry of entries) {
		if (state.visited >= maxVisited) return;

		const fullPath = join(currentDir, entry.name);

		if (entry.isDirectory()) {
			if (ignoreDirs.has(entry.name)) continue;
			if (shouldSkipWalkDir(fullPath)) continue;
			await walkFiles(fullPath, depth + 1, maxDepth, ignoreDirs, maxVisited, state, onFile);
			continue;
		}

		if (!entry.isFile()) continue;

		state.visited++;
		if (!onFile(fullPath)) return;
	}
}
