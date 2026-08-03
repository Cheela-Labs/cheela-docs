"use client";

import { ArrowLeft, ArrowRight, PanelLeft, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { SidebarNav } from "@/components/docs/sidebar";
import { siblings } from "@/lib/nav";

/**
 * The three-column docs frame: navigation rail, article, on-this-page rail.
 *
 * Client-side only for the mobile disclosure — the rail itself is plain links,
 * but a phone has no room for 20 of them above the article.
 */
export function DocsShell({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();

	// Closes on navigation. Without this the panel stays open over the page the
	// reader just asked for, which reads as a broken link.
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the signal, not a value we read
	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	useEffect(() => {
		if (!open) return;

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setOpen(false);
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open]);

	return (
		<div className="mx-auto w-full max-w-[var(--container-max)] px-5 sm:px-8">
			<div className="flex items-center gap-3 border-b border-border-default py-3 lg:hidden">
				<button
					aria-controls="docs-nav"
					aria-expanded={open}
					className="inline-flex items-center gap-2 rounded-md border border-border-default px-3 py-2 text-sm text-fg-secondary"
					onClick={() => setOpen((value) => !value)}
					type="button"
				>
					{open ? <X size={16} /> : <PanelLeft size={16} />}
					{open ? "Close" : "Docs menu"}
				</button>
			</div>

			{open ? (
				<div
					className="border-b border-border-default py-6 lg:hidden"
					id="docs-nav"
				>
					<SidebarNav onNavigate={() => setOpen(false)} />
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-[228px_minmax(0,1fr)_180px] lg:gap-12">
				<div className="hidden self-start lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pb-8">
					<SidebarNav />
				</div>
				{children}
			</div>
		</div>
	);
}

/** Previous/next footer. Reads the reading order from `lib/nav`. */
export function PrevNext() {
	const pathname = usePathname();
	const { previous, next } = siblings(pathname);

	if (!previous && !next) return null;

	return (
		<nav
			aria-label="Pagination"
			className="mt-16 grid gap-4 border-t border-border-default pt-8 sm:grid-cols-2"
		>
			{previous ? (
				<Link
					className="group flex flex-col gap-1 rounded-md border border-border-default px-5 py-4 transition-colors duration-base hover:border-accent"
					href={previous.href}
				>
					<span className="flex items-center gap-1.5 text-2xs tracking-wide text-fg-tertiary">
						<ArrowLeft size={12} />
						PREVIOUS
					</span>
					<span className="text-sm font-medium text-fg-primary">
						{previous.title}
					</span>
				</Link>
			) : (
				<span />
			)}
			{next ? (
				<Link
					className="group flex flex-col items-end gap-1 rounded-md border border-border-default px-5 py-4 text-right transition-colors duration-base hover:border-accent sm:col-start-2"
					href={next.href}
				>
					<span className="flex items-center gap-1.5 text-2xs tracking-wide text-fg-tertiary">
						NEXT
						<ArrowRight size={12} />
					</span>
					<span className="text-sm font-medium text-fg-primary">
						{next.title}
					</span>
				</Link>
			) : null}
		</nav>
	);
}
