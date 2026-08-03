import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	H2,
	LI,
	P,
	Step,
	Steps,
	Strong,
	UL,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Quickstart",
	description:
		"Register one capability, serve it from a signed endpoint, deploy it, and watch a model call it.",
	alternates: { canonical: "/quickstart" },
};

const TOC = [
	{ id: "before", title: "Before you start" },
	{ id: "init", title: "1. Scaffold the project" },
	{ id: "runtime", title: "2. Create a runtime" },
	{ id: "capability", title: "3. Write a capability" },
	{ id: "endpoint", title: "4. Serve the endpoint" },
	{ id: "expose", title: "5. Make it reachable" },
	{ id: "deploy", title: "6. Deploy" },
	{ id: "call", title: "7. Call it" },
	{ id: "next", title: "What to read next" },
];

export default function QuickstartPage() {
	return (
		<DocPage
			path="/quickstart"
			eyebrow="Start"
			lead="By the end of this page a model will call code running on your machine. Budget about ten minutes, most of it waiting on npm."
			title="Quickstart"
			toc={TOC}
		>
			<H2 id="before">Before you start</H2>
			<UL>
				<LI>
					<Strong>Node 22 or newer.</Strong> Check with <Code>node -v</Code>.
				</LI>
				<LI>
					An account on{" "}
					<A href="https://dashboard.cheelalabs.com">the dashboard</A>. The free
					tier is enough for this page.
				</LI>
				<LI>
					A way to expose a local port over HTTPS — ngrok, cloudflared, or
					anything equivalent. Cheela calls <em>into</em> your endpoint, so
					localhost alone will not do.
				</LI>
			</UL>

			<Steps>
				<Step id="init" n={1} title="Scaffold the project">
					<P>Run the initializer in an empty directory.</P>
					<CodeBlock label="Terminal">{`npx cheela init`}</CodeBlock>
					<P>
						It writes five things and overwrites none of them if they exist:
					</P>
					<UL>
						<LI>
							<Code>.cheela/runtime.ts</Code> — where capabilities are
							registered
						</LI>
						<LI>
							<Code>cheela.config.ts</Code> — your API key, endpoint, and
							product description
						</LI>
						<LI>
							<Code>package.json</Code> — with <Code>@cheela/cli</Code>,{" "}
							<Code>@cheela/runtime</Code>, <Code>@cheela/sdk</Code>
						</LI>
						<LI>
							<Code>.env.example</Code>
						</LI>
						<LI>
							<Code>.gitignore</Code> entries for <Code>.env</Code> and the
							generator cache
						</LI>
					</UL>
					<CodeBlock label="Terminal">{`npm install   # or pnpm install / yarn`}</CodeBlock>
				</Step>

				<Step id="runtime" n={2} title="Create a runtime">
					<P>
						A runtime is the identity that owns your capabilities. Create one in
						the dashboard. You get three credentials, and they are not
						interchangeable:
					</P>
					<UL>
						<LI>
							<Code>ch_sk_…</Code> — the <Strong>deploy key</Strong>. Secret.
							This is <Code>CHEELA_API_KEY</Code>.
						</LI>
						<LI>
							<Code>ch_pk_…</Code> — the <Strong>public key</Strong>. Safe to
							embed in a web page. It can execute, never deploy.
						</LI>
						<LI>
							The <Strong>runtime secret</Strong> — used to sign requests to
							your endpoint. This is <Code>CHEELA_RUNTIME_SECRET</Code>.
						</LI>
					</UL>
					<CodeBlock filename=".env">{`CHEELA_API_KEY=ch_sk_...
CHEELA_RUNTIME_SECRET=...
CHEELA_RUNTIME_ID=rt_...`}</CodeBlock>
				</Step>

				<Step id="capability" n={3} title="Write a capability">
					<P>
						Two objects: what the capability <em>is</em>, and what it{" "}
						<em>does</em>. The first is published to Cheela; the second never
						leaves your machine.
					</P>
					<CodeBlock filename=".cheela/runtime.ts">{`import { Runtime } from "@cheela/runtime";
import { z } from "zod";

const runtime = new Runtime();

runtime.register(
  {
    name: "weather-now",
    description: "Current conditions for a city",
    // Required — the Agent Discovery Specification needs it, so deploy does too.
    version: "1.0.0",
    input: z.object({ city: z.string() }),
  },
  {
    name: "lookup",
    async handler(context, input) {
      console.log("called for", input.city, "as", context.executionId);
      return { city: input.city, tempC: 21, sky: "clear" };
    },
  },
);

export default runtime;`}</CodeBlock>
					<Callout
						title="Names allow letters, digits and hyphens"
						tone="warning"
					>
						<p>
							<Code>weather-now</Code> is legal. <Code>weather.now</Code> and{" "}
							<Code>weather_now</Code> are not — tool-calling APIs reject the
							dot, and the discovery spec rejects the underscore. The runtime
							refuses the name at registration rather than letting it fail later
							as an opaque provider error.
						</p>
					</Callout>
					<P>Check what is registered without deploying anything:</P>
					<CodeBlock label="Terminal">{`npx cheela dev`}</CodeBlock>
				</Step>

				<Step id="endpoint" n={4} title="Serve the endpoint">
					<P>
						Cheela calls you over HTTPS, and signs every request.{" "}
						<Code>createCheelaHandler</Code> verifies the signature and
						dispatches to your runtime. In a Next.js app:
					</P>
					<CodeBlock filename="app/cheela/execute/route.ts">{`import { createCheelaHandler } from "@cheela/runtime";
import runtime from "../../../.cheela/runtime";

export const POST = createCheelaHandler({
  runtime,
  secret: process.env.CHEELA_RUNTIME_SECRET!,
  runtimeId: process.env.CHEELA_RUNTIME_ID,
});

// The signature covers the exact bytes received, so nothing may re-parse
// the body before verification.
export const dynamic = "force-dynamic";`}</CodeBlock>
					<P>
						Express, Hono, Bun, Deno and Cloudflare Workers are covered too —
						see{" "}
						<A href="/guides/serving-capabilities">Serve capability calls</A>.
					</P>
				</Step>

				<Step id="expose" n={5} title="Make it reachable">
					<P>
						Start your app, then open a tunnel to it and put the public URL in
						your config.
					</P>
					<CodeBlock label="Terminal">{`ngrok http 3000
# → https://your-subdomain.ngrok-free.app`}</CodeBlock>
					<CodeBlock filename="cheela.config.ts">{`import { defineConfig } from "@cheela/cli";

export default defineConfig({
  apiKey: process.env.CHEELA_API_KEY!,
  endpoint: "https://your-subdomain.ngrok-free.app/cheela/execute",

  website: {
    name: "My Product",
    description: "What this runtime does.",
    url: "https://example.com",
  },
  adp: {
    namespace: "com.example",
  },
});`}</CodeBlock>
					<P>
						There is no <Code>provider</Code> or <Code>model</Code> field. Both
						are Cheela&rsquo;s, because Cheela pays for the tokens.
					</P>
				</Step>

				<Step id="deploy" n={6} title="Deploy">
					<P>See what would be sent before sending it:</P>
					<CodeBlock label="Terminal">{`npx cheela deploy --dry-run`}</CodeBlock>
					<P>Then publish:</P>
					<CodeBlock label="Terminal">{`npx cheela deploy`}</CodeBlock>
					<CodeBlock label="Output">{`Cheela Deploy

✓ Config loaded
✓ Runtime loaded
✓ Found 1 capabilities
✓ Found 1 actions
✓ Deployment manifest valid

Generators
  capability-manifest   .cheela/generated/capability-manifest/capabilities.json (created)
  runtime-manifest      .cheela/generated/runtime-manifest/runtime.json (created)
  openapi               .cheela/generated/openapi/openapi.json (created)
  adp                   .cheela/generated/adp/agent-discovery.json (created)

✓ Runtime authenticated
✓ Deployment created

Deployment 1 is active.`}</CodeBlock>
					<P>Confirm the control plane agrees with your local runtime:</P>
					<CodeBlock label="Terminal">{`npx cheela status`}</CodeBlock>
				</Step>

				<Step id="call" n={7} title="Call it">
					<P>
						Send a message the model can only answer by calling your capability.
						Use the <Strong>public</Strong> key here.
					</P>
					<CodeBlock label="Terminal">{`curl https://api.cheelalabs.com/v1/runtime/execute \\
  -H "Authorization: Bearer $CHEELA_PUBLIC_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "parts": [{ "type": "text", "content": "What is the weather in Lisbon?" }] }
    ]
  }'`}</CodeBlock>
					<P>
						Your terminal should log <Code>called for Lisbon</Code>. The
						response carries the full transcript, including the{" "}
						<Code>tool_call</Code> and <Code>tool_result</Code> parts, plus
						token counts and a duration.
					</P>
					<Callout title="A failed execution still returns 200" tone="note">
						<p>
							The HTTP request succeeded; the execution is what failed. Check{" "}
							<Code>status</Code> in the body, not the status line.
						</p>
					</Callout>
				</Step>
			</Steps>

			<H2 id="next">What to read next</H2>
			<UL>
				<LI>
					<A href="/concepts/architecture">Architecture</A> — the full request
					path, and why the signature exists.
				</LI>
				<LI>
					<A href="/concepts/end-user-identity">End-user identity</A> — required
					reading before any capability touches a specific person&rsquo;s data.
				</LI>
				<LI>
					<A href="/guides/embedding-chat">Embed chat</A> — swap that{" "}
					<Code>curl</Code> for a real widget.
				</LI>
			</UL>
		</DocPage>
	);
}
