import type { AutocompleteOption } from "../components/autocomplete-input";

export const HTTP_REQUEST_HEADER_OPTIONS: AutocompleteOption[] = [
	{ value: "Accept", description: "Response media types accepted by the client" },
	{ value: "Accept-Encoding", description: "Accepted compression algorithms" },
	{ value: "Accept-Language", description: "Preferred response languages" },
	{ value: "Authorization", description: "Credentials for HTTP authentication" },
	{ value: "Cache-Control", description: "Request/response cache directives" },
	{ value: "Connection", description: "Connection management" },
	{ value: "Content-Length", description: "Request body size in bytes" },
	{ value: "Content-Type", description: "Request body media type" },
	{ value: "Cookie", description: "Cookies sent to the server" },
	{ value: "Host", description: "Target host and port" },
	{ value: "If-Match", description: "Conditional request by ETag" },
	{ value: "If-Modified-Since", description: "Conditional request by modification date" },
	{ value: "If-None-Match", description: "Conditional request by ETag mismatch" },
	{ value: "Origin", description: "Origin for CORS requests" },
	{ value: "Referer", description: "Previous page URL" },
	{ value: "User-Agent", description: "Client application identifier" },
	{ value: "X-API-Key", description: "Common API key header" },
	{ value: "X-Request-Id", description: "Request correlation identifier" },
];

const CONTENT_TYPE_VALUES: AutocompleteOption[] = [
	"application/json",
	"application/xml",
	"application/x-www-form-urlencoded",
	"multipart/form-data",
	"application/octet-stream",
	"application/pdf",
	"application/javascript",
	"application/graphql",
	"text/plain",
	"text/html",
	"text/csv",
	"text/xml",
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/svg+xml",
	"image/webp",
];

const ACCEPT_VALUES: AutocompleteOption[] = [
	"*/*",
	"application/json",
	"application/xml",
	"application/octet-stream",
	"text/plain",
	"text/html",
	"text/csv",
	"text/event-stream",
];

const ACCEPT_ENCODING_VALUES: AutocompleteOption[] = [
	"gzip, deflate, br",
	"gzip",
	"deflate",
	"br",
	"identity",
	"*",
];

const ACCEPT_LANGUAGE_VALUES: AutocompleteOption[] = [
	"en-US,en;q=0.9",
	"en-US",
	"en",
	"en-GB",
	"*",
];

const AUTHORIZATION_VALUES: AutocompleteOption[] = [
	{ value: "Bearer ", description: "Token-based auth (OAuth 2.0, JWT)" },
	{ value: "Basic ", description: "Base64-encoded user:password" },
	{ value: "Digest ", description: "Digest access authentication" },
	{ value: "Token ", description: "Generic token scheme" },
];

const CACHE_CONTROL_VALUES: AutocompleteOption[] = [
	"no-cache",
	"no-store",
	"no-cache, no-store",
	"max-age=0",
	"max-age=3600",
	"must-revalidate",
	"public",
	"private",
];

const CONNECTION_VALUES: AutocompleteOption[] = ["keep-alive", "close", "upgrade"];

const COOKIE_VALUES: AutocompleteOption[] = [];

const STAR_ONLY: AutocompleteOption[] = ["*"];

const USER_AGENT_VALUES: AutocompleteOption[] = [
	"tuipostman/0.4.1",
	"curl/8.6.0",
	"PostmanRuntime/7.39.0",
];

const X_REQUESTED_WITH_VALUES: AutocompleteOption[] = ["XMLHttpRequest"];

/**
 * Common values for well-known HTTP request headers. Keys are normalized to
 * lowercase since HTTP header names are case-insensitive — use
 * `getHeaderValueOptions()` to perform the lookup so callers don't have to
 * worry about casing.
 */
export const HTTP_HEADER_VALUE_OPTIONS: Record<string, AutocompleteOption[]> = {
	accept: ACCEPT_VALUES,
	"accept-encoding": ACCEPT_ENCODING_VALUES,
	"accept-language": ACCEPT_LANGUAGE_VALUES,
	authorization: AUTHORIZATION_VALUES,
	"cache-control": CACHE_CONTROL_VALUES,
	connection: CONNECTION_VALUES,
	"content-type": CONTENT_TYPE_VALUES,
	cookie: COOKIE_VALUES,
	"if-match": STAR_ONLY,
	"if-none-match": STAR_ONLY,
	"user-agent": USER_AGENT_VALUES,
	"x-requested-with": X_REQUESTED_WITH_VALUES,
};

export function getHeaderValueOptions(headerKey: string): AutocompleteOption[] | undefined {
	const normalized = headerKey.trim().toLowerCase();
	if (!normalized) return undefined;
	const options = HTTP_HEADER_VALUE_OPTIONS[normalized];
	return options && options.length > 0 ? options : undefined;
}
