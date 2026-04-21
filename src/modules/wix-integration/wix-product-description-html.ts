/**
 * Wix Stores descriptions are often Ricos rich content (JSON object or JSON string),
 * while the trip dashboard TipTap editor expects HTML. This module best-effort converts
 * Ricos to HTML; plain/HTML strings pass through.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tryParseJsonObject(value: string): Record<string, unknown> | null {
  const t = value.trim();
  if (!t.startsWith("{")) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(t);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* not JSON */
  }
  return null;
}

function isRicosDocument(value: Record<string, unknown>): boolean {
  return Array.isArray(value.nodes);
}

function applyTextDecorations(
  text: string,
  decorations: unknown,
): string {
  if (!Array.isArray(decorations) || decorations.length === 0) {
    return text;
  }
  let out = text;
  for (const d of decorations) {
    if (!d || typeof d !== "object") {
      continue;
    }
    const t = (d as Record<string, unknown>).type;
    if (t === "BOLD") {
      out = `<strong>${out}</strong>`;
    } else if (t === "ITALIC") {
      out = `<em>${out}</em>`;
    } else if (t === "UNDERLINE") {
      out = `<u>${out}</u>`;
    }
  }
  return out;
}

function ricosNodeToHtml(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }
  const n = node as Record<string, unknown>;
  const type = n.type;
  const children = Array.isArray(n.nodes)
    ? n.nodes.map(ricosNodeToHtml).join("")
    : "";

  switch (type) {
    case "PARAGRAPH":
      return `<p>${children || "<br>"}</p>`;
    case "TEXT": {
      const td = n.textData as Record<string, unknown> | undefined;
      const raw = typeof td?.text === "string" ? td.text : "";
      const escaped = escapeHtml(raw);
      return applyTextDecorations(escaped, td?.decorations);
    }
    case "HEADING": {
      const hd =
        n.headingData && typeof n.headingData === "object"
          ? (n.headingData as Record<string, unknown>)
          : null;
      const level = typeof hd?.level === "number" ? hd.level : 2;
      const tag =
        level >= 1 && level <= 6 ? (`h${level}` as const) : "h2";
      return `<${tag}>${children}</${tag}>`;
    }
    case "BULLETED_LIST":
      return `<ul>${children}</ul>`;
    case "ORDERED_LIST":
      return `<ol>${children}</ol>`;
    case "LIST_ITEM":
      return `<li>${children}</li>`;
    case "BLOCKQUOTE":
      return `<blockquote>${children}</blockquote>`;
    case "DIVIDER":
      return "<hr>";
    case "LINE_SPACER":
      return "<p><br></p>";
    default:
      return children;
  }
}

function ricosDocumentToHtml(doc: Record<string, unknown>): string | null {
  const nodes = doc.nodes;
  if (!Array.isArray(nodes)) {
    return null;
  }
  const html = nodes.map(ricosNodeToHtml).join("").trim();
  return html.length > 0 ? html : null;
}

/**
 * Returns HTML suitable for TipTap, or null when there is no usable description.
 */
export function productDescriptionToRichTextHtml(
  description: unknown,
): string | null {
  if (description == null) {
    return null;
  }
  if (typeof description === "string") {
    const s = description.trim();
    if (!s) {
      return null;
    }
    const asObj = tryParseJsonObject(s);
    if (asObj && isRicosDocument(asObj)) {
      return ricosDocumentToHtml(asObj);
    }
    return s;
  }
  if (typeof description === "object" && !Array.isArray(description)) {
    const o = description as Record<string, unknown>;
    if (isRicosDocument(o)) {
      return ricosDocumentToHtml(o);
    }
  }
  return null;
}
