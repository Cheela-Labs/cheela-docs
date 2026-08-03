import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	H2,
	H3,
	P,
	Strong,
	Table,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Serve capability calls",
	description:
		"Build the endpoint Cheela calls: signature verification, framework adapters, and the two mistakes that break every first attempt.",
	alternates: { canonical: "/guides/serving-capabilities" },
};

const TOC = [
	{ id: "job", title: "What the endpoint does" },
	{ id: "web-standard", title: "Next.js, Hono, Bun, Deno, Workers" },
	{ id: "express", title: "Express" },
	{ id: "manual", title: "Verifying by hand" },
	{ id: "nonce", title: "Replay protection at scale" },
	{ id: "mistakes", title: "Two things that break it" },
	{ id: "responses", title: "What the handler returns" },
	{ id: "local", title: "Developing locally" },
];

export default function ServingCapabilitiesPage() {
	return (
		<DocPage
			path="/guides/serving-capabilities"
			eyebrow="Guides"
			lead="Cheela never runs your capability code. When the agent loop needs a capability, it makes a signed HTTPS call to your endpoint, you execute it, and you return the result."
			title="Serve capability calls"
			toc={TOC}
		>
			<H2 id="job">What the endpoint does</H2>
			<P>
				Two jobs, in this order: prove the request came from Cheela, then run
				the capability. The order is not negotiable — an endpoint that
				dispatches before verifying will execute your capabilities for anyone
				who knows its URL.
			</P>
			<P>
				<Code>createCheelaHandler</Code> does both. It checks, in order, that
				all four <Code>x-cheela-*</Code> headers are present, that the signature
				was issued for this runtime, that the timestamp is inside the tolerance
				window, that the nonce has not been seen before, and that the HMAC
				matches in constant time. Only then does it call your capability.
			</P>

			<H2 id="web-standard">Next.js, Hono, Bun, Deno, Workers</H2>
			<P>
				Anything built on the web-standard <Code>Request</Code>/
				<Code>Response</Code> pair uses the same handler.
			</P>
			<CodeBlock filename="app/cheela/execute/route.ts">{`import { createCheelaHandler } from "@cheela/runtime";
import runtime from "../../../.cheela/runtime";

export const POST = createCheelaHandler({
  runtime,
  secret: process.env.CHEELA_RUNTIME_SECRET!,
  runtimeId: process.env.CHEELA_RUNTIME_ID,
});

export const dynamic = "force-dynamic";`}</CodeBlock>

			<P>
				If your framework evaluates route modules at build time with no secrets
				present, read the secret per request instead of at module scope:
			</P>
			<CodeBlock filename="app/cheela/execute/route.ts">{`function requiredSecret(): string {
  const secret = process.env.CHEELA_RUNTIME_SECRET;
  if (!secret) {
    throw new Error(
      "CHEELA_RUNTIME_SECRET is not set. It is shown once when the runtime is " +
        "created; without it this endpoint cannot tell a real Cheela request " +
        "from anyone else's.",
    );
  }
  return secret;
}

export async function POST(request: Request): Promise<Response> {
  const handler = createCheelaHandler({
    runtime,
    secret: requiredSecret(),
    runtimeId: process.env.CHEELA_RUNTIME_ID,
  });
  return handler(request);
}`}</CodeBlock>
			<P>
				The failure belongs to a request, not to a build. And note that the
				secret is never defaulted to <Code>&quot;&quot;</Code> — a security
				parameter should not have a fallback.
			</P>

			<H2 id="express">Express</H2>
			<P>
				Mount it with a <Strong>raw</Strong> body parser. This is not a style
				preference: <Code>express.json()</Code> discards the exact bytes the
				signature covers.
			</P>
			<CodeBlock filename="server.ts">{`import express from "express";
import { createCheelaExpressHandler } from "@cheela/runtime";
import runtime from "./.cheela/runtime";

const app = express();

app.post(
  "/cheela/execute",
  express.raw({ type: "*/*" }),
  createCheelaExpressHandler({
    runtime,
    secret: process.env.CHEELA_RUNTIME_SECRET!,
  }),
);`}</CodeBlock>
			<P>
				Get this wrong and the handler answers{" "}
				<Code>400 raw_body_required</Code> with an explanation, rather than
				letting every request fail as <Code>signature_mismatch</Code> — which
				reads like a wrong secret and sends you off rotating a credential that
				was fine.
			</P>

			<H2 id="manual">Verifying by hand</H2>
			<P>If you are not on either shape, use the primitive directly.</P>
			<CodeBlock label="TypeScript">{`import { verifyCheelaSignature, MemoryNonceStore } from "@cheela/runtime";

const nonceStore = new MemoryNonceStore();

const result = await verifyCheelaSignature({
  secret: process.env.CHEELA_RUNTIME_SECRET!,
  headers: request.headers,   // a Headers object, or a lower-cased record
  rawBody: await request.text(), // the raw bytes, not parsed JSON
  runtimeId: process.env.CHEELA_RUNTIME_ID,
  nonceStore,
});

if (!result.valid) {
  return new Response(result.reason, { status: 401 });
}`}</CodeBlock>
			<P>
				<Code>result.reason</Code> is one of six values, and each points at a
				different fix:
			</P>
			<Table
				headers={["Reason", "What it means"]}
				rows={[
					[
						"missing_headers",
						"One of the four x-cheela-* headers did not arrive. Check for a proxy stripping them.",
					],
					[
						"runtime_mismatch",
						"Signed for a different runtime than the one you pinned.",
					],
					["timestamp_invalid", "The timestamp header was not a number."],
					[
						"timestamp_outside_tolerance",
						"More than five minutes of clock skew, in either direction.",
					],
					[
						"nonce_replayed",
						"This nonce has been used. Either a genuine replay, or a shared store you do not have.",
					],
					[
						"signature_mismatch",
						"Wrong secret — or, far more often, a body that was re-serialized.",
					],
				]}
			/>

			<H2 id="nonce">Replay protection at scale</H2>
			<P>
				<Code>MemoryNonceStore</Code> is per-process, which is correct for a
				single instance. Behind a load balancer, a captured request can be
				replayed once per instance until each has seen the nonce.
			</P>
			<P>
				The <Code>NonceStore</Code> interface is one method, so back it with
				whatever you already run:
			</P>
			<CodeBlock label="TypeScript">{`import type { NonceStore } from "@cheela/runtime";

const redisNonceStore: NonceStore = {
  async claim(nonce, expiresAt) {
    // SET NX returns null when the key already exists.
    const claimed = await redis.set(\`cheela:nonce:\${nonce}\`, "1", {
      NX: true,
      PXAT: expiresAt,
    });
    return claimed !== null;
  },
};

export const POST = createCheelaHandler({
  runtime,
  secret: process.env.CHEELA_RUNTIME_SECRET!,
  nonceStore: redisNonceStore,
});`}</CodeBlock>
			<P>
				<Code>claim</Code> returns <Code>false</Code> when the nonce has been
				seen before. It may be sync or async.
			</P>

			<H2 id="mistakes">Two things that break it</H2>

			<H3>Read the body as text</H3>
			<P>
				The signature is over the bytes that were sent. <Code>JSON.parse</Code>{" "}
				then <Code>JSON.stringify</Code> will not reproduce them — key order,
				whitespace and unicode escaping all differ — so the signature can never
				match. Any middleware that parses the body before your handler has
				already broken it.
			</P>

			<H3>Share the nonce store</H3>
			<P>
				Covered above, and worth repeating because it fails silently: with a
				per-process store and three instances, a replayed request succeeds twice
				before it starts being rejected.
			</P>

			<H2 id="responses">What the handler returns</H2>
			<Table
				headers={["Status", "Body", "When"]}
				rows={[
					["200", "{ output }", "The capability ran and returned."],
					[
						"200",
						"{ output: null, error }",
						"The capability threw. Reported rather than raised, so one bad call does not abort the agent run.",
					],
					["400", '{ error: "invalid_json" }', "The body was not JSON."],
					[
						"400",
						'{ error: "missing_capability" }',
						"No capability name in the body.",
					],
					[
						"401",
						"{ error: reason }",
						"Verification failed. `reason` is one of the six above.",
					],
				]}
			/>
			<Callout title="A thrown capability is a 200" tone="note">
				<p>
					Cheela turns the <Code>error</Code> field into a{" "}
					<Code>tool_result</Code> the model can read and react to. Returning a
					5xx would end the whole execution instead of letting the model
					recover.
				</p>
			</Callout>

			<H2 id="local">Developing locally</H2>
			<P>
				Cheela calls <em>into</em> your endpoint, so it has to be reachable from
				the internet. Run a tunnel and point the runtime at it:
			</P>
			<CodeBlock label="Terminal">{`ngrok http 3000
# or: cloudflared tunnel --url http://localhost:3000`}</CodeBlock>
			<CodeBlock filename="cheela.config.ts">{`endpoint: "https://your-subdomain.ngrok-free.app/cheela/execute",`}</CodeBlock>
			<P>
				Then <Code>cheela deploy</Code> to publish it. The endpoint URL is part
				of the deployment, so it changes whenever the tunnel does.
			</P>
			<P>
				<Code>http://</Code> is accepted only for <Code>localhost</Code>,{" "}
				<Code>127.0.0.1</Code> and <Code>[::1]</Code> — useful for tests that
				drive the handler in-process, not for a live runtime.
			</P>
			<P>
				A complete project is in{" "}
				<A href="https://github.com/Cheela-Labs/platform/tree/main/examples/signed-endpoint-nextjs">
					examples/signed-endpoint-nextjs
				</A>
				. See also{" "}
				<A href="/reference/runtime">the @cheela/runtime reference</A> for every
				option.
			</P>
		</DocPage>
	);
}
