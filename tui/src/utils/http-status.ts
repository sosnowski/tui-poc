import type { Theme } from "../state/themes";

const STATUS_TEXT: Record<number, string> = {
	200: "200 OK",
	201: "201 Created",
	204: "204 No Content",
	301: "301 Moved",
	302: "302 Found",
	400: "400 Bad Request",
	401: "401 Unauthorized",
	403: "403 Forbidden",
	404: "404 Not Found",
	422: "422 Unprocessable",
	429: "429 Too Many",
	500: "500 Server Error",
	502: "502 Bad Gateway",
	503: "503 Unavailable",
};

export function httpStatusText(code: number): string {
	return STATUS_TEXT[code] ?? String(code);
}

export function httpStatusColor(code: number, theme: Theme): string {
	if (code >= 400) return theme.err;
	if (code >= 300) return theme.warn;
	if (code >= 200) return theme.ok;
	return theme.info;
}
