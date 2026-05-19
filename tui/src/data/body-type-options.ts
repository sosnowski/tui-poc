import type { BodyType } from "./types";

export const BODY_TYPE_OPTIONS = [
	{ id: "none", label: "none", bodyType: "none" as const },
	{ id: "form-data", label: "form-data", bodyType: "form" as const },
	{ id: "form-url", label: "x-www-form-urlencoded", bodyType: "form-urlencoded" as const },
	{ id: "raw", label: "raw / json", bodyType: "json" as const },
	{ id: "binary", label: "binary", bodyType: "binary" as const },
] as const;

export const BODY_TYPE_COUNT = BODY_TYPE_OPTIONS.length;

export function bodyTypeToOptionId(bodyType: BodyType): string {
	switch (bodyType) {
		case "json":
			return "raw";
		case "form":
			return "form-data";
		case "form-urlencoded":
			return "form-url";
		case "binary":
			return "binary";
		default:
			return "none";
	}
}

export function bodyTypeToOptionIndex(bodyType: BodyType): number {
	const idx = BODY_TYPE_OPTIONS.findIndex((opt) => opt.bodyType === bodyType);
	return idx === -1 ? 0 : idx;
}

export function bodyTypeFromOptionIndex(index: number): BodyType {
	return BODY_TYPE_OPTIONS[Math.max(0, Math.min(index, BODY_TYPE_OPTIONS.length - 1))]!
		.bodyType;
}

/** Content-Type value for a request body type, or null when no body is sent. */
export function contentTypeForBodyType(bodyType: BodyType): string | null {
	switch (bodyType) {
		case "json":
			return "application/json";
		case "form":
			return "multipart/form-data";
		case "form-urlencoded":
			return "application/x-www-form-urlencoded";
		case "binary":
			return "application/octet-stream";
		default:
			return null;
	}
}
