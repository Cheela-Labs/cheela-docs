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
	title: "Capabilities",
	description:
		"A capability is one thing your product can do, described well enough for a model to call it correctly.",
	alternates: { canonical: "/concepts/capabilities" },
};

const TOC = [
	{ id: "shape", title: "The shape" },
	{ id: "naming", title: "Naming rules" },
	{ id: "schemas", title: "Schemas" },
	{ id: "versions", title: "Versions" },
	{ id: "descriptions", title: "Writing descriptions" },
	{ id: "one-to-one", title: "One capability, one action" },
];

export default function CapabilitiesPage() {
	return (
		<DocPage
			path="/concepts/capabilities"
			eyebrow="Concepts"
			lead="A capability is one thing your product can do, described precisely enough that a model can decide when to call it and what to pass."
			title="Capabilities"
			toc={TOC}
		>
			<H2 id="shape">The shape</H2>
			<P>
				A registration is two objects. The first describes the capability and is
				published to Cheela. The second implements it and never leaves your
				infrastructure.
			</P>

			<CodeBlock filename=".cheela/runtime.ts">{`runtime.register(
  {
    // Published — this is what the model sees.
    name: "catalog-search",
    description: "Searches the product catalog by free text",
    version: "1.2.0",
    input: z.object({
      query: z.string(),
      limit: z.number().int().max(50).default(10),
    }),
    output: z.object({ products: z.array(productSchema) }),
  },
  {
    // Private — this runs on your server.
    name: "search",
    async handler(context, input) {
      return { products: await catalog.search(input.query, input.limit) };
    },
  },
);`}</CodeBlock>

			<P>
				The split matters. Everything in the first object is a public contract:
				it goes into the deployment, gets handed to the model as a tool
				definition, and — if you publish a manifest — becomes readable by
				strangers. The second object is yours.
			</P>

			<H2 id="naming">Naming rules</H2>
			<P>
				Capability names must match{" "}
				<Code>^[A-Za-z][A-Za-z0-9-]{"{0,63}"}$</Code>: start with a letter, then
				letters, digits, and hyphens, up to 64 characters.
			</P>
			<P>
				That is narrower than it looks, because it is the intersection of two
				rules that do not overlap:
			</P>
			<UL>
				<LI>
					<Strong>Tool-calling APIs</Strong> require{" "}
					<Code>^[a-zA-Z0-9_-]{"{1,64}"}$</Code>. A dot is rejected outright —
					OpenAI and every OpenAI-compatible endpoint answers 400 rather than
					ignoring it. A name the model cannot be given is a capability that can
					never be invoked.
				</LI>
				<LI>
					<Strong>The Agent Discovery Specification</Strong> builds published
					names as <Code>namespace.capability</Code>, and each segment must
					match <Code>[A-Za-z][A-Za-z0-9-]{"{0,63}"}</Code>. Underscores are not
					permitted.
				</LI>
			</UL>
			<P>
				Hyphens are the only separator that satisfies both.{" "}
				<Code>catalog-search</Code> is legal; <Code>catalog.search</Code> fails
				the first rule and <Code>catalog_search</Code> the second. The dots the
				discovery spec wants come from your namespace in{" "}
				<Code>cheela.config.ts</Code>, not from the capability name.
			</P>

			<Callout title="Rejected at registration, not at execution" tone="note">
				<p>
					<Code>Runtime.register()</Code> throws on a bad name immediately, and
					the error names the offending character and suggests a replacement.
					The alternative is a provider 400 on your first real execution — long
					after the name has been published in a manifest that strangers may
					already have cached.
				</p>
			</Callout>

			<H2 id="schemas">Schemas</H2>
			<P>
				<Code>input</Code> and <Code>output</Code> accept anything with a{" "}
				<Code>parse(value)</Code> method, which is the whole <Code>Schema</Code>{" "}
				interface. Zod satisfies it; so does anything you write yourself.
			</P>
			<CodeBlock label="TypeScript">{`export interface Schema<T> {
  parse(value: unknown): T;
}`}</CodeBlock>
			<P>Schemas do three separate jobs:</P>
			<Table
				headers={["Job", "When"]}
				rows={[
					[
						"Tell the model",
						"Serialized to JSON Schema at deploy time and attached to the tool definition.",
					],
					[
						"Validate input",
						"Before your handler runs. A bad shape fails the call, not your code.",
					],
					[
						"Validate output",
						"After your handler returns, before the result goes back to the model.",
					],
				]}
			/>

			<Callout
				title="A capability with no input schema is advertised as taking no parameters"
				tone="warning"
			>
				<p>
					That is legitimate for something like <Code>store-hours</Code>, and a
					bug for anything else. <Code>cheela deploy</Code> prints a warning
					naming every capability it published without one — check the schema is
					exported and serializable if you see your capability listed.
				</p>
			</Callout>

			<P>
				Generic types are preserved through registration, so <Code>input</Code>{" "}
				in your handler is typed from the schema. You should never need{" "}
				<Code>input as {"{ query: string }"}</Code>.
			</P>

			<H2 id="versions">Versions</H2>
			<P>
				<Code>version</Code> is required by the Agent Discovery Specification
				and therefore by <Code>cheela deploy</Code>, even when a capability has
				no schemas. Use semver, and bump it when the input or output shape
				changes.
			</P>
			<P>
				Deployments are versioned separately and independently: each{" "}
				<Code>cheela deploy</Code> creates a new deployment version covering the
				whole capability set, while a capability&rsquo;s own version describes
				just its contract.
			</P>

			<H2 id="descriptions">Writing descriptions</H2>
			<P>
				The description is not documentation for humans. It is the only thing
				telling a model when to reach for this capability rather than another
				one, so it should read as a decision rule.
			</P>

			<H3>Say when, not just what</H3>
			<UL>
				<LI>
					Weak: <Code>&quot;Order lookup&quot;</Code>
				</LI>
				<LI>
					Better:{" "}
					<Code>
						&quot;Looks up one order by its id. Use when the customer names a
						specific order.&quot;
					</Code>
				</LI>
			</UL>

			<H3>Disambiguate near neighbours</H3>
			<P>
				If you have both <Code>order-status</Code> and{" "}
				<Code>order-history</Code>, each description should say what the other
				one is for. Models pick wrong far more often between two plausible tools
				than between a right one and an irrelevant one.
			</P>

			<H3>Describe fields too</H3>
			<P>
				Field descriptions survive into the JSON Schema the model reads. A{" "}
				<Code>limit</Code> with a documented default and maximum gets passed
				sensibly; a bare <Code>number</Code> gets guessed at.
			</P>

			<H2 id="one-to-one">One capability, one action</H2>
			<P>
				A capability maps to exactly one action. <Code>Runtime.register()</Code>{" "}
				keys on the capability name and dispatch is by that name alone, so a
				second action would have no way of being reached. The deployment API
				accepts at most one and rejects more, rather than silently dropping the
				extras.
			</P>
			<P>
				The action carries the handler, an optional description, and optional{" "}
				<Code>permissions</Code> — string tags checked against the permission
				set the <Code>Runtime</Code> was constructed with.
			</P>
			<CodeBlock label="TypeScript">{`const runtime = new Runtime({ permissions: ["orders:read"] });

runtime.register(capability, {
  name: "lookup",
  permissions: ["orders:read"], // present, so this passes
  handler,
});`}</CodeBlock>
			<P>
				A missing permission throws before the handler runs. This is a local
				guard for your own code — it is not a Cheela-side authorization system,
				and it is not how you protect user data. For that, see{" "}
				<A href="/concepts/end-user-identity">End-user identity</A>.
			</P>
		</DocPage>
	);
}
