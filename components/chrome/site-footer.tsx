import Image from "next/image";
import { site } from "@/lib/site";

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

const COLUMNS: FooterColumn[] = [
	{
		title: "PRODUCT",
		links: [
			{ label: "Why Cheela", href: `${site.website}/why-cheela` },
			{ label: "Docs", href: "/" },
			{ label: "Demos", href: site.demos },
			{ label: "Pricing", href: `${site.website}/pricing` },
		],
	},
	{
		title: "COMPANY",
		links: [
			{ label: "About", href: `${site.website}/about` },
			{ label: "Blog", href: site.blog },
			{ label: "Changelog", href: `${site.website}/changelog` },
			{ label: "Contact", href: `${site.website}/contact` },
		],
	},
	{
		title: "RESOURCES",
		links: [
			{ label: "Quickstart", href: "/quickstart" },
			{ label: "HTTP API", href: "/reference/http-api" },
			{ label: "CLI", href: "/reference/cli" },
			{ label: "SDK", href: "/reference/sdk" },
			{ label: "npm", href: site.npm },
		],
	},
	{
		title: "LEGAL",
		links: [
			{ label: "Privacy", href: `${site.website}/contact` },
			{ label: "Terms", href: `${site.website}/contact` },
			{ label: "Security", href: `${site.website}/contact` },
		],
	},
];

export function SiteFooter() {
	return (
		<footer className="bg-bg-inverse px-5 pb-8 pt-24 text-fg-on-inverse sm:px-8">
			<div className="mx-auto max-w-[var(--container-max)]">
				<div className="grid grid-cols-2 gap-8 pb-16 sm:grid-cols-3 md:grid-cols-5 md:gap-12">
					<div className="col-span-2 sm:col-span-3 md:col-span-1">
						<div className="mb-4 flex items-center gap-2.5">
							<Image
								src="/logo-mark.svg"
								alt=""
								width={24}
								height={24}
								className="size-6"
							/>
							<span className="font-display text-md font-semibold">
								Cheela Labs
							</span>
						</div>
						<p className="max-w-[280px] text-sm leading-relaxed text-ink-6">
							Infrastructure for agents. Build the layer between models and
							products.
						</p>
					</div>
					{COLUMNS.map((col) => (
						<div key={col.title}>
							<div className="mb-4 text-2xs tracking-wide text-ink-6">
								{col.title}
							</div>
							<div className="flex flex-col gap-3">
								{col.links.map((link) => (
									<a
										key={link.label}
										href={link.href}
										className="text-sm text-ink-6 hover:text-fg-on-inverse"
									>
										{link.label}
									</a>
								))}
							</div>
						</div>
					))}
				</div>
				<div className="flex flex-wrap items-center justify-between gap-4 border-t border-line-dark-1 pt-8">
					<span className="text-xs text-ink-6">
						© 2026 Cheela Labs. Ship AI-native.
					</span>
					<div className="flex gap-6">
						<a
							href={site.npm}
							className="text-xs text-ink-6 hover:text-fg-on-inverse"
						>
							npm
						</a>
						<a
							href={site.x}
							className="text-xs text-ink-6 hover:text-fg-on-inverse"
						>
							X
						</a>
						<a
							href={`${site.website}/contact`}
							className="text-xs text-ink-6 hover:text-fg-on-inverse"
						>
							Status
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
