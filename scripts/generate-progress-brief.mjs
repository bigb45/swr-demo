/**
 * Generates the "TEIA / SWR Programme Progress Brief — June 2026" Word document.
 *
 * This is a stakeholder-facing successor to TEIA_SWR_Programme_Brief_May2026.docx
 * (dated 7 May 2026). It reports progress across three fronts — Frontend, Backend
 * (Magento + nextPIM) and AI — each split into Done / In progress / Blocked / Next.
 *
 * Run:  node scripts/generate-progress-brief.mjs
 * Out:  TEIA_SWR_Programme_Progress_Brief_Jun2026.docx (repo root)
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

// ---------------------------------------------------------------------------
// Brand palette (from DESIGN.md / AGENTS.md)
// ---------------------------------------------------------------------------
const COLOR = {
  primary: "003A63", // deep blue
  green: "006E21", // CTAs / Done
  amber: "B26A00", // In progress
  red: "B00020", // Blocked
  ink: "1A1C1C", // body text
  muted: "5A6068", // secondary text
  headerFill: "003A63",
  zebra: "F3F3F3",
  white: "FFFFFF",
};

const STATUS = {
  Done: COLOR.green,
  "In progress": COLOR.amber,
  Blocked: COLOR.red,
  Next: COLOR.primary,
};

const FONT = "Calibri";

// ---------------------------------------------------------------------------
// Small paragraph/text helpers
// ---------------------------------------------------------------------------
function text(content, opts = {}) {
  return new TextRun({
    text: content,
    font: FONT,
    size: opts.size ?? 21, // half-points (21 = 10.5pt)
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    color: opts.color ?? COLOR.ink,
    allCaps: opts.allCaps ?? false,
  });
}

function para(runs, opts = {}) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0, line: opts.line ?? 276 },
    alignment: opts.alignment,
    heading: opts.heading,
    keepNext: opts.keepNext,
  });
}

function bullet(content, opts = {}) {
  return new Paragraph({
    children: typeof content === "string" ? [text(content, opts)] : content,
    numbering: undefined,
    bullet: { level: opts.level ?? 0 },
    spacing: { after: 80, line: 264 },
  });
}

function sectionHeading(num, title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 140 },
    children: [
      new TextRun({ text: `${num}  `, font: FONT, bold: true, size: 30, color: COLOR.green }),
      new TextRun({ text: title, font: FONT, bold: true, size: 30, color: COLOR.primary }),
    ],
  });
}

function subHeading(title, color) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    keepNext: true,
    children: [
      new TextRun({ text: title, font: FONT, bold: true, size: 23, color: color ?? COLOR.ink }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Table helpers
// ---------------------------------------------------------------------------
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function cell(children, { fill, width, bold } = {}) {
  const paras = (Array.isArray(children) ? children : [children]).map((c) =>
    typeof c === "string"
      ? new Paragraph({
          children: [text(c, { bold })],
          spacing: { before: 40, after: 40, line: 252 },
        })
      : c,
  );
  return new TableCell({
    children: paras,
    shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
  });
}

function headerCell(label, width) {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR.headerFill },
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: label, font: FONT, bold: true, size: 19, color: COLOR.white, allCaps: true })],
      }),
    ],
  });
}

function statusRunCell(status) {
  return new TableCell({
    width: { size: 18, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: status, font: FONT, bold: true, size: 19, color: STATUS[status] ?? COLOR.ink })],
      }),
    ],
  });
}

/**
 * Build a 3-column matrix: Feature | Status | Notes.
 * rows: [ [feature, status, notes], ... ]
 */
function matrixTable(rows) {
  const header = new TableRow({
    tableHeader: true,
    children: [headerCell("Feature", 34), headerCell("Status", 18), headerCell("Notes", 48)],
  });
  const body = rows.map(([feature, status, notes], i) => {
    const fill = i % 2 === 1 ? COLOR.zebra : undefined;
    return new TableRow({
      children: [
        cell(feature, { width: 34, fill, bold: true }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
          margins: { top: 60, bottom: 60, left: 110, right: 110 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: status, font: FONT, bold: true, size: 19, color: STATUS[status] ?? COLOR.ink })],
            }),
          ],
        }),
        cell(notes, { width: 48, fill }),
      ],
    });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [header, ...body],
  });
}

/** Two-column "at a glance" table: Workstream | State. */
function glanceTable(rows) {
  const header = new TableRow({
    tableHeader: true,
    children: [headerCell("Workstream", 55), headerCell("State", 45)],
  });
  const body = rows.map(([ws, state, color], i) => {
    const fill = i % 2 === 1 ? COLOR.zebra : undefined;
    return new TableRow({
      children: [
        cell(ws, { width: 55, fill, bold: true }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
          margins: { top: 60, bottom: 60, left: 110, right: 110 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: state, font: FONT, bold: true, size: 19, color: color ?? COLOR.ink })],
            }),
          ],
        }),
      ],
    });
  });
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: NO_BORDERS, rows: [header, ...body] });
}

