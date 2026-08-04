// biome-ignore-all lint/correctness/useJsxKeyInIterable: reference-table cells are static data, rendered as the single child of a keyed <td> — React never iterates them.
import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	Endpoint,
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
	title: "HTTP API",
	description:
		"Every Cheela endpoint, grouped by which credential opens it: public, runtime deploy key, runtime public key, and owner.",
	alternates: { canonical: "/reference/http-api" },
};

const TOC = [
	{ id: "base", title: "Base URL and auth" },
	{ id: "public", title: "Public endpoints" },
	{ id: "execute", title: "Executing" },
	{ id: "deploy", title: "Deploying" },
	{ id: "runtimes", title: "Runtimes" },
	{ id: "executions", title: "Executions and traces" },
	{ id: "projects", title: "Projects" },
	{ id: "analytics", title: "Analytics and billing" },
	{ id: "errors", title: "Error shape" },
	{ id: "pagination", title: "Pagination" },
];

export default function HttpApiPage() {
	return (
		<DocPage
			path="/reference/http-api"
			eyebrow="Reference"
			lead="Four auth planes, and which one an endpoint belongs to is the most important thing about it. A credential valid on one plane is refused on the others."
			title="HTTP API"
			toc={TOC}
		>
			<H2 id="base">Base URL and auth</H2>
			<CodeBlock label="Base URL">{`https://api.cheelalabs.com`}</CodeBlock>
			<P>
				Every authenticated request carries a bearer token. Which token depends
				on the plane:
			</P>
			<Table
				headers={["Plane", "Credential", "Opens"]}
				rows={[
					["Public", "none", "Health, the manifest, the capability broker"],
					[
						"Runtime — deploy",
						<Code>ch_sk_…</Code>,
						"Deployments, runtime status, heartbeat",
					],
					[
						"Runtime — public",
						<Code>ch_pk_…</Code>,
						<>
							<Code>/v1/runtime/execute</Code> only
						</>,
					],
					[
						"Owner",
						"Dashboard session or account API key",
						"Runtimes, executions, traces, projects, analytics, billing",
					],
				]}
			/>
			<CodeBlock label="Header">{`Authorization: Bearer ch_sk_...`}</CodeBlock>
			<Callout title="The planes are enforced, not conventional" tone="note">
				<p>
					A deploy key sent to <Code>/v1/runtime/execute</Code> is refused, and
					so is a public key sent to <Code>/v1/deployments</Code>. The rejection
					is deliberately vague — the caller learns the key is not valid here,
					not which of the two they happen to be holding.
				</p>
			</Callout>

			<H2 id="public">Public endpoints</H2>

			<Endpoint auth="public" id="get-index" method="GET" path="/" />
			<P>Service identity. Useful as a liveness probe.</P>
			<CodeBlock label="200">{`{ "service": "...", "version": "..." }`}</CodeBlock>

			<Endpoint auth="public" id="get-health" method="GET" path="/health" />
			<CodeBlock label="200">{`{
  "status": "ok",
  "version": "...",
  "uptime": 51234.7,
  "timestamp": "2026-01-01T00:00:00.000Z"
}`}</CodeBlock>

			<Endpoint
				auth="public"
				id="get-manifest"
				method="GET"
				path="/v1/runtime/:runtimeId/manifest"
			/>
			<P>
				The runtime&rsquo;s Agent Discovery Specification manifest, built from
				its latest deployment. Unauthenticated on purpose — this document is
				meant to be fetched by strangers and republished on your own domain.
			</P>
			<P>
				Cached briefly (<Code>s-maxage=300</Code>) so a redeploy is visible
				without waiting out a long TTL. Returns 404 if the runtime has no
				deployment, and 400 if the deployment carries no <Code>website</Code> or{" "}
				<Code>adp.namespace</Code>.
			</P>

			<Endpoint
				auth="public"
				id="post-capability"
				method="POST"
				path="/v1/capabilities/:runtimeId/:capability"
			/>
			<P>
				The capability broker — the address published in every manifest. No
				model and no agent loop: the caller has already decided what it wants.
			</P>
			<CodeBlock label="Request">{`{
  "input": { "query": "wool socks" },
  "metadata": { "source": "partner-agent" },
  "endUserToken": "session_abc"
}`}</CodeBlock>
			<CodeBlock label="200">{`{ "executionId": "exec_...", "output": { "products": [] }, "durationMs": 142.7 }`}</CodeBlock>
			<CodeBlock label="502">{`{ "executionId": "exec_...", "error": { "message": "..." }, "durationMs": 88.1 }`}</CodeBlock>
			<UL>
				<LI>
					<Strong>404</Strong> for an unknown runtime, an unknown capability, or
					a runtime with no endpoint — one shape for all three, so an anonymous
					caller cannot probe which runtimes exist.
				</LI>
				<LI>
					<Strong>401</Strong> when the capability is marked{" "}
					<Code>requiresEndUser</Code> and no <Code>endUserToken</Code> was
					sent. Refused before anything is metered.
				</LI>
			</UL>

			<H2 id="execute">Executing</H2>

			<Endpoint
				auth="ch_pk_"
				id="post-runtime-execute"
				method="POST"
				path="/v1/runtime/execute"
			/>
			<P>
				Runs the full agent loop. The runtime is taken from the authenticated
				key, never from the body, so a caller can only execute the runtime whose
				key they hold.
			</P>
			<CodeBlock label="Request">{`{
  "messages": [
    { "role": "user", "parts": [{ "type": "text", "content": "Where is order 8812?" }] }
  ],
  "metadata": { "surface": "web" },
  "endUserToken": "session_abc"
}`}</CodeBlock>
			<CodeBlock label="200">{`{
  "executionId": "exec_...",
  "status": "completed",
  "messages": [ ... ],
  "finishReason": "stop",
  "inputTokens": 812,
  "outputTokens": 96,
  "totalTokens": 908,
  "durationMs": 3140
}`}</CodeBlock>
			<P>
				Send <Code>Accept: text/event-stream</Code> for server-sent events. The
				stream always ends with a <Code>done</Code> event carrying the same
				result shape.
			</P>
			<Callout title="A failed execution is still 200" tone="warning">
				<p>
					Check <Code>status</Code> in the body. The request succeeded; the
					execution did not.
				</p>
			</Callout>

			<Endpoint
				auth="owner"
				id="post-executions"
				method="POST"
				path="/v1/executions"
			/>
			<P>
				The owner-level equivalent. Takes <Code>runtimeId</Code> in the body,
				and checks it belongs to you.
			</P>
			<CodeBlock label="Request">{`{ "runtimeId": "rt_...", "messages": [ ... ], "metadata": {} }`}</CodeBlock>

			<H2 id="deploy">Deploying</H2>

			<Endpoint
				auth="ch_sk_"
				id="post-deployments"
				method="POST"
				path="/v1/deployments"
			/>
			<P>
				What <Code>cheela deploy</Code> calls. Creates a new deployment version
				from a manifest.
			</P>
			<CodeBlock label="Request">{`{
  "manifest": {
    "schemaVersion": 2,
    "capabilities": [
      {
        "name": "catalog-search",
        "version": "1.2.0",
        "description": "...",
        "requiresEndUser": false,
        "actions": [{ "name": "search", "inputSchema": {}, "outputSchema": {} }]
      }
    ],
    "runtime": { "sdkVersion": "..." },
    "endpoint": "https://app.example.com/cheela/execute",
    "website": { "name": "Acme", "url": "https://www.acme.com" },
    "adp": { "namespace": "com.acme" },
    "metadata": { "cliVersion": "..." }
  }
}`}</CodeBlock>
			<CodeBlock label="201">{`{
  "version": 3,
  "status": "active",
  "capabilities": [{ "name": "catalog-search", "hasInputSchema": true }]
}`}</CodeBlock>
			<P>
				Capability names are validated here as well as in the CLI and the
				runtime. <Code>actions</Code> accepts at most one entry — a capability
				is 1:1 with an action, and accepting a list that would be ignored is how
				a second action&rsquo;s schemas get silently dropped.
			</P>

			<Endpoint
				auth="ch_sk_"
				id="get-runtime-status"
				method="GET"
				path="/v1/runtime/status"
			/>
			<CodeBlock label="200">{`{
  "runtimeId": "rt_...",
  "deployment": { "version": 3, "status": "active", "deployedAt": "..." },
  "capabilities": ["catalog-search", "order-status"],
  "connection": { "status": "online", "transport": "http" },
  "health": "healthy",
  "provider": { "name": "openrouter", "model": "..." }
}`}</CodeBlock>
			<P>Calling this also counts as a check-in.</P>

			<Endpoint
				auth="ch_sk_"
				id="post-heartbeat"
				method="POST"
				path="/v1/runtime/heartbeat"
			/>
			<P>Explicit check-in with no body. One indexed write.</P>
			<CodeBlock label="200">{`{ "status": "ok", "lastSeenAt": "..." }`}</CodeBlock>

			<H2 id="runtimes">Runtimes</H2>

			<Endpoint
				auth="owner"
				id="post-runtimes"
				method="POST"
				path="/v1/runtimes"
			/>
			<P>
				Creates a runtime identity. Idempotent on <Code>runtimeId</Code>.
			</P>
			<CodeBlock label="Request">{`{ "name": "storefront", "version": "1.0.0", "projectId": "proj_..." }`}</CodeBlock>
			<CodeBlock label="201">{`{
  "runtimeId": "rt_...",
  "projectId": "proj_...",
  "tier": "free",
  "secret": "...",
  "deployKey": "ch_sk_...",
  "publicKey": "ch_pk_...",
  "deployKeyPrefix": "ch_sk_yxyD...GHI",
  "publicKeyPrefix": "ch_pk_a1b2...XYZ"
}`}</CodeBlock>
			<P>
				<Code>deployKey</Code> and <Code>publicKey</Code> appear only when
				actually minted. Re-registering an existing id keeps its keys and
				returns neither — use reveal or rotate.
			</P>
			<P>
				Rejects <Code>provider</Code> and <Code>tier</Code> rather than
				accepting and dropping them. 403 if creating this runtime would exceed
				your plan&rsquo;s ceiling.
			</P>

			<Endpoint
				auth="owner"
				id="get-runtimes"
				method="GET"
				path="/v1/runtimes"
			/>
			<P>
				Cursor-paginated. Query: <Code>limit</Code>, <Code>cursor</Code>,{" "}
				<Code>projectId</Code>.
			</P>

			<Endpoint
				auth="owner"
				id="get-runtime"
				method="GET"
				path="/v1/runtimes/:runtimeId"
			/>
			<P>
				Full detail including capabilities, allowed origins, connection, health,
				and key <em>prefixes</em> — never whole keys.
			</P>

			<Endpoint
				auth="owner"
				id="put-endpoint"
				method="PUT"
				path="/v1/runtimes/:runtimeId/endpoint"
			/>
			<CodeBlock label="Request">{`{ "endpoint": "https://app.example.com/cheela/execute" }`}</CodeBlock>

			<Endpoint
				auth="owner"
				id="put-origins"
				method="PUT"
				path="/v1/runtimes/:runtimeId/allowed-origins"
			/>
			<CodeBlock label="Request">{`{ "origins": ["https://www.example.com"] }`}</CodeBlock>
			<P>
				Bare origins, up to 50. A path or trailing slash is rejected with a
				message naming the origin to use instead. An empty list means
				unrestricted.
			</P>

			<H3>Key management</H3>
			<Table
				headers={["Endpoint", "Body", "Effect"]}
				rows={[
					[
						"POST /v1/runtimes/:runtimeId/reveal-key",
						<Code>{`{ "type": "deploy" | "public" }`}</Code>,
						"Returns the key in full. POST, not GET, so it stays out of history and logs.",
					],
					[
						"POST /v1/runtimes/:runtimeId/rotate-key",
						<Code>{`{ "type": "deploy" | "public" }`}</Code>,
						"Mints a replacement. The old key works through a grace period.",
					],
					[
						"POST /v1/runtimes/:runtimeId/revoke-key",
						<Code>{`{ "type": "deploy" | "public" }`}</Code>,
						"Invalidates immediately, with no replacement.",
					],
					[
						"POST /v1/runtimes/:runtimeId/rotate-secret",
						"—",
						"Mints a new signing secret for your endpoint.",
					],
				]}
			/>

			<H2 id="executions">Executions and traces</H2>

			<Endpoint
				auth="owner"
				id="get-executions"
				method="GET"
				path="/v1/executions"
			/>
			<P>
				Query: <Code>limit</Code> (max 200), <Code>cursor</Code>,{" "}
				<Code>status</Code> (<Code>running</Code>, <Code>completed</Code>,{" "}
				<Code>failed</Code>), <Code>from</Code>, <Code>to</Code>.
			</P>
			<CodeBlock label="200">{`{
  "nextCursor": "...",
  "executions": [
    {
      "executionId": "exec_...",
      "runtimeId": "rt_...",
      "status": "completed",
      "finishReason": "stop",
      "durationMs": 3140,
      "capabilityCalls": 2,
      "startedAt": "...",
      "completedAt": "..."
    }
  ]
}`}</CodeBlock>

			<Endpoint
				auth="owner"
				id="get-execution"
				method="GET"
				path="/v1/executions/:executionId"
			/>
			<P>The trace: turn shapes, token counts, and each capability call.</P>
			<Callout title="Message content is not stored" tone="note">
				<p>
					Cheela does not persist what anybody wrote. In place of the
					conversation, a trace holds <Code>messageShape</Code> &mdash; one
					entry per turn with its <Code>role</Code> and the <Code>type</Code> of
					each part, and nothing else. It is enough to see that a run went user
					&rarr; assistant &rarr; tool, and not enough to read it back.
				</p>
				<p>
					Capability <Code>input</Code> and <Code>output</Code> payloads{" "}
					<em>are</em> stored, and tool arguments often carry the user&rsquo;s
					text. Keep that in mind when deciding what a capability accepts.
				</p>
			</Callout>
			<Callout title="404, not 403, on someone else's execution" tone="note">
				<p>
					A 403 would confirm the id exists and turn this route into an
					enumeration oracle.
				</p>
			</Callout>

			<Endpoint
				auth="owner"
				id="get-traces"
				method="GET"
				path="/v1/traces/runtime/:runtimeId"
			/>
			<P>Traces for one runtime. Same pagination and filters as above.</P>

			<Endpoint
				auth="owner"
				id="get-trace"
				method="GET"
				path="/v1/traces/:executionId"
			/>

			<H2 id="projects">Projects</H2>
			<Table
				headers={["Endpoint", "Purpose"]}
				rows={[
					["GET /v1/projects", "List your projects."],
					["POST /v1/projects", "Create one."],
					["GET /v1/projects/:projectId", "Fetch one."],
					["PATCH /v1/projects/:projectId", "Rename or update."],
				]}
			/>
			<P>
				A default project is created on first use, so every other endpoint works
				without mentioning projects at all.
			</P>

			<H2 id="analytics">Analytics and billing</H2>

			<Endpoint
				auth="owner"
				id="get-summary"
				method="GET"
				path="/v1/analytics/summary"
			/>
			<P>
				Query: <Code>from</Code>, <Code>to</Code>, <Code>bucket</Code> (
				<Code>hour</Code> or <Code>day</Code>).
			</P>
			<P>
				The window is clamped server-side against your tier, and the resolved
				window comes back on <Code>range</Code> — so a narrowed request is
				visible rather than silently changing what the numbers mean.
			</P>

			<Table
				headers={["Endpoint", "Purpose"]}
				rows={[
					["GET /v1/billing/plans", "Available plans and their limits."],
					[
						"GET /v1/billing/usage",
						"Current-period usage, with periodStart and periodEnd.",
					],
					["POST /v1/billing/checkout", "Start an upgrade."],
					["POST /v1/billing/verify", "Confirm a completed payment."],
				]}
			/>

			<H2 id="errors">Error shape</H2>
			<P>Every error has the same envelope.</P>
			<CodeBlock label="Error">{`{
  "error": {
    "code": "validation_error",
    "message": "Invalid execution request",
    "details": { "fieldErrors": { "messages": ["Required"] } }
  }
}`}</CodeBlock>
			<Table
				headers={["Code", "Status"]}
				rows={[
					["validation_error", "400"],
					["unauthorized", "401"],
					["forbidden", "403"],
					["not_found", "404"],
					["rate_limit_exceeded", "429"],
					["execution_error", "502"],
					["internal_error", "500"],
				]}
			/>
			<P>
				<Code>details</Code> is present on validation failures and absent
				otherwise. Internal errors never carry it — an unhandled failure returns
				a generic message rather than echoing anything about your
				infrastructure.
			</P>
			<P>
				Full list with causes in{" "}
				<A href="/reference/errors-and-limits">Errors and limits</A>.
			</P>

			<H2 id="pagination">Pagination</H2>
			<P>
				Listing endpoints are cursor-based. Pass <Code>nextCursor</Code> back as{" "}
				<Code>?cursor=</Code>; it is <Code>null</Code> on the last page.
			</P>
			<CodeBlock label="Terminal">{`curl "https://api.cheelalabs.com/v1/executions?limit=50" \\
  -H "Authorization: Bearer $API_KEY"

curl "https://api.cheelalabs.com/v1/executions?limit=50&cursor=$NEXT" \\
  -H "Authorization: Bearer $API_KEY"`}</CodeBlock>
			<P>
				<Code>limit</Code> caps at 200 for executions and traces. Offsets are
				not supported — they skip and duplicate rows when new executions arrive
				mid-page, which for an append-heavy collection is constant.
			</P>
		</DocPage>
	);
}
