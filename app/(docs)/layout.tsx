import type { ReactNode } from "react";
import { NavBar } from "@/components/chrome/nav-bar";
import { SiteFooter } from "@/components/chrome/site-footer";
import { DocsShell } from "@/components/docs/shell";

export default function DocsLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<NavBar />
			<DocsShell>{children}</DocsShell>
			<SiteFooter />
		</>
	);
}
