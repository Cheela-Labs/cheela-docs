import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	H2,
	H3,
	LI,
	P,
	Strong,
	Table,
	UL,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Installation",
	description:
		"Which Cheela packages to install for which job, the Node version required, and what the CLI writes into a project.",
	alternates: { canonical: "/installation" },
};

const TOC = [
	{ id: "requirements", title: "Requirements" },
	{ id: "which-packages", title: "Which packages" },
	{ id: "project-layout", title: "Project layout" },
	{ id: "environment", title: "Environment variables" },
	{ id: "typescript", title: "TypeScript and bundlers" },
];

export default function InstallationPage() {
	return (
		<DocPage
			eyebrow="Start"
			lead="Cheela is a set of small packages rather than one framework. Install the two or three that match what you are building."
			title="Installation"
			toc={TOC}
		>
			<H2 id="requirements">Requirements</H2>
			<UL>
				<LI>
					<Strong>Node 22 or newer.</Strong> Every package declares{" "}
					<Code>engines.node {">"}= 22</Code>; the runtime uses{" "}
					<Code>crypto.randomUUID</Code> and <Code>node:crypto</Code>&rsquo;s
					timing-safe comparison.
				</LI>
				<LI>
					<Strong>A package manager.</Strong> The monorepo uses pnpm; npm and
					yarn work identically for consumers.
				</LI>
				<LI>
					<Strong>An HTTPS endpoint</Strong> if you are serving capabilities.
					Cheela calls in, so a local runtime needs a tunnel.
				</LI>
			</UL>

			<H2 id="which-packages">Which packages</H2>

			<H3>Serving capabilities</H3>
			<P>
				The common case: your product exposes things a model can do. You need
				the CLI to deploy, and the runtime to serve.
			</P>
			<CodeBlock label="Terminal">{`npm install @cheela/runtime @cheela/sdk
npm install -D @cheela/cli`}</CodeBlock>
			<P>
				<Code>@cheela/sdk</Code> is a peer of the runtime — it holds the{" "}
				<Code>Capability</Code> and <Code>Action</Code> types, plus the naming
				rules both the CLI and the control plane enforce. You will also want a
				schema library; every example here uses{" "}
				<A href="https://zod.dev">Zod</A>, but anything exposing{" "}
				<Code>parse(value)</Code> satisfies the <Code>Schema</Code> interface.
			</P>

			<H3>Embedding chat in React</H3>
			<CodeBlock label="Terminal">{`npm install @cheela/ui`}</CodeBlock>
			<P>
				<Code>@cheela/ui</Code> re-exports the types you need from{" "}
				<Code>@cheela/client</Code>, so most React projects never depend on it
				directly.
			</P>

			<H3>Embedding chat without a build step</H3>
			<CodeBlock filename="index.html">{`<script src="https://unpkg.com/@cheela/web-component/dist/cheela-chat.js"></script>
<cheela-chat api-key="ch_pk_..."></cheela-chat>`}</CodeBlock>
			<P>
				The custom element registers itself and lazily fetches its own core
				chunk, so the tag in the markup costs almost nothing until it mounts.
			</P>

			<H3>Everything else</H3>
			<Table
				headers={["Package", "Install it when"]}
				rows={[
					[
						"@cheela/client",
						"You are building a chat UI for a framework that is not React.",
					],
					[
						"@cheela/protocol",
						"You need the wire types (Message, ExecutionResult) without a client.",
					],
					[
						"@cheela/provider",
						"You are calling OpenAI, Anthropic, Gemini or OpenRouter through one interface, outside Cheela.",
					],
					[
						"@cheela/adp",
						"You are reading or validating Agent Discovery Specification manifests.",
					],
				]}
			/>

			<H2 id="project-layout">Project layout</H2>
			<P>
				<Code>cheela init</Code> writes a conventional layout. Nothing here is
				magic — every path is configurable — but the defaults are what the CLI
				looks for.
			</P>
			<CodeBlock label="Project">{`.
├── .cheela/
│   ├── runtime.ts              # you write this — capabilities live here
│   ├── generated/              # commit this — reviewable in PRs
│   │   ├── capability-manifest/capabilities.json
│   │   ├── runtime-manifest/runtime.json
│   │   ├── openapi/openapi.json
│   │   └── adp/agent-discovery.json
│   └── generate.cache.json     # gitignored — incremental build cache
├── cheela.config.ts
├── .env
└── package.json`}</CodeBlock>

			<Callout title="Commit .cheela/generated" tone="note">
				<p>
					The generated artifacts are diffable. Committing them means a pull
					request shows exactly how a capability&rsquo;s published schema
					changed, which is the review you want before a stranger&rsquo;s agent
					starts relying on it. Only <Code>generate.cache.json</Code> is local.
				</p>
			</Callout>

			<P>
				To keep capabilities somewhere else, point <Code>runtime</Code> at it:
			</P>
			<CodeBlock filename="cheela.config.ts">{`export default defineConfig({
  apiKey: process.env.CHEELA_API_KEY!,
  runtime: "src/cheela/capabilities.ts",
});`}</CodeBlock>

			<H2 id="environment">Environment variables</H2>
			<P>
				The CLI loads <Code>.env</Code> from the project root before it
				evaluates <Code>cheela.config.ts</Code>, so <Code>process.env</Code> is
				populated by the time your config reads it.
			</P>

			<Table
				headers={["Variable", "Used by", "What it is"]}
				rows={[
					[
						"CHEELA_API_KEY",
						"CLI",
						<>
							The deploy key, <Code>ch_sk_…</Code>. Authorises{" "}
							<Code>deploy</Code> and <Code>status</Code>. Secret.
						</>,
					],
					[
						"CHEELA_RUNTIME_SECRET",
						"Your endpoint",
						<>
							Verifies Cheela&rsquo;s request signature. Shown when the runtime
							is created.
						</>,
					],
					[
						"CHEELA_RUNTIME_ID",
						"Your endpoint",
						<>
							Optional. Pins signatures to one runtime, so a signature minted
							for another is rejected.
						</>,
					],
				]}
			/>

			<Callout title="Never default the runtime secret" tone="danger">
				<p>
					Reading it as{" "}
					<Code>process.env.CHEELA_RUNTIME_SECRET ?? &quot;&quot;</Code>{" "}
					verifies every signature against the empty string, so every request
					fails as <Code>signature_mismatch</Code> — which reads like a wrong
					key and sends you off rotating a credential that was fine. Throw
					instead.
				</p>
			</Callout>

			<H2 id="typescript">TypeScript and bundlers</H2>
			<P>
				Every package ships ESM with type declarations and no CommonJS build.
				Set <Code>&quot;type&quot;: &quot;module&quot;</Code> in your{" "}
				<Code>package.json</Code>, and use{" "}
				<Code>&quot;moduleResolution&quot;: &quot;bundler&quot;</Code> or{" "}
				<Code>&quot;nodenext&quot;</Code>.
			</P>
			<P>
				The CLI evaluates <Code>cheela.config.ts</Code> and your runtime module
				through <Code>tsx</Code>, so neither file needs compiling before{" "}
				<Code>cheela deploy</Code> — and neither ends up in your application
				bundle unless you import it there.
			</P>
			<P>
				<Code>@cheela/ui</Code> marks its components{" "}
				<Code>&quot;use client&quot;</Code> internally. In the Next.js App
				Router you can render <Code>{"<CheelaProvider>"}</Code> directly from a
				Server Component; the boundary is drawn for you.
			</P>
		</DocPage>
	);
}
