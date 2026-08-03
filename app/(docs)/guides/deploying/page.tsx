import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	H2,
	LI,
	OL,
	P,
	Strong,
	Table,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Deploy a runtime",
	description:
		"What cheela deploy does, in order: load, discover, generate, validate, push. Plus what it writes and what to commit.",
	alternates: { canonical: "/guides/deploying" },
};

const TOC = [
	{ id: "pipeline", title: "The pipeline" },
	{ id: "dry-run", title: "Dry runs" },
	{ id: "generators", title: "Generators" },
	{ id: "artifacts", title: "What gets written" },
	{ id: "drift", title: "Capability drift" },
	{ id: "ci", title: "Deploying from CI" },
	{ id: "custom", title: "Custom generators" },
];

export default function DeployingPage() {
	return (
		<DocPage
			eyebrow="Guides"
			lead="`cheela deploy` compiles your capability set into a manifest, writes four artifacts alongside it, and pushes the result to the control plane. It stops at the first validation failure, before anything is written or sent."
			title="Deploy a runtime"
			toc={TOC}
		>
			<H2 id="pipeline">The pipeline</H2>
			<OL>
				<LI>
					<Strong>Load configuration.</Strong> <Code>cheela.config.ts</Code> is
					evaluated through <Code>tsx</Code>, after <Code>.env</Code> is read,
					so your config sees the same environment your app does.
				</LI>
				<LI>
					<Strong>Validate configuration.</Strong> Against a schema. A bad{" "}
					<Code>endpoint</Code> or a missing <Code>apiKey</Code> stops here.
				</LI>
				<LI>
					<Strong>Discover the runtime.</Strong> The module at{" "}
					<Code>.cheela/runtime.ts</Code> must default-export a{" "}
					<Code>Runtime</Code>.
				</LI>
				<LI>
					<Strong>Discover capabilities.</Strong> Every registration, with its
					schemas serialized to JSON Schema.
				</LI>
				<LI>
					<Strong>Run generators.</Strong> Every enabled generator is validated
					first, then each runs and has its output checked immediately.
				</LI>
				<LI>
					<Strong>Compile the manifest.</Strong> Capabilities, your{" "}
					<Code>website</Code> block, your namespace, the CLI version.
				</LI>
				<LI>
					<Strong>Authenticate and push.</Strong>{" "}
					<Code>POST /v1/deployments</Code> with the deploy key.
				</LI>
			</OL>
			<P>
				Nothing is written to disk or sent over the network past the first
				thrown error.
			</P>

			<H2 id="dry-run">Dry runs</H2>
			<P>
				<Code>--dry-run</Code> runs everything except the push. Generators still
				write their files, so this is also how you regenerate artifacts without
				creating a deployment.
			</P>
			<CodeBlock label="Terminal">{`npx cheela deploy --dry-run`}</CodeBlock>
			<CodeBlock label="Output">{`Cheela Deploy

✓ Config loaded
✓ Runtime loaded
✓ Found 4 capabilities
✓ Found 4 actions
✓ Deployment manifest valid

Generators
  capability-manifest   .cheela/generated/capability-manifest/capabilities.json (unchanged)
  runtime-manifest      .cheela/generated/runtime-manifest/runtime.json (unchanged)
  openapi               .cheela/generated/openapi/openapi.json (updated)
  adp                   .cheela/generated/adp/agent-discovery.json (updated)

Dry run complete.
No deployment was created.`}</CodeBlock>

			<Callout title="Watch for the schema warning" tone="warning">
				<p>
					After a real deploy, the CLI names any capability published without an
					input schema. The model is told those take no parameters. That is
					correct for something genuinely nullary and a bug for everything else
					— usually a schema that was not exported, or one that could not be
					serialized.
				</p>
			</Callout>

			<H2 id="generators">Generators</H2>
			<P>
				Four run by default. Each turns your capability set into a different
				artifact.
			</P>
			<Table
				headers={["Generator", "Output", "What it is for"]}
				rows={[
					[
						"capability-manifest",
						"capability-manifest/capabilities.json",
						"The canonical list of what this runtime exposes.",
					],
					[
						"runtime-manifest",
						"runtime-manifest/runtime.json",
						"Runtime-level metadata, including SDK and CLI versions.",
					],
					[
						"openapi",
						"openapi/openapi.json",
						"An OpenAPI document, so existing API tooling can read your capabilities.",
					],
					[
						"adp",
						"adp/agent-discovery.json",
						"An Agent Discovery Specification manifest, for publishing.",
					],
				]}
			/>
			<P>Disable any of them by name:</P>
			<CodeBlock filename="cheela.config.ts">{`export default defineConfig({
  apiKey: process.env.CHEELA_API_KEY!,
  generators: {
    disabled: ["openapi"],
  },
});`}</CodeBlock>
			<P>
				Runs are incremental. A generator whose inputs have not changed is
				skipped and reported as <Code>skipped (cached)</Code>; the cache lives
				in <Code>.cheela/generate.cache.json</Code>, which is gitignored.
			</P>

			<H2 id="artifacts">What gets written</H2>
			<CodeBlock label="Project">{`.cheela/
├── generated/              # commit this
│   ├── capability-manifest/capabilities.json
│   ├── runtime-manifest/runtime.json
│   ├── openapi/openapi.json
│   └── adp/agent-discovery.json
└── generate.cache.json     # gitignored`}</CodeBlock>
			<P>
				Commit <Code>generated/</Code>. The files are diffable, which means a
				pull request shows exactly how a published schema changed — the review
				you want before a stranger&rsquo;s agent starts depending on it. Only
				the cache is local and derived.
			</P>

			<H2 id="drift">Capability drift</H2>
			<P>
				Before pushing, <Code>deploy</Code> compares your local capability names
				against what is currently live and prints the difference. Same check, on
				demand:
			</P>
			<CodeBlock label="Terminal">{`npx cheela status`}</CodeBlock>
			<P>
				If they disagree, status shows the diff and tells you to deploy. A
				failed status call never blocks a deploy — the diff is information, not
				a gate.
			</P>

			<Callout title="Removing a capability is a breaking change" tone="danger">
				<p>
					If you have published a manifest, other people&rsquo;s agents may have
					cached the capability&rsquo;s address. The discovery spec has
					deprecation fields for exactly this — mark it deprecated and leave it
					serving before you delete it.
				</p>
			</Callout>

			<H2 id="ci">Deploying from CI</H2>
			<P>
				Deploy needs the deploy key and nothing else. Your endpoint should
				already be live at the URL in your config — deploying does not start
				anything.
			</P>
			<CodeBlock filename=".github/workflows/deploy.yml">{`- name: Deploy Cheela runtime
  run: npx cheela deploy
  env:
    CHEELA_API_KEY: \${{ secrets.CHEELA_API_KEY }}`}</CodeBlock>
			<P>
				Add a dry run to pull requests to catch a broken capability set before
				it merges:
			</P>
			<CodeBlock filename=".github/workflows/pr.yml">{`- name: Validate Cheela capabilities
  run: npx cheela deploy --dry-run
  env:
    CHEELA_API_KEY: \${{ secrets.CHEELA_API_KEY }}`}</CodeBlock>
			<P>
				Sequence matters: deploy <em>after</em> your application, so the
				endpoint serving the new capability set exists before the control plane
				starts routing to it.
			</P>

			<H2 id="custom">Custom generators</H2>
			<P>
				A generator is an object with a <Code>name</Code>, an{" "}
				<Code>inputs()</Code> function used for cache invalidation, and a{" "}
				<Code>generate()</Code> function returning files to write. Register
				yours in config — they are appended to the built-ins, never a
				replacement.
			</P>
			<CodeBlock filename="cheela.config.ts">{`export default defineConfig({
  apiKey: process.env.CHEELA_API_KEY!,
  generators: {
    custom: [
      {
        name: "typed-client",
        inputs: (context) => context.capabilities.map((c) => c.capability.name),
        generate: (context) => [
          {
            path: "typed-client/client.ts",
            contents: renderClient(context.capabilities),
          },
        ],
      },
    ],
  },
});`}</CodeBlock>
			<P>
				Names must be unique across built-ins and custom generators; a collision
				is an error rather than a silent override. Anything that is not
				generator-shaped is rejected at load time with a message saying what was
				missing.
			</P>
			<P>
				Full command syntax is in <A href="/reference/cli">the CLI reference</A>
				, and every config field in{" "}
				<A href="/reference/configuration">Configuration</A>.
			</P>
		</DocPage>
	);
}
