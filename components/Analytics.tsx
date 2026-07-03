"use client";

import { useEffect } from "react";

const GA_ID = "G-4X8NFH01NY";

// Google Analytics (gtag.js). Mirrors bhupendranegi.github.io: loaded only in
// production so local dev traffic doesn't pollute the property.
//
// Privacy (Design §27): share links carry the cron expression in the query
// string (?expr=…). GA's default page_view would log it, so page_location is
// sent WITHOUT the query — raw expressions never reach analytics.
export function Analytics() {
  useEffect(() => {
    const host = window.location.hostname;
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "" ||
      host.includes(".local");
    if (isLocal) return;

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    const w = window as GtagWindow;
    w.dataLayer = w.dataLayer || [];
    // gtag.js requires the real `arguments` object on the dataLayer — a rest-
    // param array is silently ignored.
    function gtagImpl() {
      w.dataLayer!.push(arguments);
    }
    const gtag = gtagImpl as (...args: unknown[]) => void;
    w.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_ID, {
      // strip ?expr=… so pasted cron expressions are never logged
      page_location: window.location.origin + window.location.pathname,
    });
  }, []);

  return null;
}
