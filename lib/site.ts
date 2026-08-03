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

/**
 * The organization's canonical node id, on `www` — not on this host.
 *
 * There is one Cheela Labs and three sites describing it. When each host minted
 * its own `…docs.cheelalabs.com/#organization`, those were three identifiers
 * for one entity that a crawler had to infer were the same. Using the marketing
 * site's id everywhere states it outright, which matters here because a
 * subdomain is treated as a substantially separate site — the cost seo.md
 * records for splitting docs and the blog off `www`.
 *
 * Must stay byte-identical to what `apps/website/lib/seo.ts` produces for
 * `nodeId("organization")`.
 */
export const ORGANIZATION_ID = `${site.website}/#organization`;
