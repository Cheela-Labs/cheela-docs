import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	H2,
	LI,
	P,
	Property,
	PropertyList,
	Strong,
	UL,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Configuration",
	description:
		"Every field in cheela.config.ts, what it does, and the two fields that deliberately do not exist.",
	alternates: { canonical: "/reference/configuration" },
};

const TOC = [
	{ id: "file", title: "The file" },
	{ id: "apiKey", title: "apiKey" },
	{ id: "endpoint", title: "endpoint" },
	{ id: "runtime", title: "runtime" },
	{ id: "website", title: "website" },
	{ id: "adp", title: "adp" },
	{ id: "generators", title: "generators" },
	{ id: "absent", title: "Fields that do not exist" },
];

export default function ConfigurationPage() {
	return (
		<DocPage
			path="/reference/configuration"
			eyebrow="Reference"
			lead="cheela.config.ts is evaluated through tsx at deploy time, after .env is loaded. defineConfig is a type helper with no hidden behaviour."
			title="Configuration"
			toc={TOC}
		>
			<H2 id="file">The file</H2>
			<CodeBlock filename="cheela.config.ts">{`import { defineConfig } from "@cheela/cli";

export default defineConfig({
  apiKey: process.env.CHEELA_API_KEY!,
  endpoint: "https://app.example.com/cheela/execute",
  runtime: ".cheela/runtime.ts",

  website: {
    name: "Acme Storefront",
    description: "Order lookup and catalog search for Acme.",
    url: "https://www.acme.com",
    contact: "support@acme.com",
  },

  adp: {
    namespace: "com.acme",
  },

  generators: {
    disabled: [],
  },
});`}</CodeBlock>
			<P>
				It must default-export the config object. Validation failures list every
				failing field with its own message rather than stopping at the first.
			</P>

			<H2 id="apiKey">apiKey</H2>
			<PropertyList>
				<Property name="apiKey" required type="string">
					<p>
						The runtime&rsquo;s <Strong>deploy key</Strong>, starting{" "}
						<Code>ch_sk_</Code>. Authorises <Code>cheela deploy</Code> and{" "}
						<Code>cheela status</Code>.
					</p>
					<p>
						Read it from the environment. Committing it lets anyone overwrite
						your runtime&rsquo;s capability set.
					</p>
				</Property>
			</PropertyList>
			<CodeBlock label="TypeScript">{`apiKey: process.env.CHEELA_API_KEY!,`}</CodeBlock>

			<H2 id="endpoint">endpoint</H2>
			<PropertyList>
				<Property name="endpoint" type="string">
					<p>
						The public HTTPS address where this runtime serves capability calls,
						e.g. <Code>https://app.example.com/cheela/execute</Code>. Published
						with the deployment.
					</p>
					<p>
						Optional here only because passing <Code>endpoint</Code> to{" "}
						<Code>POST /v1/runtimes</Code> at registration is the alternative. A
						runtime with neither cannot receive capability requests.
					</p>
				</Property>
			</PropertyList>
			<P>
				Must be an absolute URL using <Code>https://</Code>.{" "}
				<Code>http://</Code> is accepted only for <Code>localhost</Code>,{" "}
				<Code>127.0.0.1</Code>, and <Code>[::1]</Code>.
			</P>
			<Callout title="Why https is enforced" tone="warning">
				<p>
					The request signature protects integrity, not confidentiality.
					Capability inputs, outputs, and the end user&rsquo;s credential travel
					in the request body. For a local runtime, use a tunnel rather than
					plain HTTP.
				</p>
			</Callout>

			<H2 id="runtime">runtime</H2>
			<PropertyList>
				<Property
					defaultValue={`".cheela/runtime.ts"`}
					name="runtime"
					type="string"
				>
					<p>
						Path to the module exporting your <Code>Runtime</Code>, relative to
						the project root.
					</p>
					<p>
						The module must default-export a <Code>Runtime</Code>, or export one
						named <Code>runtime</Code>. Anything else fails with a message
						naming the path it tried.
					</p>
				</Property>
			</PropertyList>

			<H2 id="website">website</H2>
			<P>
				Descriptive information about <Strong>your</Strong> product, used to
				build the public capability manifest. Required if you publish one.
			</P>
			<PropertyList>
				<Property name="website.name" required type="string">
					<p>Your product&rsquo;s name, as it should appear to other agents.</p>
				</Property>
				<Property name="website.description" type="string">
					<p>One line on what this runtime does.</p>
				</Property>
				<Property name="website.url" type="string">
					<p>Your product&rsquo;s homepage. Must be a valid URL.</p>
				</Property>
				<Property name="website.contact" type="string">
					<p>
						How to reach you about the capabilities — usually an email address.
					</p>
				</Property>
			</PropertyList>
			<P>
				This maps to the manifest&rsquo;s <Code>provider</Code> block, where
				&ldquo;provider&rdquo; means who operates the system. It has nothing to
				do with model providers.
			</P>

			<H2 id="adp">adp</H2>
			<P>Agent Discovery Specification settings.</P>
			<PropertyList>
				<Property name="adp.namespace" required type="string">
					<p>
						Reverse-DNS style prefix, e.g. <Code>com.acme</Code>. Published
						capability names are built as <Code>namespace.capability</Code>.
					</p>
					<p>
						Required if the <Code>adp</Code> block is present at all. This is
						where the dots the specification needs come from — capability names
						themselves may not contain any.
					</p>
				</Property>
				<Property name="adp.id" type="string">
					<p>
						Manifest identity. Defaults to <Code>namespace</Code>, which is
						almost always what you want.
					</p>
				</Property>
			</PropertyList>
			<Callout title="There is no endpoint field here" tone="note">
				<p>
					The address the world calls to reach a capability is the
					broker&rsquo;s, and only the control plane knows it. Asking for it
					produced manifests advertising placeholder addresses, because it reads
					like the top-level <Code>endpoint</Code> above — which points the
					opposite way.
				</p>
			</Callout>

			<H2 id="generators">generators</H2>
			<PropertyList>
				<Property name="generators.disabled" type="string[]">
					<p>
						Built-in generators to skip, by name:{" "}
						<Code>capability-manifest</Code>, <Code>runtime-manifest</Code>,{" "}
						<Code>openapi</Code>, <Code>adp</Code>.
					</p>
				</Property>
				<Property name="generators.custom" type="Generator[]">
					<p>
						Additional generators, appended to the built-ins rather than
						replacing them.
					</p>
					<p>
						Each needs a <Code>name</Code>, an <Code>inputs()</Code> function
						used for cache invalidation, and a <Code>generate()</Code> function
						returning files. A name colliding with an existing generator is an
						error, not an override.
					</p>
				</Property>
			</PropertyList>
			<CodeBlock label="TypeScript">{`generators: {
  disabled: ["openapi"],
  custom: [
    {
      name: "typed-client",
      inputs: (context) => context.capabilities.map((c) => c.capability.name),
      generate: (context) => [
        { path: "typed-client/client.ts", contents: render(context.capabilities) },
      ],
    },
  ],
},`}</CodeBlock>
			<P>
				Functions are not schema-validatable data, so custom generators are
				structurally checked at load time instead — a value that is not
				generator-shaped is rejected with a message saying which methods were
				missing.
			</P>

			<H2 id="absent">Fields that do not exist</H2>
			<P>
				Two are conspicuously missing, and both were removed rather than never
				added.
			</P>
			<UL>
				<LI>
					<Strong>
						<Code>provider</Code> and <Code>model</Code>.
					</Strong>{" "}
					Executions run on Cheela&rsquo;s own OpenRouter credential so tokens
					can be metered and billed. A runtime choosing its own model would be
					choosing how much Cheela pays. The registration API rejects these too,
					rather than accepting a live credential and silently dropping it.
				</LI>
				<LI>
					<Strong>
						<Code>tier</Code>.
					</Strong>{" "}
					Your plan is a billing fact about your account, not something a
					deployment request gets to assert.
				</LI>
			</UL>
			<P>
				Older examples may still show <Code>provider</Code> and{" "}
				<Code>model</Code> in a config block. They are no longer valid — remove
				them. See <A href="/concepts/architecture">Architecture</A> for why.
			</P>
		</DocPage>
	);
}
