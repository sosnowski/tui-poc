import type { Environment, KV, RequestDetails, ResponseHeader, SampleResponse } from "../types";

export interface ExecuteRequestOptions {
	environment?: Environment;
}

const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function executeRequest(
	details: RequestDetails,
	options: ExecuteRequestOptions = {},
): Promise<SampleResponse> {
	const started = performance.now();

	try {
		const url = buildRequestUrl(details, options);
		const headers = buildHeaders(details.headers, options);
		const init: RequestInit = {
			method: details.method,
			headers,
		};

		if (
			BODY_METHODS.has(details.method) &&
			details.body != null &&
			details.bodyType !== "none"
		) {
			init.body = resolveVariables(details.body, options);
			if (details.bodyType === "json" && !hasHeader(headers, "content-type")) {
				headers.set("Content-Type", "application/json");
			}
		}

		const response = await fetch(url, init);
		const bytes = await response.arrayBuffer();
		const bodyText = new TextDecoder().decode(bytes);

		return {
			status: response.status,
			statusText: response.statusText,
			timeMs: elapsedMs(started),
			sizeBytes: bytes.byteLength,
			headers: responseHeaders(response.headers),
			body: parseResponseBody(bodyText, response.headers.get("content-type")),
		};
	} catch (err) {
		return networkErrorResponse(err, elapsedMs(started));
	}
}

function buildRequestUrl(details: RequestDetails, options: ExecuteRequestOptions): string {
	const withVars = resolveVariables(details.url, options);
	const withPathParams = applyPathParams(withVars, details.pathParams, options);
	const url = new URL(withPathParams);

	for (const param of enabledRows(details.params)) {
		const key = resolveVariables(param.key, options).trim();
		if (!key) continue;
		url.searchParams.append(key, resolveVariables(param.value, options));
	}

	return url.toString();
}

function applyPathParams(url: string, params: KV[], options: ExecuteRequestOptions): string {
	let next = url;
	for (const param of enabledRows(params)) {
		const key = param.key.trim().replace(/^:/, "");
		if (!key) continue;
		const value = encodeURIComponent(resolveVariables(param.value, options));
		const pattern = new RegExp(`(^|/):${escapeRegExp(key)}(?=$|/|[^A-Za-z0-9_])`, "g");
		next = next.replace(pattern, `$1${value}`);
	}
	return next;
}

function buildHeaders(headers: KV[], options: ExecuteRequestOptions): Headers {
	const out = new Headers();
	for (const header of enabledRows(headers)) {
		const key = resolveVariables(header.key, options).trim();
		if (!key) continue;
		out.set(key, resolveVariables(header.value, options));
	}
	return out;
}

function enabledRows(rows: KV[]): KV[] {
	return rows.filter((row) => row.enabled !== false);
}

function resolveVariables(value: string, options: ExecuteRequestOptions): string {
	return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawName: string) => {
		const name = rawName.trim();
		const envValue = options.environment?.vars.find((v) => v.key === name)?.value;
		return envValue ?? `{{${name}}}`;
	});
}

function hasHeader(headers: Headers, name: string): boolean {
	for (const key of headers.keys()) {
		if (key.toLowerCase() === name.toLowerCase()) return true;
	}
	return false;
}

function responseHeaders(headers: Headers): ResponseHeader[] {
	return Array.from(headers.entries()).map(([key, value]) => ({ key, value }));
}

function parseResponseBody(bodyText: string, contentType: string | null): unknown {
	if (!bodyText) return null;
	if (contentType?.toLowerCase().includes("json")) {
		try {
			return JSON.parse(bodyText);
		} catch {
			return bodyText;
		}
	}
	return bodyText;
}

function networkErrorResponse(err: unknown, timeMs: number): SampleResponse {
	const message = err instanceof Error ? err.message : String(err);
	return {
		status: 0,
		statusText: "Network Error",
		timeMs,
		sizeBytes: new TextEncoder().encode(message).byteLength,
		headers: [],
		body: {
			error: message,
		},
	};
}

function elapsedMs(started: number): number {
	return Math.max(0, Math.round(performance.now() - started));
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
