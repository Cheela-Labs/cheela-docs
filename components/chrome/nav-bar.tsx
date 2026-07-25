import Image from "next/image";
import { site } from "@/lib/site";

const NAV_ITEMS = [
	{ label: "Why Cheela", href: `${site.website}/why-cheela` },
	{ label: "Docs", href: "/", active: true },
	{ label: "Playground", href: `${site.website}/playground` },
	{ label: "Pricing", href: `${site.website}/pricing` },
	{ label: "Blog", href: `${site.website}/blog` },
	{ label: "Changelog", href: `${site.website}/changelog` },
	{ label: "About", href: `${site.website}/about` },
	{ label: "Contact", href: `${site.website}/contact` },
];

export function NavBar() {
	return (
		<header className="sticky top-0 z-40 border-b border-border-default bg-bg-page">
			<div className="mx-auto flex h-[72px] max-w-[var(--container-max)] flex-wrap items-center justify-between gap-4 px-5 sm:gap-8 sm:px-8">
				<a href={site.website} className="flex shrink-0 items-center gap-2.5">
					<Image
						src="/logo-mark.svg"
						alt=""
						width={34}
						height={34}
						className="size-[34px]"
					/>
					<span className="font-display text-md font-semibold tracking-tight text-fg-primary">
						Cheela Labs
					</span>
				</a>

				<nav className="order-3 flex flex-wrap items-center gap-4 overflow-x-auto sm:order-none sm:gap-6">
					{NAV_ITEMS.map((item) => (
						<a
							key={item.label}
							href={item.href}
							className={
								item.active
									? "whitespace-nowrap text-sm font-semibold text-fg-primary"
									: "whitespace-nowrap text-sm text-fg-secondary hover:text-fg-primary"
							}
						>
							{item.label}
						</a>
					))}
				</nav>

				<div className="flex shrink-0 items-center gap-4">
					<a
						href={site.npm}
						title="npm"
						className="flex items-center text-fg-secondary hover:text-fg-primary"
					>
						<span className="sr-only">npm</span>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M1.5 6h21v12h-6v-9h-3v9h-3v-9H4.5v9h-3V6z" />
						</svg>
					</a>
					<a
						href={site.dashboard}
						className="inline-flex items-center rounded-md bg-accent px-[18px] py-2.5 text-sm font-medium text-fg-on-accent transition-transform duration-fast ease-out active:scale-[0.97]"
					>
						Get started
					</a>
				</div>
			</div>
		</header>
	);
}
