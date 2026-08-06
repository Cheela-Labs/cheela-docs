import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	H2,
	H3,
	P,
	Strong,
	Table,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Embed chat",
	description:
		"Put a Cheela chat widget on a page — React components, a custom element, or one script tag with no build step.",
	alternates: { canonical: "/guides/embedding-chat" },
};

const TOC = [
	{ id: "key", title: "Use the public key" },
	{ id: "react", title: "React" },
	{ id: "custom-element", title: "Custom element" },
	{ id: "script", title: "One script tag" },
	{ id: "signed-in", title: "Signed-in visitors" },
	{ id: "styling", title: "Styling" },
	{ id: "headless", title: "Building your own UI" },
	{ id: "origins", title: "Lock it to your domain" },
];

export default function EmbeddingChatPage() {
	return (
		<DocPage
			path="/guides/embedding-chat"
			eyebrow="Guides"
			lead="Three ways to put a chat interface on a page, from a React component tree down to a single script tag. All three call the same endpoint with the same key."
			title="Embed chat"
			toc={TOC}
		>
			<H2 id="key">Use the public key</H2>
			<P>
				Every embed below authenticates with the runtime&rsquo;s{" "}
				<Strong>public</Strong> key — the one starting <Code>ch_pk_</Code>. It
				is embeddable by design and can do exactly one thing: execute.
			</P>
			<Callout title="Never the deploy key" tone="danger">
				<p>
					<Code>ch_sk_…</Code> authorises <Code>cheela deploy</Code>. Putting it
					in page source lets anyone overwrite your runtime&rsquo;s capability
					set. The two keys exist separately so that the page can be safe.
				</p>
			</Callout>

			<H2 id="react">React</H2>
			<CodeBlock label="Terminal">{`npm install @cheela/ui`}</CodeBlock>
			<CodeBlock filename="app/page.tsx">{`import { Chat, CheelaProvider } from "@cheela/ui";

export default function Page() {
  return (
    <div style={{ height: 480 }}>
      <CheelaProvider apiKey={process.env.NEXT_PUBLIC_CHEELA_PUBLIC_KEY!}>
        <Chat placeholder="Ask me anything..." />
      </CheelaProvider>
    </div>
  );
}`}</CodeBlock>
			<P>
				In the Next.js App Router this works from a Server Component with no{" "}
				<Code>&quot;use client&quot;</Code> of your own — the boundary is drawn
				at <Code>@cheela/ui</Code>&rsquo;s own client modules. The{" "}
				<Code>NEXT_PUBLIC_</Code> prefix says out loud that the value reaches
				the browser, which for this key is fine.
			</P>
			<P>
				<Code>Chat</Code> reads its client from context and never takes an{" "}
				<Code>apiKey</Code> directly, so several <Code>{"<Chat/>"}</Code>{" "}
				instances can share one provider without re-authenticating.
			</P>

			<H3>Reacting to messages</H3>
			<CodeBlock label="TypeScript">{`<Chat
  initialMessages={saved}
  onMessage={(message) => persist(message)}
  onError={(error) => toast(error.message)}
  renderMessage={(message) => <MyBubble message={message} />}
/>`}</CodeBlock>
			<P>
				<Code>onMessage</Code> fires once per finished assistant message, not
				once per streamed token.
			</P>

			<H2 id="custom-element">Custom element</H2>
			<P>
				For pages that are not React. The element registers itself on import.
			</P>
			<CodeBlock label="HTML">{`<script type="module" src="/path/to/cheela-chat.js"></script>

<cheela-chat
  api-key="ch_pk_..."
  theme="auto"
  placeholder="Ask me anything..."
></cheela-chat>`}</CodeBlock>
			<Table
				headers={["Attribute", "Values"]}
				rows={[
					["api-key", "The runtime public key. Required."],
					["base-url", "Override the control plane host. Rarely needed."],
					["theme", "light, dark, or auto"],
					["placeholder", "Input placeholder text"],
				]}
			/>
			<P>
				Attributes are live — changing one reconfigures the mounted widget
				rather than remounting it. There is also a programmatic equivalent:
			</P>
			<CodeBlock label="JavaScript">{`document.querySelector("cheela-chat").configure({
  theme: "dark",
  placeholder: "How can we help?",
});`}</CodeBlock>

			<H2 id="script">One script tag</H2>
			<P>
				No bundler, no module system, no build step. The loader script defines
				the element and fetches its core chunk only when one mounts.
			</P>
			<CodeBlock filename="index.html">{`<div id="chat-root"></div>

<script src="https://unpkg.com/@cheela/web-component/dist/cheela-chat.js"></script>
<script>
  window.Cheela.init(document.getElementById("chat-root"), {
    apiKey: "ch_pk_...",
    placeholder: "Ask me anything...",
  });
</script>`}</CodeBlock>
			<P>
				A working page is in{" "}
				<A href="https://github.com/Cheela-Labs/platform/tree/main/examples/web-component-static">
					examples/web-component-static
				</A>
				— plain HTML, served as-is.
			</P>

			<H2 id="actions">Buttons, not links in prose</H2>
			<P>
				A capability that creates a checkout returns a URL. Left to the model,
				that URL reaches the shopper only if it chooses to repeat it — and
				models mangle long signed URLs. Return an action instead and the widget
				renders a button, every time, without the model involved in the
				presentation.
			</P>
			<CodeBlock filename="capability handler">{`return {
  orderId: order.id,
  total: order.amount,
  cheela: {
    actions: [
      {
        type: "link",
        label: \`Pay ₹\${order.amount / 100}\`,
        url: order.checkoutUrl,
        style: "primary",
      },
    ],
  },
};`}</CodeBlock>
			<P>
				Everything outside <Code>cheela</Code> is yours and reaches the model
				unchanged, so the assistant can still say what it did. The model decides{" "}
				<em>whether</em> to call the capability; the UI decides how the result
				looks.
			</P>
			<P>
				This is how payment works on Cheela. Your runtime creates the checkout
				with your own payment provider and your own key, and returns the link.
				No card details ever pass through Cheela, the model, or the
				conversation.
			</P>
			<Callout title="Only https:// links render" tone="note">
				<p>
					The output is written by your runtime and rendered inside your
					visitor&rsquo;s browser, so a <Code>javascript:</Code> URL there would
					be stored XSS on your own domain. Anything that is not{" "}
					<Code>https:</Code> is dropped, along with malformed entries, and at
					most five actions render per result.
				</p>
			</Callout>

			<H2 id="signed-in">Signed-in visitors</H2>
			<P>
				If any capability is marked <Code>requiresEndUser</Code>, the widget has
				to pass the visitor&rsquo;s credential. Give it a function, not a
				string:
			</P>
			<CodeBlock label="TypeScript">{`<CheelaProvider
  apiKey={publicKey}
  endUserToken={() => session?.accessToken}
>
  <Chat />
</CheelaProvider>`}</CodeBlock>
			<P>
				A shopper can sign in long after the widget mounted, and a value read
				once would pin whatever was true then. Returning <Code>undefined</Code>{" "}
				is correct for a signed-out visitor — capabilities requiring a user then
				refuse to run, which is the point.
			</P>
			<P>
				Passing an inline arrow does not rebuild the client or drop the
				conversation; the provider holds it behind a stable wrapper. Full detail
				in <A href="/concepts/end-user-identity">End-user identity</A>.
			</P>

			<H2 id="styling">Styling</H2>
			<P>
				Components carry stable class names — <Code>cheela-chat</Code>,{" "}
				<Code>cheela-chat__error</Code>, and equivalents on the primitives — and
				ship no opinionated CSS beyond layout. Style them from your own
				stylesheet, or pass <Code>className</Code>.
			</P>
			<CodeBlock label="CSS">{`.cheela-chat {
  height: 100%;
  border: 1px solid var(--line);
  border-radius: 12px;
}`}</CodeBlock>
			<P>
				<Code>theme</Code> accepts <Code>light</Code>, <Code>dark</Code> or{" "}
				<Code>auto</Code>; the resolved value lands on a{" "}
				<Code>data-cheela-theme</Code> attribute you can target.
			</P>

			<H2 id="headless">Building your own UI</H2>
			<P>
				Two levels below <Code>{"<Chat/>"}</Code>. Use the hook to keep the
				state machine and write your own markup:
			</P>
			<CodeBlock label="TypeScript">{`import { useCheelaChat } from "@cheela/ui";

function MyChat() {
  const { messages, status, error, sendMessage } = useCheelaChat();
  // your markup
}`}</CodeBlock>
			<P>
				Or drop React entirely and use <Code>@cheela/client</Code>, which is
				framework-agnostic: an <Code>ExecutionClient</Code>, a{" "}
				<Code>ConversationStore</Code>, an event emitter, and a markdown parser.
			</P>
			<CodeBlock label="TypeScript">{`import { ExecutionClient, ConversationStore } from "@cheela/client";

const client = new ExecutionClient({ apiKey: "ch_pk_..." });
const store = new ConversationStore();`}</CodeBlock>

			<H2 id="origins">Lock it to your domain</H2>
			<P>
				A public key in public HTML can be copied into someone else&rsquo;s
				page. An origin allowlist stops browsers using it from anywhere but your
				sites:
			</P>
			<CodeBlock label="Terminal">{`curl -X PUT https://api.cheelalabs.com/v1/runtimes/$RUNTIME_ID/allowed-origins \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "origins": ["https://www.example.com", "https://app.example.com"] }'`}</CodeBlock>
			<P>
				Bare origins only — no trailing slash, no path. An entry with a path can
				never equal a browser&rsquo;s <Code>Origin</Code> header, so it is
				rejected rather than silently matching nothing.
			</P>
			<Callout title="An allowlist is not a secret" tone="note">
				<p>
					It constrains browsers, which send <Code>Origin</Code> honestly. It
					does not constrain <Code>curl</Code>. Rate limits and quota are what
					bound abuse from a non-browser caller.
				</p>
			</Callout>
		</DocPage>
	);
}
