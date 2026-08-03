import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { site } from "@/lib/site";

const ranade = localFont({
	src: "./fonts/Ranade-Variable.ttf",
	variable: "--font-ranade",
	weight: "100 900",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	// Pinned, not derived from the deployment. Every page's `alternates.canonical`
	// is relative and resolves against this, so a preview hostname leaking in here
	// would rewrite the canonical of the whole site.
	metadataBase: new URL(site.docs),
	title: {
		default: "Cheela Docs",
		template: "%s — Cheela Docs",
	},
	description:
		"Describe what your product can do. Cheela runs the model, calls your capabilities over a signed request, and keeps the trace.",
	openGraph: {
		siteName: "Cheela Docs",
		type: "website",
		locale: "en_US",
	},
	twitter: {
		card: "summary_large_image",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${ranade.variable} ${jetbrainsMono.variable} bg-bg-page text-fg-primary antialiased`}
			>
				{children}
				<GoogleAnalytics />
			</body>
		</html>
	);
}
