import { NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import makeFetchCookie from "fetch-cookie";
import { CookieJar } from "tough-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  airlineCode: z.enum(["Y4", "AM", "VB"]),
  confirmationCode: z.string().min(4).max(12),
  passengerLastName: z.string().min(2).max(60),
  flightNumber: z.string().optional().nullable(),
  departureDateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  debug: z.boolean().optional(),
});

type LookupInput = z.infer<typeof Schema>;

type NormalizedBooking = {
  airlineCode: "Y4" | "AM" | "VB";
  confirmationCode: string;
  passengerLastName: string;
  status?: string | null;
  raw?: {
    finalUrl?: string;
    contentType?: string;
    title?: string;
    forms?: any[];
    sample?: string;
    scripts?: string[];
    apiCandidates?: string[];
  };
};

function normalizeLastName(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

async function jarFetch(fetchWithCookies: typeof fetch, url: string, init?: RequestInit) {
  const res = await fetchWithCookies(url, {
    ...init,
    redirect: "follow",
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "es-MX,es;q=0.9,en;q=0.8",
      ...(init?.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const bodyText = await res.text();
  return { contentType, bodyText, finalUrl: res.url, status: res.status };
}

function extractScripts(html: string, base: string) {
  const $ = cheerio.load(html);
  const srcs: string[] = [];
  $("script[src]").each((_, el) => {
    const src = ($(el).attr("src") || "").trim();
    if (!src) return;
    // absolutiza
    const abs = src.startsWith("http")
      ? src
      : src.startsWith("/")
        ? `${base}${src}`
        : `${base}/${src}`;
    srcs.push(abs);
  });
  // quita duplicados
  return Array.from(new Set(srcs));
}

function extractTitle(html: string) {
  const $ = cheerio.load(html);
  return $("title").first().text().trim() || null;
}

function findApiCandidates(text: string) {
  const candidates = new Set<string>();

  // URLs absolutas
  const urlRe = /https?:\/\/[^\s"'<>]+/g;
  for (const m of text.match(urlRe) || []) {
    // filtra basura obvia
    if (m.includes("googletagmanager") || m.includes("gstatic") || m.includes("google")) continue;
    candidates.add(m.replace(/\\u002F/g, "/"));
  }

  // rutas tipo /api/... /graphql...
  const pathRe = /\/(api|graphql|bff|backend)[^\s"'<>]*/g;
  for (const m of text.match(pathRe) || []) {
    candidates.add(m.replace(/\\u002F/g, "/"));
  }

  return Array.from(candidates).slice(0, 80);
}

async function discoverVolarisApi(fetchWithCookies: typeof fetch, landingHtml: string) {
  const base = "https://www.volaris.com";
  const scripts = extractScripts(landingHtml, base)
    .filter((s) => s.endsWith(".js") || s.includes(".js?"))
    .slice(0, 12); // limita

  const apiCandidates = new Set<string>();

  // Descarga algunos bundles y busca strings
  for (const src of scripts.slice(0, 6)) {
    try {
      const r = await jarFetch(fetchWithCookies, src, { method: "GET" });
      // OJO: si viene gzip, igual res.text() ya lo devuelve descomprimido
      for (const c of findApiCandidates(r.bodyText)) apiCandidates.add(c);
    } catch {
      // ignora fallos individuales
    }
  }

  return {
    scripts,
    apiCandidates: Array.from(apiCandidates).slice(0, 120),
  };
}

async function lookupVolaris(input: LookupInput): Promise<NormalizedBooking> {
  const jar = new CookieJar();
  const fetchWithCookies = makeFetchCookie(fetch, jar) as unknown as typeof fetch;

  const landingUrl = "https://www.volaris.com/mytrips";
  const landing = await jarFetch(fetchWithCookies, landingUrl, { method: "GET" });

  const title = extractTitle(landing.bodyText);
  const sample = landing.bodyText.slice(0, 2500);

  // Como es SPA, primero hacemos discovery
  const discovery = input.debug ? await discoverVolarisApi(fetchWithCookies, landing.bodyText) : null;

  return {
    airlineCode: "Y4",
    confirmationCode: input.confirmationCode,
    passengerLastName: input.passengerLastName,
    status: null, // aún no, porque falta pegarle al endpoint real
    raw: {
      finalUrl: landing.finalUrl,
      contentType: landing.contentType,
      title: title ?? undefined,
      forms: [], // SPA
      sample: input.debug ? sample : undefined,
      scripts: input.debug ? discovery?.scripts : undefined,
      apiCandidates: input.debug ? discovery?.apiCandidates : undefined,
    },
  };
}

async function lookupViva(input: LookupInput): Promise<NormalizedBooking> {
  return {
    airlineCode: "VB",
    confirmationCode: input.confirmationCode,
    passengerLastName: input.passengerLastName,
    status: null,
  };
}

async function lookupAeromexico(input: LookupInput): Promise<NormalizedBooking> {
  return {
    airlineCode: "AM",
    confirmationCode: input.confirmationCode,
    passengerLastName: input.passengerLastName,
    status: null,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Bad request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    let data: NormalizedBooking;
    if (input.airlineCode === "Y4") data = await lookupVolaris(input);
    else if (input.airlineCode === "VB") data = await lookupViva(input);
    else data = await lookupAeromexico(input);

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Internal error" }, { status: 500 });
  }
}
