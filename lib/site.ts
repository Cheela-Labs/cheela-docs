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
