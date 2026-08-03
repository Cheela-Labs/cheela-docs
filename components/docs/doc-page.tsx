import type { ReactNode } from "react";
import { PrevNext } from "@/components/docs/shell";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";

export interface TocEntry {
	readonly id: string;
	readonly title: string;
}

/**
 * One documentation article.
 *
 * The table of contents is passed in rather than scraped from the rendered
 * output: these pages are TSX, so there is no markdown AST to walk, and
 * parsing children at runtime to find headings would break the moment a
 * heading lived inside any wrapper component. `path` is passed for the same
 * reason — this renders on the server, where there is no pathname to read, and
 * the structured data below needs absolute URLs.
 */
export function DocPage({
	eyebrow,
	title,
	lead,
	toc,
	path,
	children,
}: {
	eyebrow: string;
	title: string;
	lead?: ReactNode;
	toc?: readonly TocEntry[];
	/** Site-relative, matching the page's `alternates.canonical`. */
	path: string;
	children: ReactNode;
}) {
	const jsonLd = [
		articleSchema({
			title,
			// The lead is the page's own one-sentence summary, so it is already
			// the description — no second copy to drift from the first. Guarded
			// because the prop accepts a ReactNode and a few pages pass markup.
			description: typeof lead === "string" ? lead : undefined,
			path,
			// "Reference", "Guides", "Concepts" — the sidebar group, which is the
			// one piece of hierarchy a flat URL does not carry.
			section: eyebrow,
		}),
		// No breadcrumb on the index. Its trail would be "Docs → Introduction"
		// with the first entry linking to the page being described — a crumb
		// that leads back to where you already are says nothing, and asserting
		// a hierarchy above a root is what makes a trail wrong rather than thin.
		...(path === "/" ? [] : [breadcrumbSchema({ title, path })]),
	];

	return (
		<>
			<script
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be inlined
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				type="application/ld+json"
			/>
			<article className="min-w-0 max-w-[680px]">
				<div className="mb-3 font-mono text-xs tracking-wide text-accent-strong">
					{eyebrow.toUpperCase()}
				</div>
				<h1 className="font-display text-2xl font-bold leading-snug tracking-tight text-fg-primary sm:text-3xl">
					{title}
				</h1>
				{lead ? (
					<p className="mt-4 mb-2 text-md leading-relaxed text-fg-secondary">
						{lead}
					</p>
				) : null}
				{children}
				<PrevNext />
			</article>

			<aside className="hidden self-start lg:sticky lg:top-24 lg:block">
				{toc && toc.length > 0 ? (
					<>
						<div className="mb-3 font-mono text-2xs tracking-wide text-fg-tertiary">
							ON THIS PAGE
						</div>
						<ul className="flex flex-col gap-2 border-l border-border-default">
							{toc.map((entry) => (
								<li key={entry.id}>
									<a
										className="-ml-px block border-l border-transparent pl-3 text-sm leading-snug text-fg-secondary transition-colors duration-fast hover:border-accent hover:text-fg-primary"
										href={`#${entry.id}`}
									>
										{entry.title}
									</a>
								</li>
							))}
						</ul>
					</>
				) : null}
			</aside>
		</>
	);
}
