export const site = {
	/**
	 * The canonical docs origin, pinned rather than derived from the environment.
	 *
	 * A deployment-derived origin is what put a preview hostname into the sibling
	 * marketing site's canonical tags and structured data. Canonicals describe
	 * identity, which does not vary per deployment.
	 */
	docs: "https://docs.cheelalabs.com",
	website: "https://www.cheelalabs.com",
	/** Its own host — the blog is no longer a section of the marketing site. */
	blog: "https://blogs.cheelalabs.com",
	dashboard: "https://dashboard.cheelalabs.com",
	github: "https://github.com/Cheela-Labs/platform",
	npm: "https://www.npmjs.com/package/@cheela/cli",
	x: "https://x.com/CheelaLabs",
} as const;

/** Absolute URL on the canonical docs host. */
export function siteUrl(pathname = "/"): string {
	return new URL(pathname, site.docs).toString();
}

/**
 * Stable JSON-LD node id: `organization` → `https://docs…/#organization`.
 *
 * Built through `new URL` rather than string concatenation. The marketing
 * site's ids were once assembled by joining a base that ends in a slash,
 * producing `…com//#organization`, so every reference written the obvious way
 * pointed at a node that did not exist.
 */
export function nodeId(fragment: string): string {
	return `${siteUrl("/")}#${fragment.replace(/^#/, "")}`;
}
