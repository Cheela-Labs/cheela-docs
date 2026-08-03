import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Prose primitives.
 *
 * Pages are TSX rather than MDX, so these exist to keep a heading looking the
 * same on page 3 as on page 19 without every author re-deciding a type scale.
 */

/** Section heading. The `id` is what the on-this-page rail links to. */
export function H2({ id, children }: { id: string; children: ReactNode }) {
	return (
		<h2
			className="mt-14 mb-4 scroll-mt-28 font-display text-xl font-bold tracking-tight text-fg-primary"
			id={id}
		>
			{children}
		</h2>
	);
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
	return (
		<h3
			className="mt-9 mb-3 scroll-mt-28 text-md font-semibold text-fg-primary"
			id={id}
		>
			{children}
		</h3>
	);
}

export function P({ children }: { children: ReactNode }) {
	return (
		<p className="my-4 text-base leading-relaxed text-fg-secondary">
			{children}
		</p>
	);
}

/** The one-paragraph answer to "what is this page for", directly under the H1. */
export function Lead({ children }: { children: ReactNode }) {
	return (
		<p className="mt-4 mb-8 text-md leading-relaxed text-fg-secondary">
			{children}
		</p>
	);
}

export function UL({ children }: { children: ReactNode }) {
	return (
		<ul className="my-4 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-fg-secondary marker:text-fg-tertiary">
			{children}
		</ul>
	);
}

export function OL({ children }: { children: ReactNode }) {
	return (
		<ol className="my-4 flex list-decimal flex-col gap-2 pl-5 text-base leading-relaxed text-fg-secondary marker:font-mono marker:text-fg-tertiary">
			{children}
		</ol>
	);
}

export function LI({ children }: { children: ReactNode }) {
	return <li className="pl-1">{children}</li>;
}

export function Code({ children }: { children: ReactNode }) {
	return (
		<code className="rounded-sm border border-border-default bg-bg-sunken px-1.5 py-0.5 font-mono text-[0.86em] text-fg-primary">
			{children}
		</code>
	);
}

export function Strong({ children }: { children: ReactNode }) {
	return <strong className="font-semibold text-fg-primary">{children}</strong>;
}

/** Internal links route through `next/link`; external ones open in a new tab. */
export function A({ href, children }: { href: string; children: ReactNode }) {
	const external = href.startsWith("http");

	if (external) {
		return (
			<a
				className="link-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
				href={href}
				rel="noreferrer"
				target="_blank"
			>
				{children}
			</a>
		);
	}

	return (
		<Link
			className="link-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
			href={href}
		>
			{children}
		</Link>
	);
}

export function Divider() {
	return <hr className="my-12 border-t border-border-default" />;
}

/** Pulled-aside note. `tone` picks the accent stripe, not a shouty background. */
export function Callout({
	tone = "note",
	title,
	children,
}: {
	tone?: "note" | "warning" | "danger";
	title?: string;
	children: ReactNode;
}) {
	const stripe = {
		note: "border-l-info",
		warning: "border-l-warning",
		danger: "border-l-danger",
	}[tone];

	return (
		<div
			className={cn(
				"my-6 rounded-r-md border border-l-[3px] border-border-default bg-bg-surface px-5 py-4",
				stripe,
			)}
		>
			{title ? (
				<div className="mb-1.5 text-sm font-semibold text-fg-primary">
					{title}
				</div>
			) : null}
			<div className="text-sm leading-relaxed text-fg-secondary [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
				{children}
			</div>
		</div>
	);
}

/**
 * A reference table.
 *
 * Wrapped in its own horizontal scroller: a five-column signature table would
 * otherwise force the whole page body to scroll sideways on a phone.
 */
