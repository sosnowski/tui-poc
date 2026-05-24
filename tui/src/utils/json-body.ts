export type JsonValidation =
	| { status: "empty"; message: string }
	| { status: "valid"; message: string; value: unknown }
	| { status: "invalid"; message: string };

export function validateJsonText(text: string): JsonValidation {
	const trimmed = text.trim();
	if (trimmed === "") {
		return { status: "empty", message: "empty — enter JSON" };
	}

	try {
		const value = JSON.parse(text);
		return { status: "valid", message: "valid JSON", value };
	} catch (err) {
		const message = err instanceof SyntaxError ? err.message : "invalid JSON";
		return { status: "invalid", message };
	}
}

/** Pretty-print JSON text when parseable; otherwise return null. */
export function formatJsonText(text: string): string | null {
	const result = validateJsonText(text);
	if (result.status !== "valid") return null;
	return JSON.stringify(result.value, null, 2);
}

export const DEFAULT_JSON_BODY = "{\n\n}";
