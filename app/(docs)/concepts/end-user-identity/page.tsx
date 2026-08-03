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
	title: "End-user identity",
	description:
		"How a capability acts on behalf of a signed-in person, using your own session credential, without Cheela ever parsing or storing it.",
	alternates: { canonical: "/concepts/end-user-identity" },
};

const TOC = [
	{ id: "problem", title: "The problem" },
	{ id: "how", title: "How it works" },
	{ id: "requires", title: "Marking a capability" },
	{ id: "sending", title: "Sending the credential" },
	{ id: "verifying", title: "Verifying it" },
	{ id: "never-trust-input", title: "Never take identity from input" },
	{ id: "not-stored", title: "What Cheela does not do" },
];

export default function EndUserIdentityPage() {
	return (
		<DocPage
			eyebrow="Concepts"
			lead="Cheela does not authenticate your users and does not try to. It carries an opaque credential from the caller to your handler, and your own code verifies it exactly as your REST API already does."
			title="End-user identity"
			toc={TOC}
		>
			<H2 id="problem">The problem</H2>
			<P>
				<Code>order-status</Code> is harmless. <Code>my-orders</Code> is not —
				it acts as somebody, and it has to know who.
			</P>
			<P>
				That question gets sharper once you publish a manifest, because then
				every capability is callable by strangers, including agents that have no
				account with you at all. A capability reading a customer&rsquo;s own
				records without an identity check is a data leak, not a feature.
			</P>

			<H2 id="how">How it works</H2>
			<P>
				One field, carried end to end and interpreted at exactly one point —
				yours.
			</P>
			<CodeBlock label="Path">{`browser            Cheela                     your endpoint
   │                  │                            │
   │ endUserToken ───▶│                            │
   │                  │ ── forwarded untouched ───▶│
   │                  │    (never parsed,          │  your verify code runs
   │                  │     never logged,          │  here, and only here
   │                  │     never traced)          │`}</CodeBlock>
			<P>
				The credential is whatever your application already issues — a session
				JWT, an opaque session id, anything. Cheela treats it as bytes.
			</P>

			<Callout title="It is deliberately not metadata" tone="warning">
				<p>
					<Code>metadata</Code> is developer-supplied context and is recorded in
					execution traces. A user credential must not be, so it travels in its
					own field that the trace path never touches.
				</p>
			</Callout>

			<H2 id="requires">Marking a capability</H2>
			<P>
				Set <Code>requiresEndUser</Code> on anything that acts as somebody:
				placing an order, reading order history, changing an account.
			</P>
			<CodeBlock filename=".cheela/runtime.ts">{`runtime.register(
  {
    name: "my-orders",
    description: "Lists the signed-in customer's recent orders",
    version: "1.0.0",
    requiresEndUser: true,
    // No userId field. See below.
    input: z.object({
      limit: z.number().int().positive().max(50).default(10),
    }),
  },
  {
    name: "list",
    async handler(context, input) {
      const userId = await verifySession(context.endUserToken!);
      return { orders: await db.orders.forUser(userId, input.limit) };
    },
  },
);`}</CodeBlock>

			<P>The flag is enforced in two places, before your handler runs:</P>
			<Table
				headers={["Where", "What happens without a credential"]}
				rows={[
					[
						"Your runtime",
						<>
							<Code>Runtime.execute()</Code> throws before dispatching, so
							forgetting a check in one implementation cannot make the
							capability reachable anonymously.
						</>,
					],
					[
						"The public broker",
						<>
							Refused with 401 before anything is metered — otherwise calls that
							could never succeed would still drain the owner&rsquo;s quota.
						</>,
					],
				]}
			/>

			<P>
				Leaving the flag off means the capability is callable anonymously,
				including by a third party&rsquo;s agent that found you through your
				published manifest. For read-only public data that is exactly right. For
				anything else it is a bug.
			</P>

			<H2 id="sending">Sending the credential</H2>

			<H3>From React</H3>
			<P>
				Give <Code>CheelaProvider</Code> a function, not a string. A shopper can
				sign in long after the widget mounted, and a value read once would pin
				whatever was true then.
			</P>
			<CodeBlock filename="app/page.tsx">{`<CheelaProvider
  apiKey={process.env.NEXT_PUBLIC_CHEELA_PUBLIC_KEY!}
  endUserToken={() => session?.token}
>
  <Chat />
</CheelaProvider>`}</CodeBlock>
			<P>
				Return <Code>undefined</Code> for a visitor who is not signed in.
				Capabilities marked <Code>requiresEndUser</Code> then refuse to run,
				which is the intended outcome rather than a failure to handle.
			</P>

			<H3>Over HTTP</H3>
			<CodeBlock label="JSON">{`{
  "messages": [ ... ],
  "endUserToken": "session_abc123"
}`}</CodeBlock>
			<P>
				The same field works on the broker path, where it is optional and
				usually absent — most callers there are strangers&rsquo; agents with no
				account. It is accepted rather than forbidden because a shop may well
				issue its own users a credential to hand to an agent they trust.
			</P>

			<H2 id="verifying">Verifying it</H2>
			<P>
				Use the code your API already uses. This is the whole point: there is no
				second identity system to keep in sync.
			</P>
			<CodeBlock label="TypeScript">{`async function verifySession(token: string): Promise<string> {
  // Whatever your REST API does today — a JWT check, a session-store lookup.
  const claims = await jwt.verify(token, process.env.SESSION_SECRET!);
  return claims.sub;
}`}</CodeBlock>
			<P>
				Throwing fails the capability call, which is the correct outcome for a
				credential you do not recognise. The model sees a{" "}
				<Code>tool_result</Code> carrying the error and can tell the user to
				sign in.
			</P>

			<H2 id="never-trust-input">Never take identity from input</H2>
			<P>
				The tempting version of <Code>my-orders</Code> takes a{" "}
				<Code>userId</Code> parameter. Do not write it.
			</P>
			<CodeBlock label="Do not do this">{`// WRONG — whoever calls picks whose orders to read.
input: z.object({ userId: z.string(), limit: z.number() }),`}</CodeBlock>
			<P>
				A model can be talked into passing any value, and on the broker path the
				caller writes the input directly. Identity comes from the verified
				credential; the input carries only what the user is asking for.
			</P>

			<H2 id="not-stored">What Cheela does not do</H2>
			<UL>
				<LI>
					<Strong>Does not parse it.</Strong> No assumption that it is a JWT, or
					has a shape at all.
				</LI>
				<LI>
					<Strong>Does not verify it.</Strong> Only you can — it is your secret
					and your session store.
				</LI>
				<LI>
					<Strong>Does not store it.</Strong> Not in traces, not in analytics,
					not in logs.
				</LI>
				<LI>
					<Strong>Does not refresh it.</Strong> An expired credential fails in
					your handler, like any other.
				</LI>
			</UL>
			<P>
				What Cheela does do is enforce presence: <Code>requiresEndUser</Code>{" "}
				guarantees your handler never runs without one, so the check you might
				forget is the one you no longer have to write.
			</P>
			<P>
				A complete working example lives in{" "}
				<A href="https://github.com/Cheela-Labs/platform/tree/main/examples/signed-endpoint-nextjs">
					examples/signed-endpoint-nextjs
				</A>
				.
			</P>
		</DocPage>
	);
}