function spacer(h = 80) {
  return new Paragraph({ children: [], spacing: { after: h } });
}

function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "D7DCE1", space: 4 } },
    spacing: { before: 60, after: 160 },
    children: [],
  });
}

// ===========================================================================
// CONTENT
// ===========================================================================

// ---- Title page ----------------------------------------------------------
const titlePage = [
  new Paragraph({ children: [], spacing: { before: 1800 } }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "TEIA / SWR Shop", font: FONT, bold: true, size: 52, color: COLOR.primary })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [new TextRun({ text: "Programme Progress Brief", font: FONT, size: 34, color: COLOR.green })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: "Document date: June 2026", font: FONT, size: 22, color: COLOR.muted })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [
      new TextRun({ text: "Supersedes the Programme Status & Demo Brief of 7 May 2026", font: FONT, italics: true, size: 20, color: COLOR.muted }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 900 },
    children: [
      new TextRun({ text: "Fronts covered:  Frontend  ·  Backend (Magento + nextPIM)  ·  AI", font: FONT, bold: true, size: 22, color: COLOR.primary }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80 },
    children: [
      new TextRun({ text: "Status legend:  Done  ·  In progress  ·  Blocked  ·  Next", font: FONT, size: 19, color: COLOR.muted }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---- Executive summary ---------------------------------------------------
const execSummary = [
  sectionHeading("", "Executive Summary"),
  para(
    text(
      "Since the 10 May 2026 demonstration, the TEIA / SWR storefront has moved from a demo-ready build to a feature-complete B2B commerce experience, with parallel progress on the Magento/nextPIM backend and a now-live AI stack. The two headline bets of the May demo — the conversational AI Copilot and authenticated-only pricing — have both shipped, and a full wave of stakeholder feedback has been implemented end to end.",
    ),
  ),
  para(
    text(
      "On the frontend, the storefront is deployed to a Vercel demo environment for stakeholder review, and the entire stakeholder-feedback catalogue (shop navigation, homepage, Copilot experience, account and registration) has been worked item by item. On the backend, the team held a working session with nextPIM, received Swagger documentation and product-fetch credentials, and completed an initial nextPIM → Magento product sync. On AI, the Copilot, hybrid search, multilingual and vision capabilities are live in production.",
    ),
  ),
  para(
    text(
      "The remaining high-value items — customer-aware (tiered) pricing and procurement punchout — are sequenced but currently blocked on access to the enventaERP system, which sits with the project owners. This brief reports progress across all three fronts and the next milestones for each.",
    ),
  ),
  spacer(120),
  subHeading("Programme at a glance", COLOR.primary),
  glanceTable([
    ["Frontend storefront (Next.js 16)", "Feature-complete; on Vercel demo", COLOR.green],
    ["Stakeholder-feedback wave (Phases A–E)", "Implemented", COLOR.green],
    ["AI Copilot, search, vision", "Live in production", COLOR.green],
    ["nextPIM → Magento catalogue sync", "Initial sync done", COLOR.green],
    ["Customer-aware (tiered) pricing", "Blocked — ERP access", COLOR.red],
    ["Procurement punchout module", "Blocked — ERP access", COLOR.red],
    ["User management / approval", "Next", COLOR.primary],
  ]),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---- 1. Frontend ---------------------------------------------------------
const frontendDone = [
  ["Shop entry redesign", "Done", "New /shop category hub (tiled grid + sidebar) and a hover/keyboard mega-menu; clicking 'Shop' no longer dumps the full catalogue. (FEEDBACK A1–A3)"],
  ["Navigation cleanup", "Done", "'Industries' removed from primary nav; legacy /industries* now 301-redirect to /shop; green 'Book consultation' CTA demoted. (FEEDBACK A5, D4)"],
  ["Homepage rework", "Done", "Featured products moved above the fold; partner logo carousel replaces the catalogue rail; a large Copilot hero replaces the four intent tiles. (FEEDBACK A8, A9, D1)"],
  ["Watchlist (Merkliste)", "Done", "Guest-friendly localStorage watchlist with header badge and /watchlist page; guests/price-on-request items get 'add to watchlist' instead of cart. (FEEDBACK A6)"],
  ["Guest pricing UX", "Done", "Catalogue prices are hidden until sign-in across cards, search rows, PDP and Copilot widgets, with a neutral 'sign in for pricing' banner."],
  ["Faceted product filtering", "Done", "Multi-select filter bar with active-filter chips and URL state; category-scoped facet scaffold ready for backend-defined attributes."],
  ["Improved search results", "Done", "Dedicated search results list with price/stock, demo-data hygiene (hides placeholder/empty attributes) and image fallbacks."],
  ["Copilot / chatbot frontend", "Done", "Image upload, contextual suggestion chips, page-context awareness on the PDP, and a no-result → catalogue search fallback; consent fixed so Copilot works under essential-only cookies. (FEEDBACK D3, D5, D7, D8)"],
  ["Account & registration", "Done", "Prominent account button in the header; B2B multi-step registration with a required Company field; localized 404. (FEEDBACK E1, E2)"],
  ["Mobile & accessibility", "Done", "Keyboard-navigable mega-menu, reworked side navigation, and hydration-safe rendering for a cleaner mobile experience."],
  ["Document catalogue polish", "Done", "Multi-select accordion filters plus an embedded video viewer (YouTube + native) alongside the existing PDF viewer."],
  ["Vercel demo deployment", "Done", "Storefront deployed to a Vercel demo environment for stakeholder review and iteration."],
  ["Stakeholder feedback integration", "Done", "Every point from the May feedback document mapped to a concrete action and shipped across Sprints 1–4 (Phases A–E)."],
];

const frontendInProgress = [
  ["Product customizable options", "In progress", "Magento product custom options (text + select) rendered on the PDP, carried into the cart payload, and shown as readable labels on the order detail page."],
  ["Cart & Copilot polish", "In progress", "Copilot streaming refinements plus add-to-cart, cart and pagination refinements currently in the working branch."],
];

const frontendBlocked = [
  ["Category-specific filter sets", "Blocked", "Needs Magento to define filterable attributes per category (e.g. welding machines vs. sprays). Frontend renders them once exposed."],
  ["Partner logo click-through", "Blocked", "Needs populated brand/manufacturer attribute data so each partner can deep-link to a non-empty supplier catalogue."],
  ["German copy sign-off", "Blocked", "DE is the source of truth; awaiting stakeholder-approved German copy before EN/FR are regenerated."],
];

const frontendNext = [
  ["Registration approval & governance UI", "Next", "Admin-side approval queue, sub-users, roles and permissions for B2B company accounts."],
  ["Richer faceted listing", "Next", "Aggregations-based facets once category attributes are available from the backend."],
  ["Configurable variant matrix", "Next", "McMaster-style attribute grid for configurable products."],
];

const frontendSection = [
  sectionHeading("1", "Frontend"),
  para(
    text(
      "The customer-facing storefront is a Next.js 16 App Router application consuming Magento REST APIs, deployed to a Vercel demo environment. The items below reflect work completed since the 10 May demo, verified against the codebase.",
    ),
  ),
  subHeading("Done", COLOR.green),
  matrixTable(frontendDone),
  subHeading("In progress", COLOR.amber),
  matrixTable(frontendInProgress),
  subHeading("Blocked / backend-defined", COLOR.red),
  matrixTable(frontendBlocked),
  subHeading("Next", COLOR.primary),
  matrixTable(frontendNext),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---- 2. Backend ----------------------------------------------------------
const backendDone = [
  ["nextPIM working session", "Done", "Developer met with nextPIM; Swagger API documentation and product-fetch credentials provided."],
  ["nextPIM → Magento product sync", "Done", "Initial product synchronisation between nextPIM and Magento completed."],
];

const backendNext = [
  ["Customer-aware pricing", "Next", "Tiered pricing resolved per customer id (negotiated net prices by customer group / account)."],
  ["Punchout module", "Next", "Procurement punchout integration (OCI / Ariba / Coupa class connectors)."],
  ["User management / approval", "Next", "Modules to review and approve newly registered B2B users."],
];

const backendBlocked = [
  ["Customer-aware pricing", "Blocked", "Depends on enventaERP for customer pricing context; no credentials or access granted yet (held by project owners)."],
  ["Punchout integration", "Blocked", "Blocked on enventaERP access/credentials from the project owners."],
];

const backendSection = [
  sectionHeading("2", "Backend — Magento + nextPIM"),
  para(
    text(
      "The commerce platform is Magento 2.4.8, with product data flowing in from nextPIM. The focus since May has been establishing the PIM integration and scoping the ERP-dependent capabilities (customer pricing and punchout).",
    ),
  ),
  subHeading("Done", COLOR.green),
  matrixTable(backendDone),
  subHeading("Next", COLOR.primary),
  matrixTable(backendNext),
  subHeading("Blocked", COLOR.red),
  matrixTable(backendBlocked),
  para(
    text(
      "Note: customer-aware pricing and punchout are scoped and sequenced, but both require integration with the enventaERP system. Access and credentials for enventaERP currently sit with the project owners and are the gating dependency for these two items.",
      { italics: true, color: COLOR.muted, size: 20 },
    ),
    { before: 120 },
  ),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---- 3. AI ---------------------------------------------------------------
const aiConversational = [
  ["AI Copilot chat", "Done", "Streaming and non-streaming conversational assistant, live in production."],
  ["Product consultation", "Done", "Answers grounded in live product, cart and order data."],
  ["In-chat cart", "Done", "Add / remove / update / view the cart directly from the conversation."],
];

const aiSearch = [
  ["Hybrid search", "Done", "Keyword (BM25) combined with semantic vector (KNN) retrieval over the catalogue."],
  ["Synonym database", "Done", "EN / DE / FR including Swiss-German spellings (e.g. 'Flex' = angle grinder)."],
  ["Error tolerance", "Done", "Typo-tolerant matching, query expansion, and LLM re-ranking of results."],
  ["Price & stock in results", "Done", "Price and availability surfaced directly within search results."],
];

const aiVision = [
  ["Image product recognition", "Done", "Shopper photo → product search."],
  ["Multilingual", "Done", "English, German, French (+ Swiss-German); unsupported languages get a polite redirect instead of wrong results."],
];

const aiReliability = [
  ["Anti-hallucination grounding", "Done", "Replies are validated against the real catalogue."],
  ["Session memory + catalogue sync", "Done", "Redis-backed session memory and webhook catalogue sync keep data fresh."],
  ["Commerce intelligence", "Done", "Order history and spare-parts identification; cross-sell and auto-enrichment available (feature-flagged)."],
];

const aiSection = [
  sectionHeading("3", "AI"),
  para(
    text(
      "The AI capabilities below are live in production. They combine conversational commerce, hybrid (keyword + semantic) search, vision and multilingual support, with grounding and reliability safeguards.",
    ),
  ),
  subHeading("Conversational AI", COLOR.green),
  matrixTable(aiConversational),
  subHeading("Search", COLOR.green),
  matrixTable(aiSearch),
  subHeading("Vision & languages", COLOR.green),
  matrixTable(aiVision),
  subHeading("Reliability & commerce", COLOR.green),
  matrixTable(aiReliability),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---- 4. Roadmap ----------------------------------------------------------
const roadmapSection = [
  sectionHeading("4", "Consolidated Roadmap — Next Milestones"),
  para(text("Sequenced across the three fronts, in priority order:")),
  bullet("Customer-aware (tiered) pricing end to end — unblock enventaERP access, resolve net prices per customer id on the backend, and reveal them on every catalogue surface to signed-in customers (the storefront already gates guest prices)."),
  bullet("Procurement punchout — implement the punchout module (OCI first) once ERP access is granted; the storefront session model already accommodates punchout launch and basket return."),
  bullet("User management & approval — backend approval modules plus the frontend admin/approval and sub-user governance UI."),
  bullet("Category-specific facets — Magento defines filterable attributes per category; the frontend renders them through the existing facet scaffold."),
  bullet("Configurable variant matrix — McMaster-style attribute grid for complex products on the PDP."),
  bullet("Catalogue enrichment — continue nextPIM → Magento data quality (images, brand attributes, partner logos) to unlock partner deep-links and richer listings."),
  spacer(160),
  rule(),
  para(
    text(
      "Prepared for SWR Handelsgesellschaft mbH stakeholders. Confidential — internal programme use only.",
      { italics: true, color: COLOR.muted, size: 18 },
    ),
    { alignment: AlignmentType.CENTER },
  ),
];

// ===========================================================================
// DOCUMENT
// ===========================================================================
const doc = new Document({
  creator: "TEIA / SWR Programme",
  title: "TEIA / SWR Programme Progress Brief — June 2026",
  description: "Progress brief across Frontend, Backend (Magento + nextPIM) and AI.",
  styles: {
    default: {
      document: { run: { font: FONT, size: 21, color: COLOR.ink } },
    },
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 } },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "TEIA / SWR Shop — Programme Progress Brief · June 2026",
                  font: FONT,
                  size: 16,
                  color: COLOR.muted,
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        ...titlePage,
        ...execSummary,
        ...frontendSection,
        ...backendSection,
        ...aiSection,
        ...roadmapSection,
      ],
    },
  ],
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "TEIA_SWR_Programme_Progress_Brief_Jun2026.docx");

const buffer = await Packer.toBuffer(doc);
writeFileSync(outPath, buffer);
console.log(`Wrote ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
