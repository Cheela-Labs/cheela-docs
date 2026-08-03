import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	H2,
	LI,
	P,
	Strong,
	Table,
	UL,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "CLI",
	description:
		"Every cheela command: init, dev, deploy, status, and manifest pull — with flags, output, and exit behaviour.",
	alternates: { canonical: "/reference/cli" },
};

const TOC = [
	{ id: "install", title: "Running it" },
	{ id: "init", title: "cheela init" },
	{ id: "dev", title: "cheela dev" },
	{ id: "deploy", title: "cheela deploy" },
	{ id: "status", title: "cheela status" },
	{ id: "manifest", title: "cheela manifest pull" },
	{ id: "env", title: "Environment" },
	{ id: "exit", title: "Exit codes" },
];

export default function CliReferencePage() {
	return (
		<DocPage
			path="/reference/cli"
			eyebrow="Reference"
			lead="Five commands. The CLI has no argument-parsing dependency, so flags are matched exactly as documented — an unrecognised argument prints usage rather than being ignored."
			title="CLI"
			toc={TOC}
		>
			<H2 id="install">Running it</H2>
			<CodeBlock label="Terminal">{`npx cheela <command>

# or install it into the project
npm install -D @cheela/cli`}</CodeBlock>
			<P>
				<Code>cheela init</Code> writes scripts for the three you will use most:
			</P>
			<CodeBlock filename="package.json">{`{
  "scripts": {
    "dev": "cheela dev",
    "deploy": "cheela deploy",
    "status": "cheela status"
  }
}`}</CodeBlock>
			<CodeBlock label="Terminal">{`cheela --help    # or -h, or no arguments at all`}</CodeBlock>

			<H2 id="init">cheela init</H2>
			<P>Scaffolds a project in the current directory. Takes no arguments.</P>
			<CodeBlock label="Terminal">{`npx cheela init`}</CodeBlock>
			<Table
				headers={["Path", "Contents"]}
				rows={[
					[".cheela/runtime.ts", "An empty Runtime, default-exported."],
					[
						"cheela.config.ts",
						"A defineConfig call with apiKey wired to the environment, and commented placeholders for endpoint, website and adp.",
					],
					[
						"package.json",
						"Dependencies on @cheela/cli, @cheela/runtime and @cheela/sdk, plus the three scripts above.",
					],
					[".env.example", "CHEELA_API_KEY."],
					[
						".gitignore",
						"Appends .env and .cheela/generate.cache.json if they are missing.",
					],
				]}
			/>
			<Callout title="It never overwrites" tone="note">
				<p>
					A file that already exists is reported as <Code>✓ Preserved</Code>{" "}
					rather than replaced, so running <Code>init</Code> in a populated
					directory is safe.
				</p>
			</Callout>

			<H2 id="dev">cheela dev</H2>
			<P>
				Prints the capability tree your runtime module registers. No network
				calls, no writes — this is the fast check that a registration compiles
				and resolves.
			</P>
			<CodeBlock label="Terminal">{`npx cheela dev`}</CodeBlock>
			<CodeBlock label="Output">{`Cheela Runtime

Capabilities

catalog-search
  └─ search

order-status
  └─ lookup

✓ Runtime ready`}</CodeBlock>

			<H2 id="deploy">cheela deploy</H2>
			<P>
				Runs the full pipeline and pushes a deployment. Requires{" "}
				<Code>CHEELA_API_KEY</Code>.
			</P>
			<CodeBlock label="Terminal">{`npx cheela deploy
npx cheela deploy --dry-run`}</CodeBlock>
			<Table
				headers={["Flag", "Effect"]}
				rows={[
					[
						"--dry-run",
						"Everything except the push. Generators still write their files, so this also regenerates artifacts on demand.",
					],
				]}
			/>
			<P>
				<Code>--dry-run</Code> is the only accepted argument. Anything else
				prints usage and exits non-zero.
			</P>
			<P>Output reports, in order:</P>
			<UL>
				<LI>config loaded, runtime loaded, capability and action counts</LI>
				<LI>
					each generator with its output path and one of <Code>created</Code>,{" "}
					<Code>updated</Code>, <Code>unchanged</Code>,{" "}
					<Code>skipped (cached)</Code>
				</LI>
				<LI>
					a capability diff against what is currently live, when the two
					disagree
				</LI>
				<LI>the new deployment version and status</LI>
				<LI>
					a warning naming any capability published without an input schema
				</LI>
			</UL>
			<Callout title="The schema warning is worth reading" tone="warning">
				<p>
					A capability with no input schema is advertised to the model as taking
					no parameters. Legitimate for something nullary; a bug everywhere
					else.
				</p>
			</Callout>
			<P>
				Full walkthrough in <A href="/guides/deploying">Deploy a runtime</A>.
			</P>

			<H2 id="status">cheela status</H2>
			<P>
				Reports what the control plane holds for this runtime, and diffs it
				against your local registrations. Requires <Code>CHEELA_API_KEY</Code>.
			</P>
			<CodeBlock label="Terminal">{`npx cheela status`}</CodeBlock>
			<CodeBlock label="Output">{`Cheela Runtime

Runtime        rt_8f2a
Deployment     3
Status         active
Connection     online
Transport      http
Provider       openrouter
Model          ...

Capabilities   4, in sync`}</CodeBlock>
			<P>When they disagree, the diff is printed instead:</P>
			<CodeBlock label="Output">{`Capabilities   out of sync with the deployment

  + catalog-search      (local, not deployed)
  - legacy-lookup       (deployed, not local)

Run \`cheela deploy\` to publish the current set.`}</CodeBlock>
			<P>
				Polling status doubles as the runtime&rsquo;s check-in — it is what
				drives the online/offline indicator, so there is no separate call to
				wire up.
			</P>

			<H2 id="manifest">cheela manifest pull</H2>
			<P>
				Fetches the published capability manifest and writes it into the
				frontend that serves it.
			</P>
			<CodeBlock label="Terminal">{`npx cheela manifest pull --runtime rt_8f2a
npx cheela manifest pull --runtime rt_8f2a --out static/.well-known/agent-discovery.json`}</CodeBlock>
			<Table
				headers={["Flag", "Required", "Default"]}
				rows={[
					["--runtime", "yes", "—"],
					["--out", "no", "public/.well-known/agent-discovery.json"],
				]}
			/>
			<P>
				This is the one command that needs no <Code>cheela.config.ts</Code>, no
				runtime module, and no credential. It runs in your frontend&rsquo;s
				build, which frequently lives in a different repository from your
				capabilities.
			</P>
			<P>
				Missing <Code>--runtime</Code> is an error, and the message tells you
				where to find the id.
			</P>
			<P>
				See <A href="/guides/publishing-a-manifest">Publish a manifest</A>.
			</P>

			<H2 id="env">Environment</H2>
			<P>
				<Code>.env</Code> is loaded from the project root before{" "}
				<Code>cheela.config.ts</Code> is evaluated, so your config reads
				populated values.
			</P>
			<Table
				headers={["Variable", "Used by", "Default"]}
				rows={[["CHEELA_API_KEY", "deploy, status", "— (required)"]]}
			/>
			<P>
				The project root is found by walking up from the working directory, so
				commands work from a subdirectory.
			</P>

			<H2 id="exit">Exit codes</H2>
			<Table
				headers={["Code", "When"]}
				rows={[
					["0", "The command succeeded, including a dry run."],
					[
						"1",
						"Anything else: an unknown command, a missing required flag, invalid config, an unloadable runtime, or a failed request.",
					],
				]}
			/>
			<P>
				Errors are printed as <Code>✗ message</Code> on stderr. Three of them
				name a specific fix rather than a symptom:
			</P>
			<UL>
				<LI>
					<Strong>Unreachable control plane</Strong> — check your network.
				</LI>
				<LI>
					<Strong>401 or 403</Strong> — <Code>CHEELA_API_KEY</Code> is invalid
					or does not belong to an active runtime.
				</LI>
				<LI>
					<Strong>Invalid config</Strong> — every failing field is listed with
					its own message.
				</LI>
			</UL>
			<P>
				More in <A href="/troubleshooting">Troubleshooting</A>.
			</P>
		</DocPage>
	);
}
