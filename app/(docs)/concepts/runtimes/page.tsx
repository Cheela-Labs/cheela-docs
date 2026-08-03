// biome-ignore-all lint/correctness/useJsxKeyInIterable: reference-table cells are static data, rendered as the single child of a keyed <td> — React never iterates them.
import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import { A, Callout, Code, H2, H3, P, Table } from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Runtimes",
	description:
		"A runtime is the identity that owns a capability set, two API keys, a signing secret, and the endpoint Cheela calls.",
	alternates: { canonical: "/concepts/runtimes" },
};

const TOC = [
	{ id: "what", title: "What a runtime is" },
	{ id: "keys", title: "Keys and secrets" },
	{ id: "endpoint", title: "The endpoint" },
	{ id: "deployments", title: "Deployments" },
	{ id: "health", title: "Health and connection" },
	{ id: "origins", title: "Origin allowlists" },
	{ id: "projects", title: "Projects" },
];

export default function RuntimesPage() {
	return (
		<DocPage
			path="/concepts/runtimes"
			eyebrow="Concepts"
			lead="A runtime is the identity a capability set belongs to. It holds two API keys, a signing secret, an endpoint, and a history of deployments."
			title="Runtimes"
			toc={TOC}
		>
			<H2 id="what">What a runtime is</H2>
			<P>
				Not a process, and not a server. A runtime is a record in Cheela&rsquo;s
				control plane — an id like <Code>rt_8f2a…</Code> with credentials
				attached. Your capability code runs wherever you deploy it; the runtime
				is how Cheela knows which code that is and how to reach it.
			</P>
			<P>Create one in the dashboard, or over the API:</P>
			<CodeBlock label="Terminal">{`curl https://api.cheelalabs.com/v1/runtimes \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "storefront", "version": "1.0.0" }'`}</CodeBlock>
			<P>
				Registration is idempotent by design — <Code>cheela deploy</Code> calls
				it on every deploy, so re-registering an existing id updates it rather
				than failing.
			</P>

			<Callout title="Your plan caps how many you can create" tone="note">
				<p>
					Free includes one runtime, Pro ten, Enterprise unlimited. Only a{" "}
					<em>new</em> runtime counts against the limit; re-registration never
					does, so sitting exactly at your ceiling does not break deployment.
				</p>
			</Callout>

			<H2 id="keys">Keys and secrets</H2>
			<P>
				Creating a runtime mints three things. Two are API keys with different
				powers, and one is a signing secret.
			</P>

			<Table
				headers={["Credential", "Prefix", "Where it goes", "What it can do"]}
				rows={[
					[
						"Deploy key",
						<Code>ch_sk_</Code>,
						<>
							<Code>CHEELA_API_KEY</Code>, in CI or your shell
						</>,
						<>Push deployments, read status, send heartbeats</>,
					],
					[
						"Public key",
						<Code>ch_pk_</Code>,
						<>Page source, client bundles, HTML attributes</>,
						<>
							Call <Code>/v1/runtime/execute</Code>. Nothing else.
						</>,
					],
					[
						"Runtime secret",
						"—",
						<>
							<Code>CHEELA_RUNTIME_SECRET</Code>, on your server
						</>,
						<>Verify that an incoming request came from Cheela</>,
					],
				]}
			/>

			<P>
				The two keys are separate precisely so the public one can be public.
				They were once a single key, which meant anyone who read a page&rsquo;s
				source could push a deployment manifest and overwrite the
				runtime&rsquo;s capability set.
			</P>

			<H3>Reading a key back</H3>
			<P>
				Keys are stored encrypted as well as hashed, so a mislaid one can be
				revealed rather than rotated:
			</P>
			<CodeBlock label="Terminal">{`curl -X POST https://api.cheelalabs.com/v1/runtimes/$RUNTIME_ID/reveal-key \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "type": "public" }'`}</CodeBlock>
			<P>
				It is a <Code>POST</Code> on purpose — a <Code>GET</Code> would land in
				browser history, proxy logs, and referrer headers. Runtimes created
				before this existed are genuinely hash-only and will say so; rotate
				those instead.
			</P>

			<H3>Rotating</H3>
			<P>
				<Code>rotate-key</Code> replaces an API key, <Code>rotate-secret</Code>{" "}
				replaces the signing secret, and <Code>revoke-key</Code> invalidates one
				outright. Rotation runs with a grace period so in-flight requests signed
				with the old value are not cut off mid-execution.
			</P>

			<Callout title="Rotating the public key churns your HTML" tone="warning">
				<p>
					Anything embedding <Code>ch_pk_…</Code> in markup needs redeploying
					after a rotation. That is the reason reveal exists.
				</p>
			</Callout>

			<H2 id="endpoint">The endpoint</H2>
			<P>
				The public HTTPS address where your runtime serves capability calls.
				Cheela calls <em>in</em> to it. Set it in <Code>cheela.config.ts</Code>:
			</P>
			<CodeBlock filename="cheela.config.ts">{`export default defineConfig({
  apiKey: process.env.CHEELA_API_KEY!,
  endpoint: "https://app.example.com/cheela/execute",
});`}</CodeBlock>
			<P>
				Or on the runtime&rsquo;s endpoint card in the dashboard, or over the
				API:
			</P>
			<CodeBlock label="Terminal">{`curl -X PUT https://api.cheelalabs.com/v1/runtimes/$RUNTIME_ID/endpoint \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "endpoint": "https://app.example.com/cheela/execute" }'`}</CodeBlock>

			<P>
				It must be <Code>https://</Code>. The request signature protects
				integrity, not confidentiality, and capability inputs, outputs and the
				end user&rsquo;s credential all travel in the body. <Code>http://</Code>{" "}
				is accepted only for <Code>localhost</Code>, <Code>127.0.0.1</Code> and{" "}
				<Code>[::1]</Code> — for anything else in development, use a tunnel.
			</P>
			<P>
				A runtime with no endpoint cannot serve anything. Capability calls
				against it fail as though the capability did not exist.
			</P>

			<H2 id="deployments">Deployments</H2>
			<P>
				Each <Code>cheela deploy</Code> creates a new, numbered deployment
				holding the whole capability set, your <Code>website</Code> block, and
				your discovery namespace. The most recent one is what serves.
			</P>
			<P>
				Everything downstream reads from the stored deployment rather than from
				anything local. That is what makes over-advertising impossible: a
				capability that was never deployed cannot appear in a manifest, and the
				failure mode where a third party calls something the control plane does
				not have simply has no path.
			</P>

			<H2 id="health">Health and connection</H2>
			<P>
				<Code>cheela status</Code> reports whether the control plane has heard
				from your runtime recently. Polling status is itself the check-in, so
				there is no extra call to wire up.
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
			<P>
				If your local registrations and the deployment disagree, status prints
				the diff and tells you to deploy. To check in without polling, send an
				empty <Code>POST /v1/runtime/heartbeat</Code> — one indexed write, no
				body.
			</P>

			<H2 id="origins">Origin allowlists</H2>
			<P>
				A public key sits in public HTML, so anyone can copy it into their own
				page. An origin allowlist limits which sites browsers may use it from:
			</P>
			<CodeBlock label="Terminal">{`curl -X PUT https://api.cheelalabs.com/v1/runtimes/$RUNTIME_ID/allowed-origins \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "origins": ["https://app.example.com", "https://www.example.com"] }'`}</CodeBlock>
			<P>
				Entries must be bare origins — scheme, host, and port. A trailing slash
				or a path is rejected with a message telling you what to use instead,
				because an entry with a path can never equal a browser&rsquo;s{" "}
				<Code>Origin</Code> header and would silently match nothing. Up to 50
				entries; an empty list means unrestricted.
			</P>

			<H2 id="projects">Projects</H2>
			<P>
				Runtimes belong to projects, which group them for listing and analytics.
				If you never mention one, a default project is created on first use and
				everything lands there — the CLI, the dashboard and{" "}
				<Code>cheela deploy</Code> all work without knowing projects exist.
			</P>
			<P>
				Pass <Code>projectId</Code> when registering to file a runtime
				elsewhere. A project id is always checked against the authenticated
				owner, so another tenant&rsquo;s project reads as absent rather than
				being silently accepted.
			</P>
			<P>
				See <A href="/reference/http-api">the HTTP API reference</A> for the
				full project and runtime routes.
			</P>
		</DocPage>
	);
}
