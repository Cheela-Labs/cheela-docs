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
	{ id: "actions", title: "Buttons, not links in prose" },
	{ id: "replies", title: "Letting the visitor answer" },
	{ id: "cards", title: "Showing products" },
	{ id: "pending", title: "Waiting for the payment to land" },
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
				A live one is running at{" "}
				<A href="https://demo-store.cheelalabs.com">demo-store</A>. Note that
				its panel does <em>not</em> use the snippet above:{" "}
				<Code>&lt;cheela-chat&gt;</Code> renders into a shadow root with its own
				styling, so the storefront imports{" "}
				<Code>@cheela/web-component/headless</Code> instead and draws its own
				surface against that state. Reach for the script tag when you want the
				chat to look like Cheela's, and the headless entry point when it has to
				look like yours.
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

			<H2 id="replies">Letting the visitor answer</H2>
			<P>
				A <Code>link</Code> action sends someone out of the conversation. A{" "}
				<Code>reply</Code> action keeps them in it. Pressing one submits a turn
				on their behalf, exactly as if they had typed it — so a capability can
				offer the four sizes it actually has in stock instead of hoping the
				model recognises &ldquo;the 42 one&rdquo; in free text.
			</P>
			<CodeBlock filename="capability handler">{`return {
  orderId: order.id,
  cheela: {
    actions: [
      {
        type: "reply",
        label: "Yes, cancel it",
        value: \`cancel order \${order.id}\`,
        style: "primary",
      },
      { type: "reply", label: "No, keep it" },
      { type: "link", label: "View order", url: order.url },
    ],
  },
};`}</CodeBlock>
			<P>
				<Code>label</Code> is what the visitor reads; <Code>value</Code> is what
				the model receives. Splitting them is what lets a button read{" "}
				<Code>Yes, cancel it</Code> while the turn says{" "}
				<Code>cancel order ord_1042</Code> — unambiguous on its own, with no
				dependency on what the button happened to sit underneath. Leave{" "}
				<Code>value</Code> out and the label is used, which is usually what you
				want for a plain <Code>No, keep it</Code>.
			</P>
			<P>
				Both kinds live in the same <Code>actions</Code> array and render in the
				order you return them, so one result can offer a choice and a way out of
				it at the same time. Replies count against the same limit of five.
			</P>
			<Callout title="A reply is billed like anything else typed" tone="note">
				<p>
					<Code>value</Code> is submitted verbatim as the next turn, so it
					becomes input tokens you pay for. Anything longer than 512 characters
					is dropped rather than shortened — half of{" "}
					<Code>cancel order ord_1042</Code> is a different instruction. A{" "}
					<Code>value</Code> that is present but is not a string is refused for
					the same reason, rather than quietly falling back to the label.
				</p>
			</Callout>

			<H2 id="cards">Showing products</H2>
			<P>
				The same argument, for things people look at before they buy them. A
				capability that searches your catalogue returns products, and left to
				the model the shopper gets a paragraph about them: no picture, and
				prices retyped from memory. Return <Code>cards</Code> and the widget
				renders them.
			</P>
			<CodeBlock filename="capability handler">{`return {
  queryId: results.id,
  cheela: {
    cards: results.items.map((item) => ({
      type: "product",
      title: item.name,
      price: \`₹\${item.price / 100}\`,
      description: item.summary,
      image: { url: item.imageUrl, alt: item.imageAlt },
      url: item.pageUrl,
    })),
    actions: [
      { type: "link", label: "See all", url: results.allUrl },
    ],
  },
};`}</CodeBlock>
			<P>
				Only <Code>type</Code> and <Code>title</Code> are required — a card with
				no picture, price or link still renders. <Code>price</Code> is a string
				you have already formatted, because your runtime knows the currency and
				the locale and the widget knows neither.
			</P>
			<Callout title="Cards and actions travel together" tone="note">
				<p>
					One result can return both: a shortlist of cards and a button to see
					the rest. Image and link URLs get the same <Code>https:</Code>
					-only treatment as actions, and the damage from a bad one is kept as
					small as it can be — a rejected image costs the card its picture, not
					the card, and a rejected card costs you that card, not the reply. At
					most six cards render per result.
				</p>
			</Callout>

			<H2 id="pending">Waiting for the payment to land</H2>
			<P>
				The button sends the shopper to your checkout, and until they come back
				the conversation has nothing to say. Add a <Code>pending</Code> spec and
				the widget watches for you: it re-calls a capability of yours until that
				capability reports the work is finished, then hands the result to the
				model so it can carry on.
			</P>
			<CodeBlock filename="capability handler">{`return {
  orderId: order.id,
  cheela: {
    actions: [
      { type: "link", label: \`Pay ₹\${order.amount / 100}\`, url: order.checkoutUrl },
    ],
    pending: {
      capability: "order-status",
      input: { orderId: order.id },
      intervalMs: 3000,
      timeoutMs: 900000,
    },
  },
};`}</CodeBlock>
			<P>
				The capability being watched answers in your own vocabulary and says
				outright whether it is done:
			</P>
			<CodeBlock filename="order-status handler">{`const order = await db.orders.findById(input.orderId);

return {
  status: order.status,
  amount: order.amount,
  cheela: { settled: order.status === "paid" },
};`}</CodeBlock>
			<P>
				That is the whole integration. There is no webhook to register with
				Cheela, no payment credential to hand over, no change to your checkout
				page or its redirect URLs, and no payment SDK in the shopper&rsquo;s
				browser. You already have a row that flips when money arrives; this
				reads it.
			</P>
			<P>
				<Code>settled</Code> is your word, never ours — we do not inspect{" "}
				<Code>status</Code> or try to guess which of your states means done.
				That is also why this is not a payment feature: the same spec waits on a
				KYC check, a human approval, or any slow job.
			</P>
			<UL>
				<LI>
					Polling happens in the visitor&rsquo;s browser and wakes as soon as
					they return to the tab, so coming back from checkout resolves at once
					rather than waiting out the interval.
				</LI>
				<LI>
					<Code>intervalMs</Code> has a floor of one second and{" "}
					<Code>timeoutMs</Code> a ceiling of fifteen minutes. Each poll is
					metered as one capability call with zero tokens.
				</LI>
				<LI>
					A poll that fails is retried until the deadline; a visitor who types
					something abandons the wait.
				</LI>
				<LI>
					On timeout the model is told the work never settled, so it can offer
					to check again instead of going silent.
				</LI>
			</UL>
			<Callout title="The result reaches the model as a tool call" tone="note">
				<p>
					Not as a message from the visitor. The poll really did call your
					capability, so it enters the transcript as an ordinary tool call and
					result — the model reads it as something it observed, not as an
					unverified claim that someone paid.
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
			<P>
				The custom element is different: its Shadow DOM is what stops a host
				page&rsquo;s CSS leaking in, which also stops yours reaching the widget.
				Two supported ways in, both from your own stylesheet — the{" "}
				<Code>--cheela-*</Code> custom properties, and <Code>::part()</Code> for
				anything a variable cannot express.
			</P>
			<CodeBlock label="CSS">{`cheela-chat {
  --cheela-color-accent: #6d28d9;
}

cheela-chat::part(message--user) { border-radius: 4px }
cheela-chat::part(action--primary) { background: #111; color: #fff }`}</CodeBlock>
			<P>
				Parts: <Code>container</Code>, <Code>messages</Code>,{" "}
				<Code>message</Code>, <Code>message--user</Code>,{" "}
				<Code>message--assistant</Code>, <Code>message--system</Code>,{" "}
				<Code>message--cards</Code>, <Code>empty</Code>, <Code>actions</Code>,{" "}
				<Code>action</Code>, <Code>action--primary</Code>,{" "}
				<Code>action--secondary</Code>, <Code>action--reply</Code>,{" "}
				<Code>action-label</Code>, <Code>action-description</Code>,{" "}
				<Code>cards</Code>, <Code>card</Code>, <Code>card--link</Code>,{" "}
				<Code>card-media</Code>, <Code>card-image</Code>, <Code>card-body</Code>
				, <Code>card-title</Code>, <Code>card-price</Code>,{" "}
				<Code>card-description</Code>, <Code>error</Code>, <Code>form</Code>,{" "}
				<Code>input</Code>, <Code>send</Code>.
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
			<P>
				Outside React, <Code>@cheela/web-component/headless</Code> gives you the
				same conversation plus the DOM builders, and registers no custom
				elements — importing a controller should not silently define three tags
				on your page.
			</P>
			<CodeBlock label="TypeScript">{`import {
  createChatController,
  renderMessage,
} from "@cheela/web-component/headless";

const chat = createChatController({ apiKey: "ch_pk_..." });

chat.subscribe((state) => {
  const bubbles = state.messages
    // Pass the handler through, or reply buttons are left out.
    .map((message) => renderMessage(message, {
      onReply: (value) => chat.sendMessage(value),
      disabled: state.status === "submitting",
    }))
    .filter(Boolean);

  list.replaceChildren(...bubbles);
});

chat.sendMessage("hello");`}</CodeBlock>
			<P>
				Reply buttons need somewhere to send their answer, so{" "}
				<Code>renderMessage</Code> and <Code>createMessageList</Code> take a
				handler. Leave it out and replies are dropped rather than rendered dead
				— links beside them still render, so a missing handler never costs you
				the checkout button.
			</P>
			<P>
				Or keep our parts and arrange them yourself.{" "}
				<Code>{"<cheela-chat-messages>"}</Code> and{" "}
				<Code>{"<cheela-chat-input>"}</Code> find each other by{" "}
				<Code>session</Code> rather than by nesting, so they can sit anywhere in
				your layout and still be one conversation.
			</P>
			<CodeBlock label="HTML">{`<div class="my-layout">
  <cheela-chat-messages session="support" api-key="ch_pk_..."></cheela-chat-messages>

  <!-- your own composer, your own markup -->
  <cheela-chat-input session="support" api-key="ch_pk_..."></cheela-chat-input>
</div>`}</CodeBlock>

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
