/**
 * Convert a human-readable name into a filesystem-safe slug.
 * Lowercases, replaces non-alphanumeric runs with a single hyphen,
 * and trims leading/trailing hyphens.
 *
 * "Get user by id" -> "get-user-by-id"
 * "  Hello / World!  " -> "hello-world"
 */
export function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
