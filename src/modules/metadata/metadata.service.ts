import type { LookupAddress } from "node:dns";
import dns from "node:dns/promises";
import net from "node:net";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { LandingMetadataResponse } from "./dto/fetch-page.dto";

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const METADATA_HOST_BLOCKLIST = new Set(["metadata.google.internal"]);

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  async fetchLandingMetadata(
    urlString: string,
  ): Promise<LandingMetadataResponse> {
    let url: URL;
    try {
      url = new URL(urlString);
    } catch {
      throw new HttpException(
        { message: "Invalid URL", code: "INVALID_URL" },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.assertSafeTarget(url);

    let html: string;
    try {
      html = await this.fetchHtmlLimited(url);
    } catch (err) {
      this.logger.warn(`fetch failed for ${url.origin}: ${String(err)}`);
      throw new HttpException(
        { message: "Upstream fetch failed", code: "UPSTREAM_ERROR" },
        HttpStatus.BAD_GATEWAY,
      );
    }

    return this.parseHtmlMetadata(html, url);
  }

  private async assertSafeTarget(url: URL): Promise<void> {
    if (url.username || url.password) {
      throw new HttpException(
        { message: "URL must not include credentials", code: "INVALID_URL" },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new HttpException(
        { message: "Only http(s) URLs are allowed", code: "INVALID_URL" },
        HttpStatus.BAD_REQUEST,
      );
    }

    const host = url.hostname.toLowerCase();
    if (METADATA_HOST_BLOCKLIST.has(host) || host === "169.254.169.254") {
      throw new HttpException(
        { message: "Host not allowed", code: "SSRF_BLOCKED" },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (isBlockedHostname(host)) {
      throw new HttpException(
        { message: "Host not allowed", code: "SSRF_BLOCKED" },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!net.isIP(host)) {
      let records: LookupAddress[];
      try {
        records = await dns.lookup(host, { all: true });
      } catch {
        throw new HttpException(
          { message: "Could not resolve host", code: "INVALID_URL" },
          HttpStatus.BAD_REQUEST,
        );
      }
      for (const { address } of records) {
        if (isBlockedIp(address)) {
          throw new HttpException(
            { message: "Resolved address not allowed", code: "SSRF_BLOCKED" },
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    } else if (isBlockedIp(host)) {
      throw new HttpException(
        { message: "Address not allowed", code: "SSRF_BLOCKED" },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async fetchHtmlLimited(url: URL): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "User-Agent": "SitioMetadataFetcher/1.0",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const ctype = res.headers.get("content-type") ?? "";
      if (
        !ctype.includes("text/html") &&
        !ctype.includes("application/xhtml")
      ) {
        throw new Error(`Unsupported content-type: ${ctype}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (!value) {
          continue;
        }
        total += value.byteLength;
        if (total > MAX_BODY_BYTES) {
          reader.cancel();
          throw new Error("Response too large");
        }
        chunks.push(value);
      }

      const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
      return buf.toString("utf8");
    } finally {
      clearTimeout(timer);
    }
  }

  private parseHtmlMetadata(
    html: string,
    pageUrl: URL,
  ): LandingMetadataResponse {
    const pickMeta = (
      attr: "property" | "name",
      key: string,
    ): string | null => {
      const re = new RegExp(
        `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["'][^>]*>`,
        "i",
      );
      const re2 = new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["'][^>]*>`,
        "i",
      );
      return html.match(re)?.[1] ?? html.match(re2)?.[1] ?? null;
    };

    const titleFromOg = pickMeta("property", "og:title");
    const titleTag =
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
    const title = titleFromOg ?? titleTag;

    const description =
      pickMeta("property", "og:description") ??
      pickMeta("name", "description") ??
      null;

    const ogImage = pickMeta("property", "og:image");
    const imageUrl = ogImage ? absolutizeUrl(ogImage, pageUrl) : null;

    let faviconUrl: string | null = null;
    const iconHref =
      html.match(
        /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
      )?.[1] ??
      html.match(
        /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
      )?.[1] ??
      null;
    if (iconHref) {
      faviconUrl = absolutizeUrl(iconHref, pageUrl);
    } else {
      faviconUrl = new URL("/favicon.ico", pageUrl).href;
    }

    return {
      title,
      description,
      imageUrl,
      faviconUrl,
    };
  }
}

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) {
    return true;
  }
  return false;
}

function isBlockedIp(ip: string): boolean {
  if (ip === "0.0.0.0" || ip === "::") {
    return true;
  }
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) {
      return true;
    }
    if (a === 127) {
      return true;
    }
    if (a === 0) {
      return true;
    }
    if (a === 169 && b === 254) {
      return true;
    }
    if (a === 172 && b >= 16 && b <= 31) {
      return true;
    }
    if (a === 192 && b === 168) {
      return true;
    }
    return false;
  }
  if (net.isIPv6(ip)) {
    const n = ip.toLowerCase();
    if (n === "::1") {
      return true;
    }
    if (n.startsWith("fe80:")) {
      return true;
    }
    if (n.startsWith("fc") || n.startsWith("fd")) {
      return true;
    }
    if (n === "::ffff:127.0.0.1") {
      return true;
    }
    return false;
  }
  return false;
}

function absolutizeUrl(href: string, base: URL): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}
