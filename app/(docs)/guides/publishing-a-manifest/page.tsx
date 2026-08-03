import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	H2,
	LI,
	OL,
	P,
	Strong,
	Table,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Publish a manifest",
	description:
		"Publish an Agent Discovery Specification manifest so other people's agents can find and call your capabilities.",
	alternates: { canonical: "/guides/publishing-a-manifest" },
};

const TOC = [
	{ id: "what", title: "What publishing does" },
	{ id: "config", title: "Describe who you are" },
	{ id: "pull", title: "Pull the manifest" },
	{ id: "serve", title: "Serve it" },
	{ id: "shape", title: "What the document contains" },
	{ id: "safety", title: "Before you publish" },
	{ id: "changing", title: "Changing a published capability" },
];

export default function PublishingAManifestPage() {
	return (
		<DocPage
			eyebrow="Guides"
			lead="A manifest is a public document describing what your product can do and where to call it. Publish one and any agent that reads it can use your capabilities without touching your UI."
			title="Publish a manifest"
			toc={TOC}
		>
			<H2 id="what">What publishing does</H2>
			<P>
				Everything so far assumed <em>you</em> drive the model. A manifest
				inverts that: someone else&rsquo;s agent reads a document at your
				domain, learns your capabilities and their schemas, and calls them
				directly.
			</P>
			<P>
				Cheela implements the{" "}
				<A href="https://github.com/Cheela-Labs/platform/tree/main/packages/adp">
					Agent Discovery Specification
				</A>
				. The document is served from the control plane, built from your latest
				deployment, and republished on your own domain — conventionally at{" "}
				<Code>/.well-known/agent-discovery.json</Code>.
			</P>

			<Callout title="Addresses point at Cheela, not at you" tone="note">
				<p>
					Every capability address in the manifest resolves to Cheela&rsquo;s
					public broker. Your own endpoint only accepts signed requests from
					Cheela, so advertising it directly would publish a door nobody can
					open.
				</p>
			</Callout>

			<H2 id="config">Describe who you are</H2>
			<P>
				The manifest has to say who operates the system. Two config blocks
				supply it, and a deployment carrying neither cannot produce a manifest
				at all.
			</P>
			<CodeBlock filename="cheela.config.ts">{`export default defineConfig({
  apiKey: process.env.CHEELA_API_KEY!,
  endpoint: "https://app.example.com/cheela/execute",

  // Describes your product, not Cheela.
  website: {
    name: "Acme Storefront",
    description: "Order lookup and catalog search for Acme.",
    url: "https://www.acme.com",
    contact: "support@acme.com",
  },

  adp: {
    // Reverse-DNS style. Published names become "com.acme.catalog-search".
    namespace: "com.acme",
  },
});`}</CodeBlock>
			<P>
				The namespace supplies the dots the specification requires — which is
				why capability names themselves may not contain any. Deploy after
				changing either block; the control plane cannot read your config file,
				so these travel with the deployment.
			</P>

			<H2 id="pull">Pull the manifest</H2>
			<CodeBlock label="Terminal">{`npx cheela manifest pull --runtime rt_8f2a`}</CodeBlock>
			<CodeBlock label="Output">{`Cheela Manifest

✓ Fetched manifest for rt_8f2a
✓ 4 capabilities
✓ Wrote public/.well-known/agent-discovery.json`}</CodeBlock>
			<P>
				The default output path suits most frontends. Override it with{" "}
				<Code>--out</Code>:
			</P>
			<CodeBlock label="Terminal">{`npx cheela manifest pull --runtime rt_8f2a --out static/.well-known/agent-discovery.json`}</CodeBlock>
			<P>
				This command needs no config file, no runtime module, and no credential.
				That is deliberate: it runs in your frontend&rsquo;s build, which is
				often a different repository from the one holding your capabilities.
			</P>

			<H2 id="serve">Serve it</H2>
			<P>
				The file needs to be reachable at a stable, conventional path on your
				own domain. In most frameworks, writing it into the static directory is
				enough.
			</P>
			<CodeBlock filename="package.json">{`{
  "scripts": {
    "prebuild": "cheela manifest pull --runtime rt_8f2a"
  }
}`}</CodeBlock>
			<P>
				Wiring it into <Code>prebuild</Code> means every deploy of your frontend
				republishes the current capability set, so the document cannot drift
				away from what actually serves.
			</P>
			<P>
				The control plane serves it with a short cache window — a redeploy is
				visible to anyone pulling again without waiting out a long TTL.
			</P>

			<H2 id="shape">What the document contains</H2>
			<CodeBlock filename="agent-discovery.json">{`{
  "specVersion": "...",
  "id": "com.acme",
  "name": "Acme Storefront",
  "description": "Order lookup and catalog search for Acme.",
  "provider": {
    "name": "Acme Storefront",
    "url": "https://www.acme.com",
    "contact": "support@acme.com"
  },
  "capabilities": [
    {
      "name": "com.acme.catalog-search",
      "version": "1.2.0",
      "description": "Searches the product catalog by free text",
      "inputSchema": { "...": "..." },
      "outputSchema": { "...": "..." },
      "endpoint": {
        "transport": "http",
        "address": "https://api.cheelalabs.com/v1/capabilities/rt_8f2a/catalog-search",
        "auth": "none"
      }
    }
  ],
  "lastUpdated": "..."
}`}</CodeBlock>
			<P>
				Note <Code>provider</Code> here means &ldquo;who operates this
				system&rdquo; — you — not a model provider.
			</P>

			<H2 id="safety">Before you publish</H2>
			<P>
				Publishing makes every deployed capability callable by strangers. Walk
				the list once, deliberately.
			</P>
			<OL>
				<LI>
					<Strong>
						Anything acting for a person needs <Code>requiresEndUser</Code>.
					</Strong>{" "}
					Without it, a capability reading someone&rsquo;s records is callable
					by anyone. With it, anonymous calls are refused before they are
					metered.
				</LI>
				<LI>
					<Strong>No capability should take an identity as input.</Strong> A
					caller writing the input directly picks whose data to read.
				</LI>
				<LI>
					<Strong>Check the schemas.</Strong> They are a public contract now.
					Anything you left loose will be called with things you did not expect.
				</LI>
				<LI>
					<Strong>Check the descriptions.</Strong> They are read by agents whose
					prompts you will never see, so they must stand on their own.
				</LI>
				<LI>
					<Strong>Know your quota.</Strong> Anonymous traffic spends the
					owner&rsquo;s allowance. It draws on a sub-allowance so it cannot
					starve your own widget, but it is still your quota.
				</LI>
			</OL>

			<Callout title="A wrong manifest is expensive to retract" tone="warning">
				<p>
					It gets cached and republished by agents you cannot contact. The
					control plane refuses to serve one whose addresses would not resolve,
					for the same reason — a missing manifest costs a wait; a wrong one
					costs indefinitely.
				</p>
			</Callout>

			<H2 id="changing">Changing a published capability</H2>
			<Table
				headers={["Change", "How to do it safely"]}
				rows={[
					[
						"Add a capability",
						"Deploy, then pull and republish. Nothing breaks; agents discover it on their next read.",
					],
					[
						"Widen a schema",
						"Safe. Make new fields optional so existing callers stay valid.",
					],
					[
						"Narrow a schema",
						"Breaking. Bump the capability version and expect a period where both shapes arrive.",
					],
					[
						"Rename",
						"Breaking — the address changes. Publish the new name alongside the old one, then deprecate.",
					],
					[
						"Remove",
						"Mark deprecated first. The spec carries deprecatedSince and removalNotBefore for this.",
					],
				]}
			/>
			<P>
				A stranger&rsquo;s agent has no way to know you changed anything until
				it pulls again. Treat the manifest like a public API, because that is
				what it is.
			</P>
			<P>
				Types and validation for the document itself live in{" "}
				<Code>@cheela/adp</Code>, if you want to check one in your own build.
			</P>
		</DocPage>
	);
}
