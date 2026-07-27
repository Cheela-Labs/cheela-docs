export const CONSENT_STORAGE_KEY = "cheela.consent.analytics";

export type ConsentChoice = "granted" | "denied";

export function readConsent(): ConsentChoice | null {
	try {
		const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
		return stored === "granted" || stored === "denied" ? stored : null;
	} catch {
		// Storage can throw in private modes and locked-down browsers. Treat it as
		// "no choice recorded" — the defaults already deny.
		return null;
	}
}

export function writeConsent(choice: ConsentChoice): void {
	try {
		window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
	} catch {
		// Nothing to do: the choice applies to this page load either way, and the
		// banner reappearing next visit is better than failing the interaction.
	}
}

type GtagArgs =
	| ["consent", "update", Record<string, string>]
	| ["event", string, Record<string, unknown>]
	| ["set", Record<string, unknown>];

declare global {
	interface Window {
		gtag?: (...args: GtagArgs) => void;
		dataLayer?: unknown[];
	}
}

export function updateConsent(choice: ConsentChoice): void {
	window.gtag?.("consent", "update", { analytics_storage: choice });
}
