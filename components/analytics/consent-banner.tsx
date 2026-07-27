"use client";

import { useEffect, useState } from "react";
import {
	type ConsentChoice,
	readConsent,
	updateConsent,
	writeConsent,
} from "./consent";

/**
 * Flips the Consent Mode v2 signal the bootstrap script defaults to denied.
 *
 * Rendered unconditionally — it decides for itself whether to show, after
 * reading storage on the client. Deciding on the server would need the choice
 * in a cookie and would vary the cached HTML per visitor.
 */
export function ConsentBanner() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		// Only ask when there is no recorded choice. A previous "denied" is a
		// decision, not an absence of one, so it is not re-litigated every visit.
		if (readConsent() === null) setVisible(true);
	}, []);

	function choose(choice: ConsentChoice) {
		writeConsent(choice);
		updateConsent(choice);
		setVisible(false);
	}

	if (!visible) return null;

	return (
		<div
			aria-label="Analytics consent"
			className="fixed inset-x-0 bottom-0 z-50 border-t border-border-default bg-bg-surface/95 backdrop-blur"
			role="dialog"
		>
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<p className="max-w-[68ch] text-sm leading-relaxed text-fg-secondary">
					We use Google Analytics to understand which pages are useful. Nothing
					is stored on your device unless you accept.
				</p>
				<div className="flex shrink-0 items-center gap-2">
					<button
						className="rounded-full border border-border-default px-4 py-1.5 text-sm font-medium text-fg-secondary transition-colors hover:border-border-strong"
						onClick={() => choose("denied")}
						type="button"
					>
						Decline
					</button>
					<button
						className="rounded-full border border-accent bg-accent-soft px-4 py-1.5 text-sm font-medium text-accent-strong transition-colors hover:border-accent-strong"
						onClick={() => choose("granted")}
						type="button"
					>
						Accept
					</button>
				</div>
			</div>
		</div>
	);
}