export function Table({
	headers,
	rows,
}: {
	headers: readonly string[];
	rows: readonly (readonly ReactNode[])[];
}) {
	return (
		<div className="my-6 overflow-x-auto rounded-md border border-border-default">
			<table className="w-full border-collapse text-left text-sm">
				<thead>
					<tr className="bg-bg-sunken">
						{headers.map((header) => (
							<th
								className="whitespace-nowrap px-4 py-3 font-mono text-2xs tracking-wide text-fg-tertiary"
								key={header}
								scope="col"
							>
								{header.toUpperCase()}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, rowIndex) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: reference rows are static and never reordered
						<tr className="border-t border-border-default" key={rowIndex}>
							{row.map((cell, cellIndex) => (
								<td
									className={cn(
										"px-4 py-3 align-top leading-relaxed",
										cellIndex === 0
											? "whitespace-nowrap font-mono text-fg-primary"
											: "text-fg-secondary",
									)}
									// biome-ignore lint/suspicious/noArrayIndexKey: cells are positional by definition
									key={cellIndex}
								>
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/** Numbered walkthrough. Each step owns its own heading and body. */
export function Steps({ children }: { children: ReactNode }) {
	return <div className="my-8 flex flex-col gap-8">{children}</div>;
}

export function Step({
	n,
	title,
	id,
	children,
}: {
	n: number;
	title: string;
	id?: string;
	children: ReactNode;
}) {
	return (
		<section className="scroll-mt-28 border-t-2 border-accent pt-5" id={id}>
			<div className="mb-2 font-mono text-xs text-fg-tertiary">
				{String(n).padStart(2, "0")}
			</div>
			<h3 className="mb-2 text-md font-semibold text-fg-primary">{title}</h3>
			<div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
				{children}
			</div>
		</section>
	);
}

/** Grid of links out to other pages. Used on the introduction and section ends. */
export function CardGrid({ children }: { children: ReactNode }) {
	return <div className="my-6 grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function Card({
	href,
	title,
	children,
}: {
	href: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<Link
			className="block rounded-md border border-border-default bg-bg-surface p-5 transition-colors duration-base hover:border-accent"
			href={href}
		>
			<div className="mb-1.5 text-sm font-semibold text-fg-primary">
				{title}
			</div>
			<div className="text-sm leading-relaxed text-fg-secondary">
				{children}
			</div>
		</Link>
	);
}

/**
 * A named property with its type and description — the shape used across every
 * reference page, so a config field and a React prop read identically.
 */
export function Property({
	name,
	type,
	required,
	defaultValue,
	children,
}: {
	name: string;
	type: string;
	required?: boolean;
	defaultValue?: string;
	children: ReactNode;
}) {
	return (
		<div className="border-t border-border-default py-4 first:border-t-0">
			<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<code className="font-mono text-sm font-semibold text-fg-primary">
					{name}
				</code>
				<code className="font-mono text-xs text-accent-strong">{type}</code>
				{required ? (
					<span className="rounded-pill bg-bg-sunken px-2 py-0.5 text-2xs text-fg-tertiary">
						required
					</span>
				) : null}
				{defaultValue ? (
					<span className="font-mono text-2xs text-fg-tertiary">
						default {defaultValue}
					</span>
				) : null}
			</div>
			<div className="mt-1.5 text-sm leading-relaxed text-fg-secondary [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
				{children}
			</div>
		</div>
	);
}

export function PropertyList({ children }: { children: ReactNode }) {
	return (
		<div className="my-6 rounded-md border border-border-default bg-bg-surface px-5 py-1">
			{children}
		</div>
	);
}

/** HTTP method + path, used as a sub-heading on the API reference. */
export function Endpoint({
	method,
	path,
	id,
	auth,
}: {
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	path: string;
	id?: string;
	auth?: string;
}) {
	return (
		<div
			className="mt-10 mb-3 flex scroll-mt-28 flex-wrap items-center gap-3"
			id={id}
		>
			<span className="rounded-sm bg-fg-primary px-2 py-1 font-mono text-2xs font-semibold tracking-wide text-bg-page">
				{method}
			</span>
			<code className="font-mono text-sm font-semibold text-fg-primary">
				{path}
			</code>
			{auth ? (
				<span className="rounded-pill border border-border-default px-2.5 py-0.5 text-2xs text-fg-tertiary">
					{auth}
				</span>
			) : null}
		</div>
	);
}
