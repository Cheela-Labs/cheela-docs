"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * Rendered twice — once in the sticky desktop rail, once inside the mobile
 * disclosure in `DocsShell`. Both read the same `nav` tree, so the two can
 * never drift apart.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();

	return (
		<nav aria-label="Documentation" className="flex flex-col gap-7">
			{nav.map((group) => (
				<div key={group.title}>
					<div className="mb-2 px-2.5 font-mono text-2xs tracking-wide text-fg-tertiary">
						{group.title}
					</div>
					<ul className="flex flex-col gap-0.5">
						{group.items.map((item) => {
							const active = pathname === item.href;
							return (
								<li key={item.href}>
									<Link
										aria-current={active ? "page" : undefined}
										className={cn(
											"block rounded-sm px-2.5 py-1.5 text-sm transition-colors duration-fast",
											active
												? "bg-accent-soft font-medium text-fg-primary"
												: "text-fg-secondary hover:bg-bg-sunken hover:text-fg-primary",
										)}
										href={item.href}
										onClick={onNavigate}
									>
										{item.title}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</nav>
	);
}
