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
	title: "Executions",
	description:
		"One execution is one agent loop: repeated model calls and capability dispatches, bounded by a step budget, billed once.",
	alternates: { canonical: "/concepts/executions" },
};

const TOC = [
	{ id: "what", title: "What an execution is" },
	{ id: "loop", title: "The loop" },
	{ id: "messages", title: "Messages and parts" },
	{ id: "finish", title: "How a loop ends" },
	{ id: "failure", title: "Failure is not an error" },
	{ id: "streaming", title: "Streaming" },
	{ id: "billing", title: "What gets counted" },
	{ id: "traces", title: "Traces" },
];

export default function ExecutionsPage() {
	return (
		<DocPage
			path="/concepts/executions"
			eyebrow="Concepts"
			lead="One execution is one agent loop: the model runs, calls capabilities, reads the results, and runs again until it has an answer. However many steps that takes, it bills as one."
			title="Executions"
			toc={TOC}
		>
			<H2 id="what">What an execution is</H2>
			<P>
				You send messages. Cheela returns a transcript, token counts, a finish
				reason, and a duration. Between those two points it may have called the
				model a dozen times and your endpoint twenty more.
			</P>
			<CodeBlock label="TypeScript">{`interface ExecutionResult {
  executionId: string;
  status: "completed" | "failed";
  messages: readonly Message[];
  finishReason: "stop" | "tool_calls" | "length" | "error";
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  durationMs: number;
  error?: string;
}`}</CodeBlock>

			<H2 id="loop">The loop</H2>
			<OL>
				<LI>
					Call the model with the transcript so far and your capabilities as
					tools.
				</LI>
				<LI>
					Append the model&rsquo;s message to the transcript, and its shape to
					the trace.
				</LI>
				<LI>
					If it contains no tool calls, stop — that message is the answer.
				</LI>
				<LI>
					Otherwise dispatch each tool call to your endpoint, in parallel up to
					a cap, and append the results.
				</LI>
				<LI>Go back to step 1.</LI>
			</OL>
			<P>
				Token usage accumulates across every step rather than being overwritten,
				because the execution is billed for all of them.
			</P>

			<Callout title="The step budget is 25 by default" tone="note">
				<p>
					A loop that reaches it stops with{" "}
					<Code>finishReason: &quot;length&quot;</Code> — a budget outcome, not
					a crash. Together with the parallel-call cap, this is what bounds the
					cost of a single execution, since no quota check happens between
					steps.
				</p>
			</Callout>

			<H2 id="messages">Messages and parts</H2>
			<P>
				A message has a role and a list of parts. Parts are how tool calls
				travel in the same structure as text.
			</P>
			<CodeBlock label="TypeScript">{`type MessageRole = "system" | "user" | "assistant" | "tool";

type MessagePart =
  | { type: "text"; content: string }
  | { type: "tool_call"; id: string; name: string; input: unknown }
  | { type: "tool_result"; toolCallId: string; name: string; output: unknown };

interface Message {
  role: MessageRole;
  parts: readonly MessagePart[];
}`}</CodeBlock>
			<P>A minimal request is one user message with one text part:</P>
			<CodeBlock label="JSON">{`{
  "messages": [
    { "role": "user", "parts": [{ "type": "text", "content": "Where is order 8812?" }] }
  ]
}`}</CodeBlock>
			<P>
				The returned transcript includes everything that happened in between, so
				reading the <Code>tool_call</Code> and <Code>tool_result</Code> parts
				tells you exactly which capabilities ran and what they returned.
			</P>

			<H2 id="finish">How a loop ends</H2>
			<Table
				headers={["finishReason", "Meaning"]}
				rows={[
					[
						"stop",
						"The model produced an answer with no tool calls. The normal ending.",
					],
					[
						"tool_calls",
						"The model ended its turn asking for tools. Visible mid-stream; not a terminal state for a completed execution.",
					],
					[
						"length",
						"The step budget ran out, or the model hit its own output ceiling.",
					],
					["error", "Something outside the loop failed. Read `error`."],
				]}
			/>

			<H2 id="failure">Failure is not an error</H2>
			<P>Two things fail independently, and Cheela reports them differently.</P>
			<UL>
				<LI>
					<Strong>A capability that throws</Strong> becomes a{" "}
					<Code>tool_result</Code> carrying an error, and the loop continues.
					One bad call does not abort the whole run — the model gets to see what
					went wrong and try something else.
				</LI>
				<LI>
					<Strong>An execution that fails</Strong> still returns HTTP 200, with{" "}
					<Code>status: &quot;failed&quot;</Code> and an <Code>error</Code>{" "}
					string in the body.
				</LI>
			</UL>

			<Callout title="Check the body, not the status line" tone="warning">
				<p>
					This route once returned 502 on a failed execution, and clients
					treated that as terminal and discarded the body — so every capability
					error and missing endpoint arrived as{" "}
					<Code>&quot;request failed (502)&quot;</Code> and nothing else, while
					the server had carefully explained the problem. The request succeeded;
					the execution is what did not.
				</p>
			</Callout>

			<H2 id="streaming">Streaming</H2>
			<P>
				Send <Code>Accept: text/event-stream</Code> and the same execution
				arrives as server-sent events. Without the header, the response is
				unchanged — this is content-negotiated, so nothing breaks by adding it.
			</P>
			<CodeBlock label="Terminal">{`curl -N https://api.cheelalabs.com/v1/runtime/execute \\
  -H "Authorization: Bearer $CHEELA_PUBLIC_KEY" \\
  -H "Accept: text/event-stream" \\
  -H "Content-Type: application/json" \\
  -d '{ "messages": [...] }'`}</CodeBlock>
			<P>
				Streaming does not make an execution faster. Nearly all of a
				request&rsquo;s wall time is the provider generating tokens, and no
				amount of engineering on this side moves that. What it changes is that
				the user stops waiting in silence for the whole thing.
			</P>
			<P>
				The stream always terminates with a <Code>done</Code> event carrying the
				same <Code>ExecutionResult</Code> the JSON path returns — including when
				something fails, because the status line has already been sent by then.
			</P>

			<H2 id="billing">What gets counted</H2>
			<P>
				<Strong>One execution is one unit</Strong>, no matter how many steps the
				model takes to complete it. Capability calls are counted and reported,
				but they are not a limit.
			</P>
			<P>
				Quota is a token bucket rather than a per-hour counter, so a quiet hour
				pays for a busy one. Bucket capacity is your hourly rate multiplied by
				your rollover window:
			</P>
			<Table
				headers={["Plan", "Executions / hour", "Rollover", "Burst capacity"]}
				rows={[
					["Free", "100", "2 hours", "200"],
					["Pro", "2,000", "24 hours", "48,000"],
					["Enterprise", "unlimited", "—", "—"],
				]}
			/>
			<P>
				Usage responses carry <Code>periodStart</Code> and{" "}
				<Code>periodEnd</Code>, so a dashboard can say &ldquo;resets in
				23m&rdquo; rather than leaving people to guess.
			</P>

			<H3>Broker calls</H3>
			<P>
				Anonymous calls through{" "}
				<A href="/concepts/architecture">the public broker</A> spend the
				owner&rsquo;s quota, and draw on a smaller sub-allowance as well as the
				main one. Without that, traffic against a public manifest could starve
				the owner&rsquo;s own widget — which is a remote denial of service
				against anyone who publishes one.
			</P>

			<H2 id="traces">Traces</H2>
			<P>
				Every execution is recorded: every capability call, token counts,
				duration, any error, and the <em>shape</em> of the conversation. List
				them with <Code>GET /v1/executions</Code>, fetch one with{" "}
				<Code>GET /v1/executions/:executionId</Code>.
			</P>
			<Callout title="What a trace does not contain" tone="note">
				<p>
					Message content is never stored. A trace holds{" "}
					<Code>messageShape</Code> instead — one entry per turn carrying its{" "}
					<Code>role</Code> and the <Code>type</Code> of each part. You can see
					that a run went user &rarr; assistant &rarr; tool; you cannot read
					what was said, and neither can we.
				</p>
				<p>
					Capability <Code>input</Code> and <Code>output</Code> payloads are the
					exception — those are stored in full, because they are how you debug a
					capability being called with the wrong arguments. Tool arguments are
					often the user&rsquo;s own words rephrased, so treat a capability
					signature as a decision about what gets retained.
				</p>
			</Callout>
			<P>
				Your handler receives the same <Code>executionId</Code> Cheela recorded,
				so logging it joins your own logs to the trace:
			</P>
			<CodeBlock label="TypeScript">{`async handler(context, input) {
  logger.info({ executionId: context.executionId }, "order lookup");
  // ...
}`}</CodeBlock>
			<Callout title="Metadata is traced. Credentials are not." tone="danger">
				<p>
					Anything you put in <Code>metadata</Code> is recorded in the trace.
					The end user&rsquo;s credential travels in its own field that the
					trace path never sees. Do not move one into the other.
				</p>
			</Callout>
		</DocPage>
	);
}
