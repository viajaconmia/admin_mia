// src/lib/airlines/volaris.session.ts
import "server-only";

type VolarisSession = {
  auth: string;         // Authorization capturado desde UI
  cookieHeader: string; // "a=b; c=d"
  createdAt: number;
};

type VolarisApiResult = {
  ok: boolean;
  httpStatus: number;
  finalUrl?: string;
  contentType?: string;
  payload?: any;
  errorBodySample?: string;
};

export type VolarisLookupResult = VolarisApiResult & {
  mode: "api" | "ui" | "api-retry" | "ui-failed";
  sessionUsed: boolean;
};

const IS_VERCEL = !!process.env.VERCEL;

let CACHED: VolarisSession | null = null;
let REFRESHING: Promise<(VolarisApiResult & { session?: VolarisSession })> | null = null;

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 min
const UI_URL = "https://www.volaris.com/mytrips/home";
const API_URL =
  "https://apigw.volaris.com/prod/api/v1/booking/getbookingbyrecordlocatorandlastname";

function normalizeLastName(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function isFreshSession() {
  return !!CACHED && Date.now() - CACHED.createdAt < SESSION_TTL_MS;
}

function cookiesToHeader(cookies: Array<{ name: string; value: string }>) {
  return cookies
    .filter((c) => c?.name && typeof c.value === "string")
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

async function importChromiumLauncher() {
  // Evita que Next bundlee playwright/playwright-core (y el tema de electron)
  const importer = new Function("p", "return import(p)") as (p: string) => Promise<any>;
  const pkg = IS_VERCEL ? "playwright-core" : "playwright";
  const mod = await importer(pkg);
  return mod.chromium; // { launch() }
}

async function launchBrowser() {
  const chromiumPw = await importChromiumLauncher();

  if (IS_VERCEL) {
    const importer = new Function("p", "return import(p)") as (p: string) => Promise<any>;
    const sparticuz = await importer("@sparticuz/chromium");
    const chromiumBin = sparticuz.default ?? sparticuz;

    return chromiumPw.launch({
      args: chromiumBin.args,
      executablePath: await chromiumBin.executablePath(),
      headless: chromiumBin.headless,
    });
  }

  // LOCAL: usa el Chromium que instala Playwright
  return chromiumPw.launch({ headless: true });
}

async function safeJson(resp: any) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

async function callVolarisApiWithSession(
  recordLocator: string,
  lastName: string,
  session: VolarisSession
): Promise<VolarisApiResult> {
  const url =
    API_URL +
    `?recordlocator=${encodeURIComponent(recordLocator)}` +
    `&lastname=${encodeURIComponent(lastName)}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "accept-language": "es-ES,es;q=0.9",
      authorization: session.auth, // como tu Copy as fetch (sin Bearer)
      flow: "MBS",
      frontend: "WEB",
      origin: "https://www.volaris.com",
      referer: "https://www.volaris.com/mytrips/home",
      cookie: session.cookieHeader,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const finalUrl = res.url;
  const text = await res.text().catch(() => "");

  let payload: any = null;
  if (contentType.includes("application/json")) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  return {
    ok: res.ok,
    httpStatus: res.status,
    finalUrl,
    contentType,
    payload,
    errorBodySample: res.ok ? undefined : text.slice(0, 1500),
  };
}

async function refreshVolarisSessionAndGetBooking(
  recordLocator: string,
  lastName: string
): Promise<VolarisApiResult & { session?: VolarisSession }> {
  const browser = await launchBrowser();
  const context = await browser.newContext({
    locale: "es-MX",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
  });

  // reduce carga
  await context.route("**/*", async (route: any) => {
    const rt = route.request().resourceType();
    if (["image", "font", "media"].includes(rt)) return route.abort();
    return route.continue();
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  let seenAuth: string | null = null;

  page.on("request", (req: any) => {
    const url = req.url();
    if (url.includes("/booking/getbookingbyrecordlocatorandlastname")) {
      const h = req.headers();
      if (h?.authorization) seenAuth = h.authorization;
    }
  });

  try {
    await page.goto(UI_URL, { waitUntil: "domcontentloaded" });

    const tryFill = async (candidates: Array<() => any>, value: string) => {
      for (const getLoc of candidates) {
        const loc = getLoc();
        const count = await loc.count().catch(() => 0);
        if (!count) continue;

        const first = loc.first();
        if (!(await first.isVisible().catch(() => false))) continue;

        await first.fill(value);
        return true;
      }
      return false;
    };

    const okPNR = await tryFill(
      [
        () => page.getByLabel(/reserv|pnr|localiz|record/i),
        () => page.getByPlaceholder(/reserv|pnr|localiz|record/i),
        () => page.locator('input[name*="record" i]'),
        () => page.locator('input[id*="record" i]'),
        () => page.locator('input[name*="pnr" i]'),
        () => page.locator('input[id*="pnr" i]'),
      ],
      recordLocator
    );

    const okLast = await tryFill(
      [
        () => page.getByLabel(/apellid|last\s*name/i),
        () => page.getByPlaceholder(/apellid|last\s*name/i),
        () => page.locator('input[name*="last" i]'),
        () => page.locator('input[id*="last" i]'),
        () => page.locator('input[name*="apellido" i]'),
        () => page.locator('input[id*="apellido" i]'),
      ],
      lastName
    );

    if (!okPNR || !okLast) {
      return {
        ok: false,
        httpStatus: 520,
        finalUrl: UI_URL,
        contentType: "text/plain",
        errorBodySample:
          "No encontré inputs de PNR/apellido en la UI (labels/placeholders cambiaron).",
      };
    }

    // click botón
    const btnCandidates = [
      () => page.getByRole("button", { name: /buscar|consultar|ver|find|search/i }),
      () => page.locator('button[type="submit"]'),
      () => page.locator("button").filter({ hasText: /buscar|consultar|ver|find|search/i }),
    ];

    let clicked = false;
    for (const getBtn of btnCandidates) {
      const btn = getBtn();
      const count = await btn.count().catch(() => 0);
      if (!count) continue;

      const first = btn.first();
      if (!(await first.isVisible().catch(() => false))) continue;

      await first.click().catch(() => {});
      clicked = true;
      break;
    }

    if (!clicked) {
      return {
        ok: false,
        httpStatus: 521,
        finalUrl: UI_URL,
        contentType: "text/plain",
        errorBodySample: "No encontré el botón Buscar/Consultar en la UI.",
      };
    }

    const resp = await page.waitForResponse((r: any) =>
      r.url().includes("/booking/getbookingbyrecordlocatorandlastname")
    );

    const status = resp.status();
    const payload = await safeJson(resp);

    const cookies = await context.cookies();
    const cookieHeader = cookiesToHeader(cookies);

    if (!seenAuth) {
      const req2 = resp.request();
      const h2 = req2.headers();
      if (h2?.authorization) seenAuth = h2.authorization;
    }

    if (!seenAuth) {
      return {
        ok: false,
        httpStatus: 522,
        finalUrl: resp.url(),
        contentType: resp.headers()["content-type"] || "application/json",
        payload,
        errorBodySample: "No pude capturar Authorization desde la UI.",
      };
    }

    CACHED = { auth: seenAuth, cookieHeader, createdAt: Date.now() };

    return {
      ok: status >= 200 && status < 300,
      httpStatus: status,
      finalUrl: resp.url(),
      contentType: resp.headers()["content-type"] || "application/json",
      payload,
      session: CACHED,
      errorBodySample:
        status >= 200 && status < 300 ? undefined : JSON.stringify(payload || {}).slice(0, 1500),
    };
  } catch (e: any) {
    return {
      ok: false,
      httpStatus: 500,
      finalUrl: UI_URL,
      contentType: "text/plain",
      errorBodySample: e?.message || "UI session refresh failed",
    };
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

export async function volarisLookup(
  recordLocatorRaw: string,
  lastNameRaw: string
): Promise<VolarisLookupResult> {
  const recordLocator = recordLocatorRaw.trim().toUpperCase();
  const lastName = normalizeLastName(lastNameRaw);

  // 1) intenta con sesión cacheada
  if (isFreshSession() && CACHED) {
    const r = await callVolarisApiWithSession(recordLocator, lastName, CACHED);
    if (r.ok) return { mode: "api", ...r, sessionUsed: true };
    if (![401, 403, 406].includes(r.httpStatus)) return { mode: "api", ...r, sessionUsed: true };
  }

  // 2) refresco UI con lock
  if (!REFRESHING) {
    REFRESHING = refreshVolarisSessionAndGetBooking(recordLocator, lastName).finally(() => {
      REFRESHING = null;
    });
  }

  const ui = await REFRESHING;

  if (ui.ok && ui.payload) {
    return {
      mode: "ui",
      ok: true,
      httpStatus: ui.httpStatus,
      finalUrl: ui.finalUrl,
      contentType: ui.contentType,
      payload: ui.payload,
      sessionUsed: false,
    };
  }

  // 3) reintenta API una vez
  if (CACHED) {
    const r2 = await callVolarisApiWithSession(recordLocator, lastName, CACHED);
    return { mode: "api-retry", ...r2, sessionUsed: true };
  }

  return {
    mode: "ui-failed",
    ok: false,
    httpStatus: ui.httpStatus || 500,
    finalUrl: ui.finalUrl,
    contentType: ui.contentType,
    payload: ui.payload,
    errorBodySample: ui.errorBodySample,
    sessionUsed: false,
  };
}

export function clearVolarisSessionCache() {
  CACHED = null;
}
