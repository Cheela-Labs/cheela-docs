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
	title: "Troubleshooting",
	description:
		"The failures that actually happen with Cheela, what each one really means, and the fix.",
	alternates: { canonical: "/troubleshooting" },
};

const TOC = [
	{ id: "signature", title: "Every request fails verification" },
	{ id: "not-called", title: "The model never calls my capability" },
	{ id: "no-schema", title: "Deploy warns about missing schemas" },
	{ id: "name-rejected", title: "A capability name is rejected" },
	{ id: "auth", title: "Authentication failures" },
	{ id: "no-endpoint", title: "Capability not found" },
	{ id: "cors", title: "The widget is blocked in the browser" },
	{ id: "config", title: "Config and loading errors" },
	{ id: "manifest", title: "The manifest will not publish" },
	{ id: "quota", title: "Rate limits" },
];

export default function TroubleshootingPage() {
	return (
		<DocPage
			eyebrow="Help"
			lead="Ordered roughly by how often each one comes up. Most have a symptom that points somewhere other than the cause, so the misleading reading is called out too."
			title="Troubleshooting"
			toc={TOC}
		>
			<H2 id="signature">Every request fails verification</H2>
			<P>
				Symptom: every capability call returns 401 with{" "}
				<Code>signature_mismatch</Code>.
			</P>
			<Callout title="It is almost never the secret" tone="warning">
				<p>
					The name of this failure points at the credential, and the cause is
					usually the body. Check the body first — rotating a working secret
					costs you a redeploy and fixes nothing.
				</p>
			</Callout>

			<H3>1. Something parsed the body</H3>
			<P>
				The signature covers the exact bytes received. <Code>JSON.parse</Code>{" "}
				then <Code>JSON.stringify</Code> will not reproduce them — key order,
				whitespace and unicode escaping all differ.
			</P>
			<CodeBlock label="Express">{`// Wrong — express.json() discards the bytes the signature covers.
app.post("/cheela/execute", express.json(), handler);

// Right
app.post("/cheela/execute", express.raw({ type: "*/*" }), handler);`}</CodeBlock>
			<P>
				The Express handler detects this and answers{" "}
				<Code>400 raw_body_required</Code> rather than letting it read as a bad
				secret. Any other body-parsing middleware upstream causes the same thing
				without that message.
			</P>

			<H3>2. The secret is empty</H3>
			<CodeBlock label="TypeScript">{`// Wrong — verifies every signature against "".
secret: process.env.CHEELA_RUNTIME_SECRET ?? "",`}</CodeBlock>
			<P>
				A security parameter should not have a fallback. Throw when it is
				missing.
			</P>

			<H3>3. Clock skew</H3>
			<P>
				<Code>timestamp_outside_tolerance</Code> means more than five minutes of
				drift in either direction. Future-dated timestamps are rejected too,
				since one would otherwise extend its own replay window.
			</P>

			<H3>4. Multiple instances, one memory store</H3>
			<P>
				<Code>nonce_replayed</Code> on legitimate traffic means{" "}
				<Code>MemoryNonceStore</Code> behind a load balancer. Back it with Redis
				— <A href="/reference/runtime">the runtime reference</A> has a working
				implementation.
			</P>

			<H2 id="not-called">The model never calls my capability</H2>
			<OL>
				<LI>
					<Strong>Is it deployed?</Strong> <Code>cheela status</Code> shows the
					live capability set and diffs it against your local one. Registering
					locally is not deploying.
				</LI>
				<LI>
					<Strong>Does it have an input schema?</Strong> Without one, the model
					is told the capability takes no parameters, so it will not pass the
					arguments your handler needs. Check the deploy warning.
				</LI>
				<LI>
					<Strong>Is the description a decision rule?</Strong>{" "}
					<Code>&quot;Order lookup&quot;</Code> gives a model nothing to act on.
					Say when to use it, and how it differs from its nearest neighbour.
				</LI>
				<LI>
					<Strong>Is your endpoint reachable?</Strong> A runtime with no working
					endpoint fails the call rather than announcing the problem.
				</LI>
			</OL>
			<P>
				Read the execution trace. The transcript contains every{" "}
				<Code>tool_call</Code> and <Code>tool_result</Code>, so you can see
				whether the model tried and failed, or never tried.
			</P>

			<H2 id="no-schema">Deploy warns about missing schemas</H2>
			<CodeBlock label="Output">{`⚠ No input schema published for: catalog-search
  The model will be told these capabilities take no parameters.`}</CodeBlock>
			<P>Usually one of:</P>
			<UL>
				<LI>
					The schema was assigned to a variable that is never passed as{" "}
					<Code>input</Code>.
				</LI>
				<LI>
					The schema could not be serialized to JSON Schema. Transforms,
					effects, and lazy recursive types are the usual suspects — simplify
					the outermost layer.
				</LI>
				<LI>
					It genuinely takes no input, in which case the warning is correct and
					you can ignore it.
				</LI>
			</UL>

			<H2 id="name-rejected">A capability name is rejected</H2>
			<CodeBlock label="Error">{`Invalid capability name "catalog.search". Dots are not allowed: LLM
tool-calling APIs reject them, so the model could never invoke it.

Use hyphens instead, e.g. "catalog-search".`}</CodeBlock>
			<P>
				Names must match <Code>^[A-Za-z][A-Za-z0-9-]{"{0,63}"}$</Code>. Dots
				break tool calling; underscores break the discovery spec; hyphens
				satisfy both. The dots a published name needs come from your{" "}
				<Code>adp.namespace</Code>.
			</P>
			<P>
				The same check runs in the runtime, the CLI, and the control plane, so a
				name that passes one passes all three.
			</P>

			<H2 id="auth">Authentication failures</H2>
			<Table
				headers={["Message", "Cause"]}
				rows={[
					[
						"Could not authenticate this Runtime",
						<>
							<Code>CHEELA_API_KEY</Code> is invalid, or is not a deploy key.
						</>,
					],
					[
						"This key is not valid for this endpoint",
						<>
							Right key, wrong plane — a <Code>ch_pk_</Code> key sent to a
							deploy route, or a <Code>ch_sk_</Code> key sent to execute.
						</>,
					],
					[
						"Missing runtime API key",
						<>
							No <Code>Authorization: Bearer …</Code> header arrived.
						</>,
					],
					["Could not reach the Cheela Control Plane", "Network."],
				]}
			/>
			<Callout title="The plane rejection is intentionally vague" tone="note">
				<p>
					It tells you the key is not valid here, not which of the two you are
					holding. Check the prefix: <Code>ch_sk_</Code> deploys,{" "}
					<Code>ch_pk_</Code> executes.
				</p>
			</Callout>

			<H2 id="no-endpoint">Capability not found</H2>
			<P>
				A 404 from the public broker means one of three things, and it will not
				tell you which — that is deliberate, so anonymous callers cannot probe
				which runtimes exist.
			</P>
			<UL>
				<LI>The runtime id does not exist.</LI>
				<LI>The capability is not in the current deployment.</LI>
				<LI>
					<Strong>The runtime has no endpoint configured.</Strong> This is the
					one people miss.
				</LI>
			</UL>
			<P>
				Check the third with <Code>cheela status</Code> or the runtime detail
				endpoint. Set it in <Code>cheela.config.ts</Code>, on the dashboard
				card, or over the API.
			</P>

			<H2 id="cors">The widget is blocked in the browser</H2>
			<P>
				A 403 on <Code>/v1/runtime/execute</Code> from a browser, working fine
				from <Code>curl</Code>, means the origin allowlist.
			</P>
			<CodeBlock label="Wrong">{`{ "origins": ["https://app.example.com/"] }     // trailing slash
{ "origins": ["https://app.example.com/chat"] } // path`}</CodeBlock>
			<CodeBlock label="Right">{`{ "origins": ["https://app.example.com"] }`}</CodeBlock>
			<P>
				An entry with a path or trailing slash can never equal a browser&rsquo;s{" "}
				<Code>Origin</Code> header. These are now rejected at write time with a
				message naming the origin to use — but a list saved before that check
				existed will silently match nothing. Re-save it.
			</P>
			<P>
				Remember to include every origin you serve from, including{" "}
				<Code>www</Code> and bare-domain variants if both resolve.
			</P>

			<H2 id="config">Config and loading errors</H2>

			<H3>Could not load Cheela Runtime</H3>
			<P>
				The module at <Code>runtime</Code> must default-export a{" "}
				<Code>Runtime</Code>, or export one named <Code>runtime</Code>. The
				error names the path it tried.
			</P>
			<CodeBlock filename=".cheela/runtime.ts">{`const runtime = new Runtime();
// ...registrations...
export default runtime;   // ← this line`}</CodeBlock>

			<H3>Invalid cheela.config.ts</H3>
			<P>
				Every failing field is listed with its own message. The two most common:
			</P>
			<UL>
				<LI>
					<Strong>Missing CHEELA_API_KEY</Strong> — <Code>.env</Code> is not
					being found, or the variable is not set. The CLI walks up from the
					working directory to find the project root.
				</LI>
				<LI>
					<Strong>endpoint must use https://</Strong> — see below.
				</LI>
			</UL>

			<H3>endpoint must use https</H3>
			<P>
				<Code>http://</Code> is accepted only for <Code>localhost</Code>,{" "}
				<Code>127.0.0.1</Code> and <Code>[::1]</Code>. Everything else needs
				TLS, because the signature protects integrity rather than
				confidentiality and the end user&rsquo;s credential travels in the body.
				Use a tunnel in development.
			</P>

			<H3>An old config with provider and model</H3>
			<P>
				Those fields no longer exist. Remove them — executions run on
				Cheela&rsquo;s own credential. See{" "}
				<A href="/reference/configuration">Configuration</A>.
			</P>

			<H2 id="manifest">The manifest will not publish</H2>
			<Table
				headers={["Response", "Fix"]}
				rows={[
					[
						"404 — no deployment yet",
						<>
							Run <Code>cheela deploy</Code> first. The manifest is built from
							the stored deployment, not from local files.
						</>,
					],
					[
						"400 — no website or adp.namespace",
						<>
							Add both to <Code>cheela.config.ts</Code> and redeploy. The
							manifest cannot describe who operates the system without them.
						</>,
					],
					[
						"400 — capability has no version",
						<>
							The discovery spec requires one on every capability, even without
							schemas.
						</>,
					],
				]}
			/>
			<P>
				All three refuse rather than emitting a partial document. A manifest
				gets cached and republished by agents nobody can contact, so a wrong one
				is far more expensive to retract than a missing one is to wait for.
			</P>

			<H2 id="quota">Rate limits</H2>
			<P>
				A <Code>429 rate_limit_exceeded</Code> means the hourly allowance is
				spent or the request rate is too high.
			</P>
			<UL>
				<LI>
					<Strong>Check your usage.</Strong> The billing usage endpoint returns{" "}
					<Code>periodStart</Code> and <Code>periodEnd</Code>, so you can see
					exactly when the bucket refills.
				</LI>
				<LI>
					<Strong>Remember rollover.</Strong> Capacity is your hourly rate times
					your rollover window, so a burst after a quiet period is expected to
					work.
				</LI>
				<LI>
					<Strong>Published a manifest?</Strong> Anonymous broker traffic spends
					your quota. It draws on a sub-allowance so it cannot starve your own
					widget, but it is still counted.
				</LI>
			</UL>
			<P>
				Ceilings per plan are in{" "}
				<A href="/reference/errors-and-limits">Errors and limits</A>.
			</P>
		</DocPage>
	);
}
