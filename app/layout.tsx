import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

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
	title: {
		default: "Docs — Cheela",
		template: "%s — Cheela Docs",
	},
	description:
		"Cheela ships as a single CLI plus a thin SDK. Get started, install, and deploy your first runtime.",
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
