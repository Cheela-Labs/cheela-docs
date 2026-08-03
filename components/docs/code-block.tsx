"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
	/** The code itself. Written as a template literal so indentation survives. */
	children: string;
	/** Shown in the header strip, e.g. `.cheela/runtime.ts`. */
	filename?: string;
	/** Labels the block when there is no filename, e.g. "Terminal". */
	label?: string;
	className?: string;
}

/**
 * A code sample with a copy button.
 *
 * Deliberately unhighlighted. Syntax highlighting means shipping a tokenizer
 * (or a build step) for a page whose job is to be read once and pasted, and
 * every highlighter in this size class mis-colours TypeScript generics badly
 * enough to be worse than plain text.
 */
export function CodeBlock({
	children,
	filename,
	label,
	className,
}: CodeBlockProps) {
	const [copied, setCopied] = useState(false);
	const code = children.replace(/^\n/, "").replace(/\n\s*$/, "");

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			// Reverts on its own so the button never sits in a stale "Copied"
			// state after the user has moved on to another block.
			setTimeout(() => setCopied(false), 1600);
		} catch {
			// A clipboard the browser refuses (insecure origin, denied permission)
			// is not worth an error UI — the code is selectable either way.
		}
	}

	const heading = filename ?? label;

	return (
		<div
			className={cn(
				"my-6 overflow-hidden rounded-md border border-line-dark-1 bg-console-bg",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-4 border-b border-line-dark-1 px-4 py-2">
				<span className="truncate font-mono text-2xs tracking-wide text-console-fg-muted">
					{heading ?? ""}
				</span>
				<button
					aria-label={copied ? "Copied" : "Copy code"}
					className="inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 font-mono text-2xs text-console-fg-muted transition-colors duration-fast hover:bg-white/5 hover:text-console-fg"
					onClick={copy}
					type="button"
				>
					{copied ? <Check size={13} /> : <Copy size={13} />}
					{copied ? "Copied" : "Copy"}
				</button>
			</div>
			<pre className="overflow-x-auto px-4 py-4">
				<code className="font-mono text-sm leading-relaxed text-console-fg">
					{code}
				</code>
			</pre>
		</div>
	);
}
