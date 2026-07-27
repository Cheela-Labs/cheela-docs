import Script from "next/script";
import { CONSENT_STORAGE_KEY } from "./consent";
import { ConsentBanner } from "./consent-banner";

/**
 * Shares the property with the website deliberately: docs and marketing are one
 * user journey, and splitting them across properties makes the docs → pricing
 * path invisible, which is the path worth measuring.
 */
const MEASUREMENT_ID =
	process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-J7246R6PZX";

/**
 * Server-only: reads VERCEL_ENV, which is not exposed to the browser. Render
 * this from a server component (the root layout), never from a client one.
 *
 * Local development and preview deployments are excluded so that `pnpm dev` and
 * every PR preview do not land in the same property as real traffic. Unknown
 * environments fall through to enabled, so a non-Vercel deploy still reports.
 */
function isEnabled(): boolean {
	if (process.env.NODE_ENV !== "production") return false;
	if (process.env.VERCEL_ENV === "preview") return false;
	return true;
}

/**
 * Consent Mode v2 defaults, plus the usual gtag bootstrap.
 *
 * A plain inline script rather than next/script because ordering is
 * load-bearing: the defaults have to be in the dataLayer *before* gtag.js
 * processes it, or the library has already decided it may write cookies.
 */
function bootstrap(): string {
	return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
var stored = null;
try { stored = window.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)}); } catch (e) {}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: stored === 'granted' ? 'granted' : 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
gtag('js', new Date());
gtag('config', ${JSON.stringify(MEASUREMENT_ID)});
`.trim();
}

export function GoogleAnalytics() {
	if (!isEnabled()) return null;

	return (
		<>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: must run synchronously, before gtag.js */}
			<script dangerouslySetInnerHTML={{ __html: bootstrap() }} />
			<Script
				src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
				strategy="afterInteractive"
			/>
			<ConsentBanner />
		</>
	);
}
