import { APP_CONFIG } from "@/constants/app";
import { tools } from "@/constants/tools";
import { isTauri } from "@/utils/isTauri";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getClientId(): string {
  try {
    const key = "devbox:ga_cid";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const cid = uuidv4();
    localStorage.setItem(key, cid);
    return cid;
  } catch {
    return uuidv4();
  }
}

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function useAnalytics() {
  const location = useLocation();
  const readyRef = useRef(false);
  const lastPathRef = useRef<string>("");
  const measurementId = APP_CONFIG.GA.MEASUREMENT_ID;
  const FORCE_BEACON = APP_CONFIG.GA.FORCE_BEACON === "1";
  const DEBUG = APP_CONFIG.GA.DEBUG === "1";
  const sessionIdRef = useRef<number>(Math.floor(Date.now() / 1000));
  const sessionCountRef = useRef<number>(1);

  useEffect(() => {
    if (!measurementId || readyRef.current) return;
    if (!window.dataLayer) window.dataLayer = [];
    window.gtag = function gtag() {
      window.dataLayer!.push(arguments as any);
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onload = () => {
      const platform = isTauri() ? "devbox_app" : "webapp";
      window.gtag!("js", new Date());
      window.gtag!("config", measurementId, {
        send_page_view: false,
        app_name: "Devbox",
        platform,
      });
      readyRef.current = true;
      console.log("GA manual initialized", { measurementId, platform, FORCE_BEACON, DEBUG });
      sendPageView(location.pathname, true);
    };
    script.onerror = () => console.warn("GA script failed to load");
    document.head.appendChild(script);
  }, [measurementId]);

  useEffect(() => {
    if (!readyRef.current) return;
    sendPageView(location.pathname);
  }, [location.pathname]);

  function sendPageView(path: string, initial = false) {
    if (!measurementId) return;
    if (lastPathRef.current === path && !initial) return;
    lastPathRef.current = path;
    const cid = getClientId();
    let appName = tools.find(tool => tool.path === path)?.text;
    if (path === "/dashboard") {
      appName = "Dashboard";
    } else if (path === "/settings") {
      appName = "Settings";
    }

    const pageLocation = isTauri() ? `tauri:/${path}` : window.location.href;
    const params: Record<string, any> = {
      page_location: pageLocation,
      page_path: path,
      page_title: appName || path,
      sid: sessionIdRef.current,
      sct: sessionCountRef.current,
      debug_mode: DEBUG ? 1 : undefined,
    };
    try {
      window.gtag && window.gtag("event", "page_view", params);
      console.debug("GA page_view", params);
      if (FORCE_BEACON) {
        beaconFallback(measurementId, params, cid, true);
      }
    } catch (e) {
      console.warn("GA gtag send failed, fallback", e);
      beaconFallback(measurementId, params, cid, true);
    }

    // If running under a non-http(s) custom protocol (tauri:// / asset://), CORS blocks fetch/Beacon.
    // Always send an image pixel which bypasses CORS preflight.
    if (!/^https?:/.test(window.location.protocol)) {
      imageFallback(measurementId, params, cid, DEBUG);
    }
  }
}

function beaconFallback(id: string, params: Record<string, any>, cid: string, verbose = false) {
  try {
    const endpoint = "https://www.google-analytics.com/g/collect";
    const raw: Record<string, string | undefined> = {
      v: "2",
      tid: id,
      cid,
      en: "page_view",
      dl: String(params.page_location || ""),
      dt: String(params.page_title || ""),
      sid: params.sid?.toString() || Math.floor(Date.now() / 1000).toString(),
      sct: params.sct?.toString() || "1",
      _dbg: params.debug_mode ? "1" : undefined,
    };
    const filtered = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => typeof v === "string" && v.length > 0)
    ) as Record<string, string>;
    const search = new URLSearchParams(filtered);
    const url = `${endpoint}?${search.toString()}`;
    if (navigator.sendBeacon) navigator.sendBeacon(url);
    else fetch(url, { method: "GET", mode: "no-cors" }).catch(() => {});
    if (verbose) console.debug("GA beacon sent", url);
  } catch (e) {
    console.warn("GA beacon fallback failed", e);
  }
}

function imageFallback(id: string, params: Record<string, any>, cid: string, debug = false) {
  try {
    const endpoint = "https://www.google-analytics.com/g/collect";
    const data: Record<string, string> = {
      v: "2",
      tid: id,
      cid,
      en: "page_view",
      dl: String(params.page_location || ""),
      dt: String(params.page_title || ""),
      sid: (params.sid || Math.floor(Date.now() / 1000)).toString(),
      sct: (params.sct || 1).toString(),
      _r: "1",
      _s: "1",
      _et: "0",
    };
    if (debug) data._dbg = "1";
    const qs = new URLSearchParams(data).toString();
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.src = `${endpoint}?${qs}&z=${Math.random().toString(36).slice(2)}`;
    if (debug) console.debug("GA image fallback sent", img.src);
  } catch (e) {
    console.warn("GA image fallback failed", e);
  }
}
