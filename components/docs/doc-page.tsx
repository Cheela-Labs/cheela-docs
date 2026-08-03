import type { ReactNode } from "react";
import { PrevNext } from "@/components/docs/shell";

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
 * heading lived inside any wrapper component.
 */
export function DocPage({
	eyebrow,
	title,
	lead,
	toc,
	children,
}: {
	eyebrow: string;
	title: string;
	lead?: ReactNode;
	toc?: readonly TocEntry[];
	children: ReactNode;
}) {
	return (
		<>
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
