import { NavBar } from "@/components/chrome/nav-bar";
import { SiteFooter } from "@/components/chrome/site-footer";
import { site } from "@/lib/site";

const NAV_GROUPS = [
	{
		title: "START",
		items: [
			{ label: "Getting started", active: true },
			{ label: "Installation", active: false },
			{ label: "CLI", active: false },
		],
	},
	{
		title: "CORE CONCEPTS",
		items: [
			{ label: "SDK", active: false },
			{ label: "Runtime", active: false },
			{ label: "Gateway", active: false },
			{ label: "Authentication", active: false },
		],
	},
	{
		title: "REFERENCE",
		items: [
			{ label: "API reference", active: false },
			{ label: "Examples", active: false },
			{ label: "Tutorials", active: false },
		],
	},
	{
		title: "HELP",
		items: [
			{ label: "FAQ", active: false },
			{ label: "Troubleshooting", active: false },
		],
	},
];

const STEPS = [
	{
		id: "init",
		title: "1. Initialize your project",
		lines: [
			{ text: "$ npx cheela init" },
			{ text: "✓ created cheela.config.ts", tone: "success" },
		],
	},
	{
		id: "key",
		title: "2. Add your API key",
		lines: [
			{ text: "// cheela.config.ts" },
			{ text: "export default {" },
			{ text: '  apiKey: "sk-live-••••••••",' },
			{ text: "};" },
		],
	},
	{
		id: "capabilities",
		title: "3. Write a capability",
		lines: [
			{ text: "export const summarize = defineCapability({" },
			{ text: '  input: "text",' },
			{ text: '  output: "summary",' },
			{ text: "});" },
		],
	},
	{
		id: "runtime",
		title: "4. Create a runtime",
		lines: [
			{ text: "$ npx cheela runtime register \\" },
			{ text: "  --provider openai \\" },
			{ text: "  --model gpt-4.1" },
			{ text: "✓ runtime rt_8f2a registered", tone: "success" },
		],
	},
	{
		id: "deploy",
		title: "5. Deploy",
		lines: [
			{ text: "$ npx cheela deploy" },
			{ text: "✓ runtime rt_8f2a deployed · v1", tone: "success" },
		],
	},
] as const;

export default function DocsPage() {
	return (
		<>
			<NavBar />
			<div className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[240px_1fr_200px] lg:gap-12 lg:py-10">
				<nav className="flex flex-col gap-6 self-start lg:sticky lg:top-24">
					{NAV_GROUPS.map((group) => (
						<div key={group.title}>
							<div className="mb-2 text-2xs tracking-wide text-fg-tertiary">
								{group.title}
							</div>
							<div className="flex flex-col gap-0.5">
								{group.items.map((item) =>
									item.active ? (
										<a
											key={item.label}
											href="#top"
											className="rounded-sm bg-accent-soft px-2.5 py-1.5 text-sm text-fg-primary"
										>
											{item.label}
										</a>
									) : (
										<span
											key={item.label}
											className="cursor-default rounded-sm px-2.5 py-1.5 text-sm text-fg-secondary"
											title="Coming soon"
										>
											{item.label}
										</span>
									),
								)}
							</div>
						</div>
					))}
				</nav>

				<main id="top" className="max-w-[640px]">
					<div className="mb-4 font-mono text-xs tracking-wide text-accent-strong">
						GETTING STARTED
					</div>
					<h1 className="mb-5 font-display text-3xl font-bold tracking-tight text-fg-primary">
						Init, configure, and deploy your first runtime.
					</h1>
					<p className="mb-8 text-md leading-relaxed text-fg-secondary">
						Cheela ships as a single CLI plus a thin SDK. Five steps from init
						to your first deployed runtime.
					</p>

					{STEPS.map((step) => (
						<div key={step.id}>
							<h2
								id={step.id}
								className="mb-4 mt-10 text-lg font-semibold text-fg-primary"
							>
								{step.title}
							</h2>
							<div className="mb-6 rounded-md bg-ink-1 px-6 py-5 font-mono text-sm text-console-fg">
								{step.lines.map((line) => (
									<div
										key={line.text}
										className={
											"tone" in line && line.tone === "success"
												? "text-success"
												: undefined
										}
									>
										{line.text}
									</div>
								))}
							</div>
						</div>
					))}

					<p className="text-sm leading-relaxed text-fg-secondary">
						That's it — routing, retries, and eval scoring run automatically,
						and every execution shows up in your dashboard under{" "}
						<code className="rounded-sm bg-bg-sunken px-1.5 py-0.5 font-mono">
							Executions
						</code>
						.
					</p>

					<div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-md border border-border-default p-6">
						<div>
							<div className="text-sm font-semibold">
								Ready to run this for real?
							</div>
							<div className="text-sm text-fg-secondary">
								Create a runtime and deploy it from the dashboard.
							</div>
						</div>
						<a
							href={site.dashboard}
							className="inline-flex shrink-0 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-fg-on-accent"
						>
							Open dashboard
						</a>
					</div>
				</main>

				<aside className="hidden self-start lg:sticky lg:top-24 lg:block">
					<div className="mb-3 text-2xs tracking-wide text-fg-tertiary">
						ON THIS PAGE
					</div>
					<div className="flex flex-col gap-2">
						{STEPS.map((step) => (
							<a
								key={step.id}
								href={`#${step.id}`}
								className="text-sm text-fg-secondary hover:text-fg-primary"
							>
								{step.title.replace(/^\d+\.\s*/, "")}
							</a>
						))}
					</div>
				</aside>
			</div>
			<SiteFooter />
		</>
	);
}
