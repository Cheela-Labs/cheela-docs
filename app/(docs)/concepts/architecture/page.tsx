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
	OL,
	P,
	Strong,
	Table,
	UL,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Architecture",
	description:
		"Cheela is a control plane. It orchestrates; your infrastructure executes. Here is the full request path and who holds which credential.",
	alternates: { canonical: "/concepts/architecture" },
};

const TOC = [
	{ id: "split", title: "The split" },
	{ id: "request-path", title: "The request path" },
	{ id: "broker", title: "The public broker" },
	{ id: "credentials", title: "Four credentials" },
	{ id: "why-signed", title: "Why requests are signed" },
	{ id: "consequences", title: "What follows from this" },
];

export default function ArchitecturePage() {
	return (
		<DocPage
			eyebrow="Concepts"
			lead="Cheela orchestrates. Your infrastructure executes. Almost everything surprising about the API follows from that one division."
			title="Architecture"
			toc={TOC}
		>
			<H2 id="split">The split</H2>
			<P>
				Cheela holds the model credential, the agent loop, the quota, and the
				trace history. You hold the capability code, the database, and your
				users&rsquo; identities. Neither side has the other&rsquo;s secrets.
			</P>

			<CodeBlock label="Topology">{`   your app / widget                       a stranger's agent
           │                                        │
           │  POST /v1/runtime/execute              │  POST /v1/capabilities/:rt/:cap
           │  (public key, ch_pk_)                  │  (no auth — from your manifest)
           ▼                                        ▼
  ┌──────────────────────────────────────────────────────────┐
  │                    Cheela control plane                  │
  │  agent loop · quota · traces · analytics · manifest       │
  └──────────────────────────────────────────────────────────┘
           │                                        │
           │  model call                            │  signed HTTPS
           │  (Cheela's OpenRouter credential)      │  x-cheela-signature
           ▼                                        ▼
      model provider                        your endpoint
                                            └─ your handler, your database`}</CodeBlock>

			<H2 id="request-path">The request path</H2>
			<P>
				A chat message arriving at <Code>POST /v1/runtime/execute</Code> goes
				through this, in order:
			</P>

			<OL>
				<LI>
					<Strong>Authenticate.</Strong> The runtime&rsquo;s public key is
					matched to a runtime record. The runtime id comes from that record,
					never from the request body — so a caller can only ever execute the
					one runtime whose key they hold.
				</LI>
				<LI>
					<Strong>Check the origin and the rate limit.</Strong> If the runtime
					has an allowlist, the browser&rsquo;s <Code>Origin</Code> must be on
					it. The limiter buckets against the runtime, not the caller&rsquo;s
					IP.
				</LI>
				<LI>
					<Strong>Check quota.</Strong> Once, on entry. The owner&rsquo;s tier
					sets the ceiling.
				</LI>
				<LI>
					<Strong>Call the model</Strong> with your deployed capabilities
					attached as tools.
				</LI>
				<LI>
					<Strong>Dispatch tool calls.</Strong> For each one, Cheela signs an
					HTTPS request and sends it to your endpoint. Results are appended to
					the transcript.
				</LI>
				<LI>
					<Strong>Repeat</Strong> from step 4 until the model stops calling
					tools, or the step budget runs out.
				</LI>
				<LI>
					<Strong>Record.</Strong> Messages, token counts, capability calls and
					duration land in the trace.
				</LI>
			</OL>

			<P>
				Steps 4 to 6 are the agent loop, and it is bounded — see{" "}
				<A href="/concepts/executions">Executions</A> for the step budget and
				what one execution costs.
			</P>

			<Callout title="Streaming is opt-in per request" tone="note">
				<p>
					Send <Code>Accept: text/event-stream</Code> and the same execution
					arrives as server-sent events instead of one JSON body. Without that
					header the response is byte-for-byte what it has always been.
				</p>
			</Callout>

			<H2 id="broker">The public broker</H2>
			<P>
				The second entry point exists because of the manifest. When you publish
				an Agent Discovery Specification document, every capability address in
				it points at <Code>POST /v1/capabilities/:runtimeId/:capability</Code> —
				Cheela&rsquo;s broker, never at your own endpoint, which only accepts
				signed requests from Cheela.
			</P>
			<P>
				That path has no model and no loop. The caller has already decided what
				it wants and supplies the input directly. It is also{" "}
				<Strong>unauthenticated</Strong>, deliberately: the manifest is public,
				so requiring a credential to call what you have published the schema for
				would advertise a door nobody can open.
			</P>

			<Callout title="Public does not mean unprotected" tone="warning">
				<p>
					Anonymous broker calls spend the owner&rsquo;s quota, so they draw on
					a smaller sub-allowance as well as the main one — traffic against your
					public manifest cannot starve your own widget. Capabilities marked{" "}
					<Code>requiresEndUser</Code> are refused on this path before anything
					is metered.
				</p>
			</Callout>

			<H2 id="credentials">Four credentials</H2>
			<P>
				Confusing two of these is the most common setup failure, so they have
				distinguishable prefixes.
			</P>

			<Table
				headers={["Credential", "Shape", "Held by", "Authorises"]}
				rows={[
					[
						"Deploy key",
						<Code>ch_sk_…</Code>,
						"Your CI, your shell",
						<>
							<Code>POST /v1/deployments</Code>, runtime status, heartbeat
						</>,
					],
					[
						"Public key",
						<Code>ch_pk_…</Code>,
						"Your page source, publicly",
						<>
							<Code>POST /v1/runtime/execute</Code> and nothing else
						</>,
					],
					[
						"Runtime secret",
						"opaque",
						"Your endpoint",
						<>Verifying that a request really came from Cheela</>,
					],
					[
						"End-user token",
						"whatever you issue",
						<>Your user&rsquo;s browser</>,
						<>Nothing, to Cheela. Your handler decides what it means.</>,
					],
				]}
			/>

			<P>
				The first two used to be one key, which meant anyone who viewed a
				page&rsquo;s source could push a deployment and overwrite the
				runtime&rsquo;s capability set. Keep them apart.
			</P>

			<H2 id="why-signed">Why requests are signed</H2>
			<P>
				Your capability endpoint is on the public internet. Without proof of
				origin, anyone who learns its URL can run your capabilities. So Cheela
				signs every call:
			</P>
			<CodeBlock label="Signature">{`HMAC-SHA256(runtimeSecret, "runtimeId.timestamp.nonce.sha256(body)")`}</CodeBlock>
			<P>Sent as four headers:</P>
			<Table
				headers={["Header", "Contents"]}
				rows={[
					["x-cheela-runtime-id", "The runtime this call is for"],
					["x-cheela-timestamp", "Milliseconds since the epoch"],
					["x-cheela-nonce", "Single-use value, per request"],
					["x-cheela-signature", "The HMAC, hex-encoded"],
				]}
			/>
			<P>
				<Code>createCheelaHandler</Code> checks them in a deliberate order:
				headers present, runtime matches, timestamp inside a five-minute
				tolerance, nonce unused, signature matches in constant time. The cheap
				structural checks run first so malformed traffic is rejected before any
				HMAC work happens, and the nonce is claimed <em>after</em> the signature
				verifies so an attacker cannot burn nonces with forged requests.
			</P>

			<H3>What the signature does not do</H3>
			<P>
				It proves integrity and origin. It does not provide confidentiality —
				capability inputs, outputs, and the end user&rsquo;s credential travel
				in the request body. That is why <Code>endpoint</Code> must be{" "}
				<Code>https://</Code>, with an exception only for localhost.
			</P>

			<H2 id="consequences">What follows from this</H2>
			<UL>
				<LI>
					<Strong>You cannot choose a model.</Strong> Executions run on
					Cheela&rsquo;s central OpenRouter credential so tokens can be metered
					and billed. <Code>cheela.config.ts</Code> has no <Code>provider</Code>{" "}
					or <Code>model</Code> field, and the registration API rejects one
					rather than accepting it and silently dropping it.
				</LI>
				<LI>
					<Strong>Cheela never sees your users.</Strong> An end-user credential
					is forwarded to your handler untouched and is deliberately kept out of{" "}
					<Code>metadata</Code>, because metadata is recorded in traces and a
					credential must not be.
				</LI>
				<LI>
					<Strong>
						A capability that was never deployed cannot be called.
					</Strong>{" "}
					The manifest is built from the stored deployment, not from anything
					local, so over-advertising has no path.
				</LI>
				<LI>
					<Strong>Your endpoint must be reachable from the internet.</Strong>{" "}
					During development that means a tunnel.
				</LI>
			</UL>
		</DocPage>
	);
}
