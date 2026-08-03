import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import {
	A,
	Callout,
	Code,
	H2,
	H3,
	P,
	Property,
	PropertyList,
	Strong,
	Table,
} from "@/components/docs/content";
import { DocPage } from "@/components/docs/doc-page";

export const metadata: Metadata = {
	title: "Chat packages",
	description:
		"@cheela/client, @cheela/ui, and @cheela/web-component — three layers over the same conversation store.",
	alternates: { canonical: "/reference/chat-packages" },
};

const TOC = [
	{ id: "layers", title: "Three layers" },
	{ id: "ui", title: "@cheela/ui" },
	{ id: "hooks", title: "Hooks" },
	{ id: "client", title: "@cheela/client" },
	{ id: "streaming", title: "Streaming events" },
	{ id: "errors", title: "Errors" },
	{ id: "web-component", title: "@cheela/web-component" },
];

export default function ChatPackagesPage() {
	return (
		<DocPage
			path="/reference/chat-packages"
			eyebrow="Reference"
			lead="Three packages over one conversation store. Pick the layer that matches how much of the UI you want to own."
			title="Chat packages"
			toc={TOC}
		>
			<H2 id="layers">Three layers</H2>
			<Table
				headers={["Package", "You get", "You write"]}
				rows={[
					[
						"@cheela/web-component",
						"A working widget from one HTML tag",
						"Nothing",
					],
					[
						"@cheela/ui",
						"React components and hooks",
						"Layout, or your own markup around the hook",
					],
					[
						"@cheela/client",
						"HTTP client, conversation store, events, markdown parser",
						"All of the UI",
					],
				]}
			/>
			<P>
				<Code>ConversationStore</Code> is the single source of truth all three
				build on — the React hook bridges it through{" "}
				<Code>useSyncExternalStore</Code>, and the custom element wraps the same
				object.
			</P>

			<H2 id="ui">@cheela/ui</H2>
			<CodeBlock label="Terminal">{`npm install @cheela/ui`}</CodeBlock>

			<H3>CheelaProvider</H3>
			<P>
				Holds the client and config. Everything else reads from its context, so
				several chats on a page share one authenticated client.
			</P>
			<PropertyList>
				<Property name="apiKey" required type="string">
					<p>
						The runtime&rsquo;s <Strong>public</Strong> key (
						<Code>ch_pk_…</Code>
						). Never the deploy key.
					</p>
				</Property>
				<Property name="baseUrl" type="string">
					<p>Override the control plane host. Rarely needed.</p>
				</Property>
				<Property
					name="theme"
					type='"light" | "dark" | "auto"'
					defaultValue='"auto"'
				>
					<p>
						Resolved and written to a <Code>data-cheela-theme</Code> attribute
						you can target.
					</p>
				</Property>
				<Property name="metadata" type="Record<string, string>">
					<p>
						Sent with every execution and recorded in traces. No credentials
						here.
					</p>
				</Property>
				<Property
					name="endUserToken"
					type="() => string | undefined | Promise<...>"
				>
					<p>
						Resolves the signed-in visitor&rsquo;s credential per request. Pass
						a function, not a string — a value read once pins whatever was true
						at mount.
					</p>
				</Property>
			</PropertyList>
			<Callout title="Inline arrows are safe" tone="note">
				<p>
					The provider holds <Code>endUserToken</Code> in a ref behind a stable
					wrapper, so passing <Code>{"() => session?.token"}</Code> inline does
					not rebuild the client or drop the conversation on every render.
				</p>
			</Callout>

			<H3>Chat</H3>
			<CodeBlock label="TypeScript">{`<Chat
  initialMessages={saved}
  placeholder="Ask me anything..."
  className="my-chat"
  onMessage={(message) => persist(message)}
  onError={(error) => toast(error.message)}
  renderMessage={(message) => <MyBubble message={message} />}
/>`}</CodeBlock>
			<PropertyList>
				<Property name="initialMessages" type="Message[]">
					<p>Seeds the transcript, for restoring a saved conversation.</p>
				</Property>
				<Property name="placeholder" type="string">
					<p>Input placeholder.</p>
				</Property>
				<Property name="onMessage" type="(message: Message) => void">
					<p>
						Fires once per finished assistant message. Under streaming the
						message is republished on every token at the same index, so this is
						keyed on identity and the store leaving <Code>submitting</Code> —
						not on the message count.
					</p>
				</Property>
				<Property name="onError" type="(error: CheelaClientError) => void">
					<p>Fires once per distinct error.</p>
				</Property>
				<Property name="renderMessage" type="(message: Message) => ReactNode">
					<p>Replaces the default bubble.</p>
				</Property>
			</PropertyList>
			<P>
				<Code>Chat</Code> never takes an <Code>apiKey</Code> — it reads the
				shared client from context.
			</P>

			<H3>Primitives</H3>
			<P>
				Exported so you can rebuild the layout without rebuilding the behaviour:{" "}
				<Code>MessageList</Code>, <Code>MessageBubble</Code>,{" "}
				<Code>ChatInput</Code>, <Code>Markdown</Code>, <Code>Spinner</Code>,
				plus <Code>cn</Code> for class merging.
			</P>

			<H2 id="hooks">Hooks</H2>
			<CodeBlock label="TypeScript">{`import { useCheelaChat } from "@cheela/ui";

function MyChat() {
  const { messages, status, error, sendMessage, reset } = useCheelaChat({
    initialMessages: [],
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); sendMessage(text); }}>
      {/* your markup */}
    </form>
  );
}`}</CodeBlock>
			<Table
				headers={["Returned", "Type"]}
				rows={[
					["messages", "readonly Message[]"],
					["status", '"idle" | "submitting" | "error"'],
					["error", "CheelaClientError | undefined"],
					["sendMessage", "(text: string) => void"],
					["reset", "() => void"],
				]}
			/>
			<P>
				<Code>useCheelaClient()</Code> and <Code>useCheelaConfig()</Code> return
				the context&rsquo;s client and resolved config directly.{" "}
				<Code>useResolvedTheme()</Code> turns <Code>auto</Code> into a concrete
				value.
			</P>

			<H2 id="client">@cheela/client</H2>
			<CodeBlock label="Terminal">{`npm install @cheela/client`}</CodeBlock>
			<P>
				No React, no DOM assumptions. Use it for Vue, Svelte, Solid, a CLI, or a
				server-side integration.
			</P>
			<CodeBlock label="TypeScript">{`import { ExecutionClient, ConversationStore } from "@cheela/client";

const client = new ExecutionClient({
  apiKey: "ch_pk_...",
  endUserToken: () => session?.token,
});

const store = new ConversationStore(client);
const unsubscribe = store.subscribe(() => render(store.getState()));

await store.sendMessage("Where is order 8812?");`}</CodeBlock>

			<H3>ExecutionClient</H3>
			<PropertyList>
				<Property name="apiKey" required type="string">
					<p>The runtime public key.</p>
				</Property>
				<Property name="baseUrl" type="string">
					<p>Control plane host.</p>
				</Property>
				<Property name="endUserToken" type="EndUserTokenProvider">
					<p>Resolved per request. May be sync or async.</p>
				</Property>
				<Property name="fetchImpl" type="typeof fetch">
					<p>
						Injectable, for tests or a non-standard environment. Defaults to
						global <Code>fetch</Code>.
					</p>
				</Property>
			</PropertyList>
			<P>
				<Code>execute()</Code> takes the request body plus an optional{" "}
				<Code>signal</Code> for cancellation.
			</P>

			<H3>ConversationStore</H3>
			<P>
				Owns the transcript and the request lifecycle. It is a plain observable
				— <Code>subscribe</Code>, <Code>getState</Code>,{" "}
				<Code>getServerSnapshot</Code> — which is what lets React consume it
				through <Code>useSyncExternalStore</Code> without a second copy of the
				state.
			</P>
			<CodeBlock label="TypeScript">{`interface ConversationState {
  readonly messages: readonly Message[];
  readonly status: "idle" | "submitting" | "error";
  readonly error?: CheelaClientError;
}`}</CodeBlock>

			<H2 id="streaming">Streaming events</H2>
			<CodeBlock label="TypeScript">{`type ExecutionStreamEvent =
  | { type: "text"; content: string }
  | { type: "capability_start"; capability: string }
  | { type: "capability_end"; capability: string; durationMs: number; error?: string }
  | { type: "done"; result: ExecutionResult };`}</CodeBlock>
			<P>
				<Code>capability_start</Code> and <Code>capability_end</Code> are what
				let a UI say &ldquo;checking your order…&rdquo; while it happens. The
				stream always ends with <Code>done</Code>, including on failure.
			</P>

			<H2 id="errors">Errors</H2>
			<Table
				headers={["Class", "Meaning"]}
				rows={[
					["CheelaClientError", "Base class. Catch this to catch everything."],
					[
						"CheelaNetworkError",
						"The request never completed. Carries the cause.",
					],
					[
						"CheelaAuthError",
						"401 or 403. Wrong key, or a key not valid on this route.",
					],
					["CheelaApiError", "Any other non-2xx. Carries `status`."],
				]}
			/>
			<CodeBlock label="TypeScript">{`import { CheelaAuthError, CheelaClientError } from "@cheela/client";

try {
  await client.execute({ messages });
} catch (error) {
  if (error instanceof CheelaAuthError) {
    // check the key is the ch_pk_ one
  } else if (error instanceof CheelaClientError) {
    // network, or an API error
  }
}`}</CodeBlock>
			<P>
				A <em>failed execution</em> is not an error here — it resolves normally
				with <Code>status: &quot;failed&quot;</Code>. Only transport and auth
				problems throw.
			</P>

			<H2 id="web-component">@cheela/web-component</H2>
			<P>Two builds, for two situations.</P>

			<H3>Script tag</H3>
			<CodeBlock label="HTML">{`<script src="https://unpkg.com/@cheela/web-component/dist/cheela-chat.js"></script>
<cheela-chat api-key="ch_pk_..." theme="auto"></cheela-chat>`}</CodeBlock>
			<P>
				The loader defines the element immediately and fetches the heavier core
				chunk only when one mounts, resolved relative to its own script URL.
			</P>

			<H3>Bundler import</H3>
			<CodeBlock label="TypeScript">{`import "@cheela/web-component";`}</CodeBlock>
			<P>
				This build bundles the core statically. Deferring it is your own
				bundler&rsquo;s dynamic <Code>import()</Code> to make, one level up.
			</P>

			<H3>Attributes and API</H3>
			<Table
				headers={["Attribute", "Notes"]}
				rows={[
					["api-key", "Required. The public key."],
					["base-url", "Control plane host."],
					["theme", "light, dark, or auto"],
					["placeholder", "Input placeholder"],
				]}
			/>
			<P>
				All four are observed — changing one reconfigures the mounted widget
				rather than remounting it. <Code>configure()</Code> is the programmatic
				equivalent, and <Code>window.Cheela.init(element, options)</Code> mounts
				one imperatively.
			</P>
			<P>
				Registration is guarded, so importing twice does not throw on a
				duplicate custom-element name.
			</P>
			<P>
				Practical setup in <A href="/guides/embedding-chat">Embed chat</A>.
			</P>
		</DocPage>
	);
}
