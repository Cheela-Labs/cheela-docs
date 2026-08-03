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
	Strong,
	Table,
	UL,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Errors and limits",
	description:
		"Every error code the API returns, every signature failure reason, and the per-plan execution ceilings.",
	alternates: { canonical: "/reference/errors-and-limits" },
};

const TOC = [
	{ id: "shape", title: "Error shape" },
	{ id: "codes", title: "API error codes" },
	{ id: "signature", title: "Signature failures" },
	{ id: "handler", title: "Handler responses" },
	{ id: "client", title: "Client errors" },
	{ id: "limits", title: "Plan limits" },
	{ id: "quota", title: "How quota works" },
	{ id: "steps", title: "Execution bounds" },
];

export default function ErrorsAndLimitsPage() {
	return (
		<DocPage
			path="/reference/errors-and-limits"
			eyebrow="Reference"
			lead="Every failure Cheela can report, and every ceiling it enforces."
			title="Errors and limits"
			toc={TOC}
		>
			<H2 id="shape">Error shape</H2>
			<CodeBlock label="Error">{`{
  "error": {
    "code": "validation_error",
    "message": "Invalid execution request",
    "details": { "fieldErrors": { "messages": ["Required"] } }
  }
}`}</CodeBlock>
			<P>
				<Code>details</Code> appears on validation failures and is otherwise
				absent. Internal errors never carry it — an unhandled failure returns a
				generic message rather than echoing anything about the infrastructure
				that produced it.
			</P>

			<H2 id="codes">API error codes</H2>
			<Table
				headers={["Code", "Status", "Cause"]}
				rows={[
					[
						"validation_error",
						"400",
						"The body failed its schema. `details` names the fields.",
					],
					[
						"unauthorized",
						"401",
						"Missing or invalid key, a key not valid on this route, or a capability requiring an end user called anonymously.",
					],
					[
						"forbidden",
						"403",
						"The resource belongs to another owner, or creating it would exceed your plan's runtime ceiling.",
					],
					[
						"not_found",
						"404",
						"Unknown runtime, capability, execution, or project. Also returned instead of 403 where a 403 would confirm an id exists.",
					],
					[
						"rate_limit_exceeded",
						"429",
						"Too many requests, or the hourly execution allowance is spent.",
					],
					[
						"execution_error",
						"502",
						"A capability call through the public broker failed.",
					],
					[
						"internal_error",
						"500",
						"Something unexpected. Logged server-side.",
					],
				]}
			/>

			<Callout title="404 is sometimes deliberate" tone="note">
				<p>
					Fetching another owner&rsquo;s execution returns 404, not 403 — a 403
					would confirm the id exists and turn the route into an enumeration
					oracle. The public broker does the same for unknown runtimes, unknown
					capabilities, and runtimes with no endpoint: one shape for all three,
					so an anonymous caller cannot probe which runtimes exist.
				</p>
			</Callout>

			<H3>Two that look like errors and are not</H3>
			<UL>
				<LI>
					<Strong>A failed execution returns 200.</Strong> The request
					succeeded; the execution did not. Read <Code>status</Code> and{" "}
					<Code>error</Code> from the body.
				</LI>
				<LI>
					<Strong>A capability that throws returns 200</Strong> from your
					handler. Cheela turns it into a <Code>tool_result</Code> error the
					model can read and recover from.
				</LI>
			</UL>

			<H2 id="signature">Signature failures</H2>
			<P>
				Returned by <Code>verifyCheelaSignature</Code> as{" "}
				<Code>result.reason</Code>, and by the handlers as a 401 body.
			</P>
			<Table
				headers={["Reason", "What to check"]}
				rows={[
					[
						"missing_headers",
						"One of the four x-cheela-* headers did not arrive. Usually a proxy or CDN stripping unknown headers.",
					],
					[
						"runtime_mismatch",
						"The signature was issued for a different runtime than the one you pinned with `runtimeId`.",
					],
					["timestamp_invalid", "The timestamp header was not a number."],
					[
						"timestamp_outside_tolerance",
						"More than five minutes of clock skew, in either direction. Check NTP on your server.",
					],
					[
						"nonce_replayed",
						"A genuine replay — or several instances behind a load balancer without a shared nonce store.",
					],
					[
						"signature_mismatch",
						"The wrong secret, or far more often a body that was parsed and re-serialized before verification.",
					],
				]}
			/>
			<P>
				The last one is the one to suspect first. Full detail in{" "}
				<A href="/guides/serving-capabilities">Serve capability calls</A>.
			</P>

			<H2 id="handler">Handler responses</H2>
			<P>What the runtime handlers return to Cheela.</P>
			<Table
				headers={["Status", "Body", "Meaning"]}
				rows={[
					["200", <Code>{`{ output }`}</Code>, "Ran and returned."],
					[
						"200",
						<Code>{`{ output: null, error }`}</Code>,
						"The capability threw. The loop continues.",
					],
					[
						"400",
						<Code>{`{ error: "invalid_json" }`}</Code>,
						"Body was not JSON.",
					],
					[
						"400",
						<Code>{`{ error: "missing_capability" }`}</Code>,
						"No capability named in the body.",
					],
					[
						"400",
						<Code>{`{ error: "raw_body_required" }`}</Code>,
						"Express only. Mounted with express.json() instead of express.raw().",
					],
					[
						"401",
						<Code>{`{ error: reason }`}</Code>,
						"Verification failed. One of the six reasons above.",
					],
				]}
			/>

			<H2 id="client">Client errors</H2>
			<Table
				headers={["Class", "Thrown when"]}
				rows={[
					[
						"CheelaNetworkError",
						"The request never completed. Carries the cause.",
					],
					["CheelaAuthError", "401 or 403. Carries `status`."],
					["CheelaApiError", "Any other non-2xx. Carries `status`."],
					[
						"CheelaConfigError",
						"Client config failed to parse — usually a missing key.",
					],
					[
						"ValidationError",
						"From @cheela/sdk, when a schema rejects a value.",
					],
				]}
			/>
			<P>
				<Code>CheelaClientError</Code> is the base for the first three. Catch it
				to catch everything transport-related.
			</P>

			<H2 id="limits">Plan limits</H2>
			<Table
				headers={["", "Free", "Pro", "Enterprise"]}
				rows={[
					["Executions / hour", "100", "2,000", "unlimited"],
					["Rollover window", "2 hours", "24 hours", "—"],
					["Burst capacity", "200", "48,000", "—"],
					["Runtimes", "1", "10", "unlimited"],
				]}
			/>
			<Callout title="Capability calls are counted, not capped" tone="note">
				<p>
					An execution counts once no matter how many steps the model takes.
					Capability calls appear in usage and analytics, but they are not a
					limit — a ceiling nobody enforces is worse than no ceiling, because it
					drifts away from what was sold.
				</p>
			</Callout>

			<H2 id="quota">How quota works</H2>
			<P>
				A token bucket, not a per-hour counter. Capacity is your hourly rate
				multiplied by your rollover window, so a quiet hour pays for a busy one
				— which is the only way to express &ldquo;you may burst to 48,000 but
				only sustain 2,000/hour&rdquo;.
			</P>
			<P>
				Usage responses carry <Code>periodStart</Code> and{" "}
				<Code>periodEnd</Code> so an interface can say when the allowance resets
				rather than leaving people to guess.
			</P>

			<H3>Broker sub-allowance</H3>
			<P>
				Anonymous calls through the public broker draw on a smaller share as
				well as the main allowance. Without it, traffic against a public
				manifest could exhaust the owner&rsquo;s whole quota and take their own
				widget down with it — a remote denial of service against anyone who
				publishes one.
			</P>

			<H3>Runtime ceilings</H3>
			<P>
				Only creating a <em>new</em> runtime counts. Re-registration never does,
				so
				<Code>cheela deploy</Code> keeps working for someone sitting exactly at
				their limit. Owners already over a limit keep everything they have — the
				check gates creation, it never deletes.
			</P>

			<H2 id="steps">Execution bounds</H2>
			<Table
				headers={["Bound", "Default", "Effect"]}
				rows={[
					[
						"Steps per execution",
						"25",
						<>
							The agent loop stops with{" "}
							<Code>finishReason: &quot;length&quot;</Code>.
						</>,
					],
					[
						"Parallel capability calls",
						"capped",
						"Tool calls in one step are dispatched concurrently up to a fixed ceiling.",
					],
					[
						"Signature tolerance",
						"5 minutes",
						"Clock skew allowed in either direction.",
					],
					["Page size", "200", "Maximum `limit` on executions and traces."],
					["Allowed origins", "50", "Maximum entries per runtime."],
				]}
			/>
			<P>
				There is no quota check between steps, deliberately. A step consumes
				nothing a quota could refuse, so the cost of one execution is bounded
				structurally by the step budget and the parallel-call cap instead —
				re-checking per step meant aggregating the owner&rsquo;s whole usage
				once per step rather than once per execution.
			</P>
			<P>
				Reaching the step budget is <Code>&quot;length&quot;</Code>, not{" "}
				<Code>&quot;error&quot;</Code>: the loop hit its ceiling, which is a
				budget outcome rather than a failure.
			</P>
		</DocPage>
	);
}
