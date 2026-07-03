import type { MetadataRoute } from "next";

// Served at /CronLens/sitemap.xml (built statically). robots.txt lives at the
// domain root (the bhupendranegi.github.io repo), so it can't live here — this
// sitemap is submitted directly in Google Search Console instead.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://bhupendranegi.github.io/CronLens/",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
