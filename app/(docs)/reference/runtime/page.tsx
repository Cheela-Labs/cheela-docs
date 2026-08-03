// biome-ignore-all lint/correctness/useJsxKeyInIterable: reference-table cells are static data, rendered as the single child of a keyed <td> — React never iterates them.
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
	Property,
	PropertyList,
	Strong,
	Table,
	UL,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "@cheela/runtime",
	description:
		"The Runtime class, the framework handlers that verify Cheela's signature, and the signature primitive underneath them.",
	alternates: { canonical: "/reference/runtime" },
};

const TOC = [
	{ id: "install", title: "Install" },
	{ id: "runtime", title: "Runtime" },
	{ id: "register", title: "register()" },
	{ id: "execute", title: "execute()" },
	{ id: "handlers", title: "Request handlers" },
	{ id: "verify", title: "verifyCheelaSignature" },
	{ id: "nonce", title: "NonceStore" },
	{ id: "types", title: "Types" },
];

export default function RuntimeReferencePage() {
	return (
		<DocPage
			eyebrow="Reference"
			lead="Everything that runs on your infrastructure: the registry of capabilities, the handlers that verify an incoming Cheela request, and the HMAC primitive underneath them."
			title="@cheela/runtime"
			toc={TOC}
		>
			<H2 id="install">Install</H2>
			<CodeBlock label="Terminal">{`npm install @cheela/runtime @cheela/sdk`}</CodeBlock>

			<H2 id="runtime">Runtime</H2>
			<CodeBlock label="TypeScript">{`import { Runtime } from "@cheela/runtime";

const runtime = new Runtime();
const guarded = new Runtime({ permissions: ["orders:read", "orders:write"] });`}</CodeBlock>
			<PropertyList>
				<Property name="options.permissions" type="readonly string[]">
					<p>
						Permissions this runtime holds. An action requiring one that is
						absent throws before its handler runs.
					</p>
				</Property>
			</PropertyList>

			<Table
				headers={["Method", "Returns"]}
				rows={[
					["register(capability, action)", "void"],
					["execute(name, input, options?)", "Promise<RuntimeExecutionResult>"],
					["getCapabilities()", "readonly Capability[]"],
					["getRegistrations()", "readonly RuntimeRegistration[]"],
				]}
			/>
			<P>
				<Code>getRegistrations()</Code> exists for tooling — the CLI uses it to
				compile a manifest. Both getters return snapshots; the registry itself
				stays private.
			</P>

			<H2 id="register">register()</H2>
			<CodeBlock label="TypeScript">{`runtime.register(
  {
    name: "order-status",
    description: "Looks up the status of one order by its id",
    version: "1.0.0",
    input: z.object({ orderId: z.string() }),
  },
  {
    name: "lookup",
    async handler(context, input) {
      return db.orders.findById(input.orderId);
    },
  },
);`}</CodeBlock>
			<P>Throws immediately when:</P>
			<UL>
				<LI>
					<Strong>The name is invalid.</Strong> The error names the offending
					character and suggests a replacement.
				</LI>
				<LI>
					<Strong>The name is already registered.</Strong> Names are unique per
					runtime.
				</LI>
			</UL>
			<Callout title="Names are rejected here, not sanitised later" tone="note">
				<p>
					A name the model cannot be given is a capability that can never be
					invoked. Left to surface later it becomes an opaque provider 400 on
					the first real execution — long after the name has been published in a
					manifest strangers may already have cached.
				</p>
			</Callout>

			<H2 id="execute">execute()</H2>
			<P>
				Runs a capability in-process. The handlers below call this for you; call
				it directly in tests, or to reuse a capability from your own code.
			</P>
			<CodeBlock label="TypeScript">{`const result = await runtime.execute("order-status", { orderId: "8812" }, {
  endUserToken: "session_abc",
  executionId: "exec_...",
});

// { executionId, output, startedAt, completedAt }`}</CodeBlock>
			<PropertyList>
				<Property name="options.endUserToken" type="string">
					<p>
						The caller&rsquo;s credential, forwarded to{" "}
						<Code>context.endUserToken</Code>. Required for capabilities marked{" "}
						<Code>requiresEndUser</Code>.
					</p>
				</Property>
				<Property name="options.executionId" type="string">
					<p>
						Cheela&rsquo;s id for this execution, so a handler that logs it can
						be joined to the trace. Absent for a direct in-process call, where a
						fresh UUID is minted.
					</p>
				</Property>
			</PropertyList>
			<P>
				In order, <Code>execute()</Code>:
			</P>
			<CodeBlock label="Order">{`1. look up the registration          → throws if unknown
2. enforce requiresEndUser           → throws if no credential
3. check the action's permissions    → throws if missing
4. validate input against the schema → throws ValidationError
5. run the handler
6. validate output against the schema`}</CodeBlock>

			<H2 id="handlers">Request handlers</H2>

			<H3>createCheelaHandler</H3>
			<P>
				For anything built on <Code>Request</Code>/<Code>Response</Code>:
				Next.js route handlers, Hono, Deno, Bun, Cloudflare Workers.
			</P>
			<CodeBlock filename="app/cheela/execute/route.ts">{`import { createCheelaHandler } from "@cheela/runtime";
import runtime from "../../../.cheela/runtime";

export const POST = createCheelaHandler({
  runtime,
  secret: process.env.CHEELA_RUNTIME_SECRET!,
  runtimeId: process.env.CHEELA_RUNTIME_ID,
});`}</CodeBlock>

			<H3>createCheelaExpressHandler</H3>
			<CodeBlock label="TypeScript">{`app.post(
  "/cheela/execute",
  express.raw({ type: "*/*" }),
  createCheelaExpressHandler({ runtime, secret }),
);`}</CodeBlock>
			<P>
				Mount it with a raw body parser. Given a parsed object it answers{" "}
				<Code>400 raw_body_required</Code> with an explanation rather than
				failing every request as <Code>signature_mismatch</Code> — which reads
				as a wrong secret and sends people off rotating a credential that was
				fine.
			</P>

			<H3>HandlerOptions</H3>
			<PropertyList>
				<Property name="runtime" required type="Runtime">
					<p>The runtime to dispatch into.</p>
				</Property>
				<Property name="secret" required type="string">
					<p>
						The runtime secret, shown once at registration. Never default this
						to an empty string.
					</p>
				</Property>
				<Property name="runtimeId" type="string">
					<p>
						When given, a signature issued for another runtime is rejected.
						Cheap, and worth setting.
					</p>
				</Property>
				<Property name="toleranceMs" type="number" defaultValue="300000">
					<p>
						Clock-skew allowance, matching the server&rsquo;s default of five
						minutes.
					</p>
				</Property>
				<Property name="nonceStore" type="NonceStore">
					<p>
						Defaults to a shared in-process store. Supply your own when running
						more than one instance.
					</p>
				</Property>
			</PropertyList>

			<H3>Responses</H3>
			<Table
				headers={["Status", "Body"]}
				rows={[
					["200", <Code>{`{ output }`}</Code>],
					["200", <Code>{`{ output: null, error }`}</Code>],
					["400", <Code>{`{ error: "invalid_json" }`}</Code>],
					["400", <Code>{`{ error: "missing_capability" }`}</Code>],
					["401", <Code>{`{ error: reason }`}</Code>],
				]}
			/>
			<P>
				A capability that throws is reported, not raised — Cheela turns it into
				a <Code>tool_result</Code> error so one bad call does not abort the
				agent run.
			</P>

			<H2 id="verify">verifyCheelaSignature</H2>
			<P>The primitive, for frameworks neither handler covers.</P>
			<CodeBlock label="TypeScript">{`import { verifyCheelaSignature, MemoryNonceStore } from "@cheela/runtime";

const result = await verifyCheelaSignature({
  secret: process.env.CHEELA_RUNTIME_SECRET!,
  headers: request.headers,
  rawBody: await request.text(),
  runtimeId: process.env.CHEELA_RUNTIME_ID,
  nonceStore: new MemoryNonceStore(),
});

if (!result.valid) {
  return new Response(result.reason, { status: 401 });
}`}</CodeBlock>
			<P>
				<Code>headers</Code> accepts a <Code>Headers</Code> object or a
				lower-cased record. <Code>rawBody</Code> must be the exact bytes
				received.
			</P>
			<P>Checks run in this order, and the order is deliberate:</P>
			<CodeBlock label="Order">{`1. all four x-cheela-* headers present   → missing_headers
2. runtime matches (if pinned)          → runtime_mismatch
3. timestamp is a number                → timestamp_invalid
4. |now - sentAt| <= tolerance          → timestamp_outside_tolerance
5. HMAC matches, constant-time          → signature_mismatch
6. nonce unused                         → nonce_replayed`}</CodeBlock>
			<UL>
				<LI>
					The cheap structural checks come first, so malformed traffic is
					rejected before any HMAC work happens.
				</LI>
				<LI>
					The timestamp comparison is absolute, so a request from a clock
					running fast is rejected too — a future-dated timestamp would
					otherwise extend its own replay window.
				</LI>
				<LI>
					The nonce is claimed <em>after</em> the signature verifies, so an
					attacker cannot burn nonces with forged requests.
				</LI>
			</UL>
			<P>
				<Code>DEFAULT_TOLERANCE_MS</Code> is exported, and is five minutes.
			</P>

			<H2 id="nonce">NonceStore</H2>
			<CodeBlock label="TypeScript">{`interface NonceStore {
  claim(nonce: string, expiresAt: number): boolean | Promise<boolean>;
}`}</CodeBlock>
			<P>
				<Code>claim</Code> returns <Code>false</Code> when the nonce has been
				seen. <Code>MemoryNonceStore</Code> implements it in-process and drops
				entries past the tolerance window.
			</P>
			<Callout title="One process, one view" tone="warning">
				<p>
					Behind a load balancer, a captured request can be replayed once per
					instance until each has seen the nonce. Back the interface with Redis
					or your database if you run more than one.
				</p>
			</Callout>
			<CodeBlock label="TypeScript">{`const redisNonceStore: NonceStore = {
  async claim(nonce, expiresAt) {
    const claimed = await redis.set(\`cheela:nonce:\${nonce}\`, "1", {
      NX: true,
      PXAT: expiresAt,
    });
    return claimed !== null;
  },
};`}</CodeBlock>

			<H2 id="types">Types</H2>
			<CodeBlock label="TypeScript">{`interface RuntimeRegistration<TInput, TOutput> {
  capability: Capability<TInput, TOutput>;
  action: Action<TInput, TOutput>;
}

interface RuntimeExecutionResult<TOutput> {
  executionId: string;
  output: TOutput;
  startedAt: number;
  completedAt: number;
}

interface CapabilityRequestBody {
  executionId?: string;
  capability?: string;
  input?: unknown;
  metadata?: Record<string, string>;
  endUserToken?: string;   // never logged
}

type VerifyFailureReason =
  | "missing_headers"
  | "runtime_mismatch"
  | "timestamp_invalid"
  | "timestamp_outside_tolerance"
  | "nonce_replayed"
  | "signature_mismatch";`}</CodeBlock>
			<P>
				Practical guidance in{" "}
				<A href="/guides/serving-capabilities">Serve capability calls</A>.
			</P>
		</DocPage>
	);
}
