/**
 * The docs navigation tree — the single source of truth.
 *
 * The sidebar, the previous/next footer links and `app/sitemap.ts` all read
 * this one array, so a page added here appears everywhere at once. Keeping
 * three hand-maintained lists in sync is how docs end up with orphan pages
 * nothing links to.
 */

export interface NavItem {
	readonly title: string;
	readonly href: string;
	/** One line shown on section index cards. Not used in the sidebar. */
	readonly summary?: string;
}

export interface NavGroup {
	readonly title: string;
	readonly items: readonly NavItem[];
}

export const nav: readonly NavGroup[] = [
	{
		title: "START",
		items: [
			{
				title: "Introduction",
				href: "/",
				summary: "What Cheela is, and which half of it you need.",
			},
			{
				title: "Quickstart",
				href: "/quickstart",
				summary:
					"A working capability, called by a model, in about ten minutes.",
			},
			{
				title: "Installation",
				href: "/installation",
				summary: "Packages, Node version, and what `cheela init` writes.",
			},
		],
	},
	{
		title: "CONCEPTS",
		items: [
			{
				title: "Architecture",
				href: "/concepts/architecture",
				summary: "Who calls whom, and which side runs your code.",
			},
			{
				title: "Capabilities",
				href: "/concepts/capabilities",
				summary: "The unit of work a model is allowed to invoke.",
			},
			{
				title: "Runtimes",
				href: "/concepts/runtimes",
				summary: "The identity that owns capabilities, keys, and an endpoint.",
			},
			{
				title: "Executions",
				href: "/concepts/executions",
				summary: "The agent loop, step budgets, and what gets billed.",
			},
			{
				title: "End-user identity",
				href: "/concepts/end-user-identity",
				summary:
					"How a capability acts for a signed-in person without Cheela seeing them.",
			},
		],
	},
	{
		title: "GUIDES",
		items: [
			{
				title: "Serve capability calls",
				href: "/guides/serving-capabilities",
				summary:
					"The signed endpoint, on Next.js, Express, or anything web-standard.",
			},
			{
				title: "Deploy a runtime",
				href: "/guides/deploying",
				summary: "What `cheela deploy` does, in order, and what it writes.",
			},
			{
				title: "Embed chat",
				href: "/guides/embedding-chat",
				summary: "React, a custom element, or one script tag.",
			},
			{
				title: "Publish a manifest",
				href: "/guides/publishing-a-manifest",
				summary:
					"Let other people's agents discover and call your capabilities.",
			},
		],
	},
	{
		title: "REFERENCE",
		items: [
			{
				title: "CLI",
				href: "/reference/cli",
				summary: "Every command, flag, and exit behaviour.",
			},
			{
				title: "Configuration",
				href: "/reference/configuration",
				summary: "cheela.config.ts, field by field.",
			},
			{
				title: "HTTP API",
				href: "/reference/http-api",
				summary: "Every endpoint, its auth plane, and its response shape.",
			},
			{
				title: "@cheela/sdk",
				href: "/reference/sdk",
				summary: "createCapability, createAction, and the naming rules.",
			},
			{
				title: "@cheela/runtime",
				href: "/reference/runtime",
				summary: "Runtime, the request handlers, and signature verification.",
			},
			{
				title: "Chat packages",
				href: "/reference/chat-packages",
				summary: "@cheela/client, @cheela/ui, and @cheela/web-component.",
			},
			{
				title: "Errors and limits",
				href: "/reference/errors-and-limits",
				summary: "Error codes, failure reasons, and per-tier ceilings.",
			},
		],
	},
	{
		title: "HELP",
		items: [
			{
				title: "Troubleshooting",
				href: "/troubleshooting",
				summary: "The failures that actually happen, and what each one means.",
			},
		],
	},
];

/** Flat reading order, used for the previous/next footer and the sitemap. */
export const navOrder: readonly NavItem[] = nav.flatMap((group) => group.items);

export function siblings(href: string): {
	previous?: NavItem;
	next?: NavItem;
} {
	const index = navOrder.findIndex((item) => item.href === href);
	if (index === -1) return {};

	return {
		previous: index > 0 ? navOrder[index - 1] : undefined,
		next: index < navOrder.length - 1 ? navOrder[index + 1] : undefined,
	};
}
