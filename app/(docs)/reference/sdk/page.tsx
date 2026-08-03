import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	H2,
	P,
	Property,
	PropertyList,
	Table,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "@cheela/sdk",
	description:
		"Types and helpers for describing capabilities: Capability, Action, ActionContext, Schema, and the capability naming rules.",
	alternates: { canonical: "/reference/sdk" },
};

const TOC = [
	{ id: "install", title: "Install" },
	{ id: "capability", title: "Capability" },
	{ id: "action", title: "Action" },
	{ id: "context", title: "ActionContext" },
	{ id: "factories", title: "createCapability, createAction" },
	{ id: "schema", title: "Schema and validate" },
	{ id: "names", title: "Capability names" },
	{ id: "errors", title: "ValidationError" },
];

export default function SdkReferencePage() {
	return (
		<DocPage
			path="/reference/sdk"
			eyebrow="Reference"
			lead="The vocabulary every other package shares. @cheela/sdk holds no runtime behaviour beyond validation — it is types, two factories, and the naming rules the CLI and the control plane both enforce."
			title="@cheela/sdk"
			toc={TOC}
		>
			<H2 id="install">Install</H2>
			<CodeBlock label="Terminal">{`npm install @cheela/sdk`}</CodeBlock>
			<P>
				Usually installed alongside <Code>@cheela/runtime</Code>, which
				re-exports nothing from it — you import types from here and the{" "}
				<Code>Runtime</Code> class from there.
			</P>

			<H2 id="capability">Capability</H2>
			<P>
				What a capability <em>is</em>. Everything here is published to Cheela at
				deploy time.
			</P>
			<PropertyList>
				<Property name="name" required type="string">
					<p>
						Unique within the runtime. Must match{" "}
						<Code>^[A-Za-z][A-Za-z0-9-]{"{0,63}"}$</Code> — see below.
					</p>
				</Property>
				<Property name="description" type="string">
					<p>
						Read by the model to decide when to call this. Write it as a
						decision rule, not a label.
					</p>
				</Property>
				<Property name="version" type="string">
					<p>
						Semver. Required by the Agent Discovery Specification, so{" "}
						<Code>cheela deploy</Code> requires it too — even when a capability
						has no schemas.
					</p>
				</Property>
				<Property name="input" type="Schema<TInput>">
					<p>
						Validates input before the handler runs, and is serialized to JSON
						Schema for the model.
					</p>
				</Property>
				<Property name="output" type="Schema<TOutput>">
					<p>Validates whatever the handler returns, before it goes back.</p>
				</Property>
				<Property name="requiresEndUser" type="boolean">
					<p>
						Marks a capability that acts on behalf of a person. The runtime
						refuses the call before the handler runs when no credential is
						present, and the public broker refuses it before metering.
					</p>
				</Property>
				<Property name="metadata" type="Record<string, unknown>">
					<p>Arbitrary context, stored with the deployment.</p>
				</Property>
				<Property name="inputJsonSchema" type="unknown">
					<p>
						Pre-serialized JSON Schema. Set by the server when rebuilding a
						capability from a stored manifest, where the original schema object
						no longer exists. Locally-defined capabilities set{" "}
						<Code>input</Code> and leave this alone.
					</p>
				</Property>
				<Property name="outputJsonSchema" type="unknown">
					<p>As above, for output.</p>
				</Property>
			</PropertyList>

			<H2 id="action">Action</H2>
			<P>
				What a capability <em>does</em>. Never leaves your infrastructure.
			</P>
			<PropertyList>
				<Property name="name" required type="string">
					<p>Identifies the action within the capability.</p>
				</Property>
				<Property name="description" type="string">
					<p>For your own readers. Published with the deployment.</p>
				</Property>
				<Property name="permissions" type="readonly string[]">
					<p>
						Checked against the permission set the <Code>Runtime</Code> was
						constructed with. A missing one throws before the handler runs.
					</p>
				</Property>
				<Property
					name="handler"
					required
					type="(context, input) => Promise<TOutput> | TOutput"
				>
					<p>Your implementation. May be sync or async.</p>
				</Property>
				<Property name="metadata" type="Record<string, unknown>">
					<p>Arbitrary context.</p>
				</Property>
			</PropertyList>

			<Callout title="One capability, one action" tone="note">
				<p>
					Dispatch is by capability name alone, so a second action would be
					unreachable. The deployment API accepts at most one and rejects more
					rather than dropping them silently.
				</p>
			</Callout>

			<H2 id="context">ActionContext</H2>
			<P>What a handler is told about the call it is serving.</P>
			<CodeBlock label="TypeScript">{`interface ActionContext {
  readonly executionId: string;
  readonly capability: string;
  readonly startedAt: number;
  readonly endUserToken?: string;
}`}</CodeBlock>
			<Table
				headers={["Field", "Notes"]}
				rows={[
					[
						"executionId",
						"Cheela's id for this execution. Log it to join your own logs to the trace.",
					],
					["capability", "The capability being served."],
					["startedAt", "Epoch milliseconds, taken when dispatch began."],
					[
						"endUserToken",
						"The caller's credential, untouched. Undefined means anonymous — which cannot happen for a capability marked requiresEndUser.",
					],
				]}
			/>
			<P>
				This lives in the SDK rather than the runtime because the handler
				signature does. Typing it as <Code>unknown</Code> meant nobody could
				read the context without a cast, which in practice meant nobody read it.
			</P>

			<H2 id="factories">createCapability, createAction</H2>
			<P>
				Identity functions that pin generics, so schema types survive to your
				handler.
			</P>
			<CodeBlock label="TypeScript">{`import { createCapability, createAction } from "@cheela/sdk";

const searchCapability = createCapability({
  name: "catalog-search",
  version: "1.0.0",
  input: z.object({ query: z.string(), limit: z.number().default(10) }),
});

const searchAction = createAction({
  name: "search",
  async handler(context, input) {
    // input.query is string, input.limit is number — no cast.
    return catalog.search(input.query, input.limit);
  },
});

runtime.register(searchCapability, searchAction);`}</CodeBlock>
			<P>
				Without the generic, these collapse to{" "}
				<Code>Capability{"<unknown, unknown>"}</Code> and every handler has to
				open with a cast the API left no way to avoid. Passing object literals
				directly to <Code>register()</Code> infers just as well; the factories
				are for when you want to define them separately.
			</P>

			<H2 id="schema">Schema and validate</H2>
			<P>The entire schema contract is one method.</P>
			<CodeBlock label="TypeScript">{`interface Schema<T> {
  parse(value: unknown): T;
}`}</CodeBlock>
			<P>Zod satisfies it as-is. So does anything you write:</P>
			<CodeBlock label="TypeScript">{`const positiveInt: Schema<number> = {
  parse(value) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
      throw new Error("Expected a positive integer");
    }
    return value;
  },
};`}</CodeBlock>
			<P>
				<Code>validate(schema, value)</Code> runs a schema and normalises
				whatever it throws into a <Code>ValidationError</Code>, preserving the
				original as <Code>cause</Code>. The runtime calls it for you on both
				input and output.
			</P>

			<H2 id="names">Capability names</H2>
			<CodeBlock label="Pattern">{`^[A-Za-z][A-Za-z0-9-]{0,63}$`}</CodeBlock>
			<PropertyList>
				<Property name="isValidCapabilityName" type="(name: string) => boolean">
					<p>Tests a name against the pattern.</p>
				</Property>
				<Property
					name="describeCapabilityNameError"
					type="(name: string) => string"
				>
					<p>
						Explains a rejection in terms of what was probably typed, and
						suggests a repaired name. Used by the runtime, the CLI, and the
						control plane so all three give the same answer.
					</p>
				</Property>
			</PropertyList>
			<CodeBlock label="TypeScript">{`isValidCapabilityName("catalog-search"); // true
isValidCapabilityName("catalog.search"); // false
isValidCapabilityName("catalog_search"); // false
isValidCapabilityName("2fa-verify");     // false — must start with a letter`}</CodeBlock>
			<P>
				The pattern is the intersection of two rules: tool-calling APIs reject
				dots, and the Agent Discovery Specification rejects underscores. Hyphens
				satisfy both. Full reasoning in{" "}
				<A href="/concepts/capabilities">Capabilities</A>.
			</P>

			<H2 id="errors">ValidationError</H2>
			<P>Thrown when an SDK definition or a validated value is invalid.</P>
			<CodeBlock label="TypeScript">{`import { ValidationError } from "@cheela/sdk";

try {
  await runtime.execute("catalog-search", { query: 42 });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message, error.cause);
  }
}`}</CodeBlock>
			<P>
				The prototype chain is repaired in the constructor, so{" "}
				<Code>instanceof</Code> works across module and bundler boundaries where
				a plain <Code>extends Error</Code> would not.
			</P>
		</DocPage>
	);
}
