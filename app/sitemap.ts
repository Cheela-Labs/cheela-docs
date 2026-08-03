import type { MetadataRoute } from "next";
import { navOrder } from "@/lib/nav";
import { site } from "@/lib/site";

/**
 * Derived from the navigation tree rather than hand-listed.
 *
 * A hardcoded array is how a docs site ends up with pages that exist, are
 * linked, and are never submitted — the two lists drift the first time
 * somebody adds a page in a hurry.
 */
export default function sitemap(): MetadataRoute.Sitemap {
	return navOrder.map((item) => ({
		url: new URL(item.href, site.docs).toString(),
		changeFrequency: "weekly",
		// The introduction is the entry point; everything else is equal.
		priority: item.href === "/" ? 1 : 0.8,
	}));
}
