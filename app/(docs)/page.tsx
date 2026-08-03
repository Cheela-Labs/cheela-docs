import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Card,
	CardGrid,
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
	title: "Introduction",
	description:
		"Cheela runs the agent loop and calls your capabilities over a signed HTTPS request. Your code stays on your infrastructure.",
	alternates: { canonical: "/" },
};

const TOC = [
	{ id: "what-it-does", title: "What Cheela does" },
	{ id: "where-code-runs", title: "Where your code runs" },
	{ id: "two-ways-in", title: "Two ways in" },
	{ id: "packages", title: "The packages" },
	{ id: "next", title: "Where to start" },
];

export default function IntroductionPage() {
	return (
		<DocPage
			path="/"
			eyebrow="Start"
			lead="You describe what your product can do. Cheela runs the model, decides when to call you, and makes a signed HTTPS request to your endpoint. Your handler runs on your own infrastructure, with your own credentials."
			title="Introduction"
			toc={TOC}
		>
			<H2 id="what-it-does">What Cheela does</H2>
			<P>
				A capability is one thing your product can do — look up an order, check
				stock, book a slot — described with a name, a schema, and a handler. You
				register capabilities with a <Code>Runtime</Code> and deploy the
				description to Cheela.
			</P>
			<P>
				From then on, Cheela owns the loop. It sends your capabilities to a
				model as tools, reads what the model wants to call, calls it, feeds the
				result back, and repeats until the model has an answer. You get the
				transcript, the token counts, and a trace for every step.
			</P>

			<CodeBlock filename=".cheela/runtime.ts">{`import { Runtime } from "@cheela/runtime";
import { z } from "zod";

const runtime = new Runtime();

runtime.register(
  {
    name: "order-status",
    description: "Looks up the status of one order by its id",
    version: "1.0.0",
    input: z.object({ orderId: z.string() }),
  },
  {
    name: "lookup",
    async handler(context, input) {
      // Runs on your server, against your database.
      return await db.orders.findById(input.orderId);
    },
  },
);

export default runtime;`}</CodeBlock>

			<H2 id="where-code-runs">Where your code runs</H2>
			<P>
				On your servers. Cheela never receives your handler, your database
				credentials, or your source. What you deploy is the{" "}
				<Strong>description</Strong> of a capability: its name, version,
				description, and JSON Schema.
			</P>
			<P>
				When the model calls a capability, Cheela makes an HTTPS request to the
				endpoint you registered. That request is signed:
			</P>
			<CodeBlock label="Signature">{`HMAC-SHA256(runtimeSecret, "runtimeId.timestamp.nonce.sha256(body)")`}</CodeBlock>
			<P>
				Your endpoint verifies it before running anything.{" "}
				<Code>createCheelaHandler</Code> from <Code>@cheela/runtime</Code> does
				the verification and the dispatch, so this is a two-line endpoint rather
				than a security exercise.
			</P>

			<Callout title="One model, chosen for you" tone="note">
				<p>
					You do not pick a provider or a model, and{" "}
					<Code>cheela.config.ts</Code> has no field for either. Executions run
					on Cheela&rsquo;s own OpenRouter credential so tokens can be metered
					and billed. A runtime choosing its own model would be choosing how
					much Cheela pays.
				</p>
			</Callout>

			<H2 id="two-ways-in">Two ways in</H2>
			<P>
				A deployed capability can be reached down two different paths, and they
				have different security properties.
			</P>

			<Table
				headers={["Path", "Who calls it", "Auth"]}
				rows={[
					[
						"POST /v1/runtime/execute",
						<>
							Your own app or chat widget. Sends messages; Cheela runs the full
							agent loop and decides which capabilities to call.
						</>,
						<>
							The runtime&rsquo;s public key (<Code>ch_pk_…</Code>)
						</>,
					],
					[
						"POST /v1/capabilities/:runtimeId/:capability",
						<>
							Somebody else&rsquo;s agent, which found the address in your
							published manifest. No model, no loop — it already knows what it
							wants.
						</>,
						<>None. The manifest is public, so the addresses in it must be.</>,
					],
				]}
			/>

			<P>
				The second path is what &ldquo;AI-native&rdquo; means in practice: a
				stranger&rsquo;s agent can use your product without scraping your UI. It
				is opt-in — nothing is published until you run{" "}
				<Code>cheela manifest pull</Code> and serve the result.
			</P>

			<H2 id="packages">The packages</H2>
			<P>
				Everything is Apache-2.0 and published under the <Code>@cheela</Code>{" "}
				scope. Most projects need two or three.
			</P>

			<Table
				headers={["Package", "What it is for"]}
				rows={[
					["@cheela/sdk", "Types and helpers for describing a capability."],
					[
						"@cheela/runtime",
						"The Runtime class, plus the request handlers that verify Cheela's signature.",
					],
					[
						"@cheela/cli",
						"`cheela init`, `dev`, `deploy`, `status`, `manifest`.",
					],
					[
						"@cheela/ui",
						"React chat components — <CheelaProvider/> and <Chat/>.",
					],
					[
						"@cheela/web-component",
						"The same chat as <cheela-chat>, for pages with no build step.",
					],
					[
						"@cheela/client",
						"Framework-agnostic core: HTTP client, conversation state, events.",
					],
					[
						"@cheela/protocol",
						"Wire-format types shared by the API and every client.",
					],
					[
						"@cheela/provider",
						"Adapters for OpenAI, Anthropic, Gemini, OpenRouter.",
					],
					[
						"@cheela/adp",
						"Agent Discovery Specification manifest types and validation.",
					],
				]}
			/>

			<H2 id="next">Where to start</H2>
			<P>Pick the half you need. They are independent.</P>

			<CardGrid>
				<Card href="/quickstart" title="Quickstart">
					Register one capability and watch a model call it. About ten minutes.
				</Card>
				<Card href="/concepts/architecture" title="Architecture">
					The request path in full, including who holds which credential.
				</Card>
				<Card href="/guides/embedding-chat" title="Embed chat">
					Put a chat widget on a page in React, plain HTML, or one script tag.
				</Card>
				<Card href="/reference/http-api" title="HTTP API">
					Every endpoint, its auth plane, and its response shape.
				</Card>
			</CardGrid>

			<P>
				Prefer reading code?{" "}
				<A href="https://github.com/Cheela-Labs/platform/tree/main/examples">
					The examples directory
				</A>{" "}
				has three working projects: a signed Next.js endpoint, a React chat
				page, and a static HTML embed.
			</P>

			<UL>
				<LI>
					<Strong>Node 22 or newer</Strong> is required by every package.
				</LI>
				<LI>
					You will need an account to create a runtime and get an API key —{" "}
					<A href="https://dashboard.cheelalabs.com">the dashboard</A> is where
					runtimes live.
				</LI>
			</UL>
		</DocPage>
	);
}
