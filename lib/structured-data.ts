import { nodeId, ORGANIZATION_ID, site, siteUrl } from "./site";

/**
 * The docs site's entity graph, emitted once from the root layout.
 *
 * Docs is a separate host, and a search engine treats a subdomain as a
 * substantially separate site. Without an Organization node whose `url` is
 * `www` and whose `sameAs` names it, this reads as an unrelated publisher that
 * happens to write about the same product — which is the cost `seo.md` warns
 * about for the blog and applies identically here.
 *
 * Per-page nodes (`TechArticle`, `BreadcrumbList`) reference these by `@id`,
 * so every page ties back to the same two entities rather than restating them.
 */
export const structuredData = [
	{
		"@context": "https://schema.org",
		"@type": "Organization",
		"@id": ORGANIZATION_ID,

		name: "Cheela Labs",
		// The marketing site, deliberately — that is the organization's home.
		// Pointing this at the docs host would assert two organizations.
		url: site.website,
		logo: siteUrl("/logo.png"),

		sameAs: [site.website, site.github, site.x],
	},

	{
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": nodeId("website"),

		url: siteUrl("/"),
		name: "Cheela Docs",
		description:
			"Documentation for Cheela — capabilities, runtimes, the HTTP API, and the CLI.",
		inLanguage: "en",

		publisher: { "@id": ORGANIZATION_ID },
	},
];

/**
 * One documentation page.
 *
 * `TechArticle` rather than `Article`: this is reference material, not news,
 * and the distinction is the point of the type. It produces no rich result in
 * Google — `Article` rich results are for news and blog content — so the value
 * here is entity understanding and the growing number of crawlers that read
 * structured data to decide what a page is about.
 *
 * Deliberately no `datePublished` or `dateModified`. Nothing in this repository
 * knows when a docs page last meaningfully changed: git does not preserve
 * mtimes, and a build timestamp would claim every page changed on every deploy
 * — which is exactly the mistake `apps/website/app/sitemap.ts` documents at
 * length. A fabricated freshness signal is worse than none, because it is
 * believed. `seo.md` Phase 1 tracks adding a real one.
 */
export function articleSchema(options: {
	title: string;
	description?: string;
	path: string;
	section: string;
}) {
	const url = siteUrl(options.path);

	return {
		"@context": "https://schema.org",
		"@type": "TechArticle",
		"@id": `${url}#article`,

		headline: options.title,
		...(options.description ? { description: options.description } : {}),
		url,
		inLanguage: "en",

		// The section this page sits in, e.g. "Reference". Cheap, and it is the
		// one piece of hierarchy a flat URL does not carry.
		articleSection: options.section,

		isPartOf: { "@id": nodeId("website") },
		publisher: { "@id": ORGANIZATION_ID },
		author: { "@id": ORGANIZATION_ID },
	};
}

/**
 * Docs → this page.
 *
 * Two levels, not three. The sidebar groups ("Reference", "Guides") are
 * headings, not pages — there is no `/reference` to link to — and Google
 * requires `item` on every entry except the last. Naming a group here would
 * either emit an entry with no URL, or invent one that 404s.
 */
export function breadcrumbSchema(options: { title: string; path: string }) {
	const url = siteUrl(options.path);

	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"@id": `${url}#breadcrumb`,

		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: "Docs",
				item: siteUrl("/"),
			},
			{
				"@type": "ListItem",
				position: 2,
				name: options.title,
			},
		],
	};
}
