/**
 * Service domain — returns, repairs, and machine events, unified.
 *
 * The post-purchase workflows in this storefront (returns, repair requests,
 * fleet machine history) are all the same shape at the data layer: a
 * customer-initiated case, with a status timeline, optional order/machine
 * linkage, attachments, and a resolution. Keeping them in one module means
 * the account UI can render one "service" surface instead of three disjoint
 * screens, and when the ERP / Magento RMA modules come online we only wire
 * a single repository.
 *
 * There is no ERP endpoint yet, so this module is backed by an in-process
 * Map that seeds a few demo cases when NEXT_PUBLIC_FLEET_DEMO=1. Server
 * actions (`createCase`, `addEvent`) mutate the same Map so the UI can
 * demonstrate the full happy path end-to-end during review.
 */

export type ServiceCaseKind = "return" | "repair" | "inspection";

export type ServiceCaseStatus =
  | "submitted"
  | "received"
  | "in_progress"
  | "awaiting_customer"
  | "completed"
  | "rejected";

export type ServiceCaseReason =
  | "damaged_in_transit"
  | "defective"
  | "wrong_item"
  | "not_needed"
  | "warranty"
  | "breakdown"
  | "calibration"
  | "other";

export interface ServiceAttachment {
  id: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  kind: "photo" | "document";
}

export interface ServiceEvent {
  id: string;
  at: string;
  status: ServiceCaseStatus;
  note?: string;
  author: "customer" | "swr";
}

export interface ServiceCaseLineItem {
  sku: string;
  name: string;
  qty: number;
}

export interface ServiceCase {
  id: string;
  kind: ServiceCaseKind;
  status: ServiceCaseStatus;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  reason: ServiceCaseReason;
  description: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  orderId?: string;
  orderIncrementId?: string;
  machineId?: string;
  machineLabel?: string;
  serial?: string;
  items: ServiceCaseLineItem[];
  attachments: ServiceAttachment[];
  events: ServiceEvent[];
  resolution?: string;
}

export interface ServiceCaseSummary
  extends Omit<ServiceCase, "events" | "attachments" | "items"> {
  itemCount: number;
  attachmentCount: number;
  lastEventAt: string;
}

// ---------------------------------------------------------------------------
// In-memory store with demo seed.
// Replace with Magento / ERP adapter when endpoints are available.
// ---------------------------------------------------------------------------

const demoEnabled = process.env.NEXT_PUBLIC_FLEET_DEMO === "1";

const STORE: Map<string, ServiceCase> = new Map();

function toSummary(c: ServiceCase): ServiceCaseSummary {
  const { events, attachments, items, ...rest } = c;
  const lastEvent = events[events.length - 1];
  return {
    ...rest,
    itemCount: items.reduce((a, i) => a + i.qty, 0),
    attachmentCount: attachments.length,
    lastEventAt: lastEvent?.at ?? c.updatedAt,
  };
}

function seedIfNeeded() {
  if (!demoEnabled) return;
  if (STORE.size > 0) return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const iso = (ms: number) => new Date(ms).toISOString();

  const seeds: ServiceCase[] = [
    {
      id: "SC-2026-0102",
      kind: "return",
      status: "in_progress",
      createdAt: iso(now - 9 * day),
      updatedAt: iso(now - 2 * day),
      customerId: "demo",
      reason: "damaged_in_transit",
      description:
        "Housing arrived cracked on one unit. Other three are fine — keeping those, please replace the damaged one.",
      contactName: "Anja Werner",
      contactEmail: "anja.werner@example.com",
      contactPhone: "+49 7621 55 012",
      orderId: "0000001234",
      orderIncrementId: "000001234",
      items: [
        { sku: "MET-W26-180", name: "Metabo W 26-180 MVT angle grinder", qty: 1 },
      ],
      attachments: [
        {
          id: "att-01",
          fileName: "crate-damage-front.jpg",
          sizeBytes: 2_430_000,
          mimeType: "image/jpeg",
          uploadedAt: iso(now - 9 * day),
          kind: "photo",
        },
        {
          id: "att-02",
          fileName: "crate-damage-side.jpg",
          sizeBytes: 2_020_000,
          mimeType: "image/jpeg",
          uploadedAt: iso(now - 9 * day),
          kind: "photo",
        },
      ],
      events: [
        {
          id: "ev-01",
          at: iso(now - 9 * day),
          status: "submitted",
          author: "customer",
          note: "Return request submitted via account portal.",
        },
        {
          id: "ev-02",
          at: iso(now - 8 * day),
          status: "received",
          author: "swr",
          note: "Received and logged. Pickup scheduled via DACHSER.",
        },
        {
          id: "ev-03",
          at: iso(now - 2 * day),
          status: "in_progress",
          author: "swr",
          note: "Replacement reserved. Awaiting courier return of damaged unit.",
        },
      ],
    },
    {
      id: "SC-2026-0091",
      kind: "repair",
      status: "awaiting_customer",
      createdAt: iso(now - 14 * day),
      updatedAt: iso(now - 1 * day),
      customerId: "demo",
      reason: "breakdown",
      description:
        "Torch trigger intermittent — cuts out mid-arc. Possibly water in gas line after last site job.",
      contactName: "Frank Klein",
      contactEmail: "f.klein@example.com",
      contactPhone: "+49 7621 55 014",
      machineId: "fronius-tps320i-001",
      machineLabel: "Fronius TPS 320i C Pulse",
      serial: "31170842",
      items: [],
      attachments: [
        {
          id: "att-11",
          fileName: "diagnosis-report.pdf",
          sizeBytes: 410_000,
          mimeType: "application/pdf",
          uploadedAt: iso(now - 3 * day),
          kind: "document",
        },
      ],
      events: [
        {
          id: "ev-11",
          at: iso(now - 14 * day),
          status: "submitted",
          author: "customer",
          note: "Repair request opened from fleet surface.",
        },
        {
          id: "ev-12",
          at: iso(now - 12 * day),
          status: "received",
          author: "swr",
          note: "Machine received at Lörrach workshop.",
        },
        {
          id: "ev-13",
          at: iso(now - 5 * day),
          status: "in_progress",
          author: "swr",
          note: "Torch body opened; trigger contact worn.",
        },
        {
          id: "ev-14",
          at: iso(now - 1 * day),
          status: "awaiting_customer",
          author: "swr",
          note: "Replacement trigger is €86.40. Approve to proceed — covered by warranty if trigger was supplied with the machine.",
        },
      ],
    },
    {
      id: "SC-2026-0078",
      kind: "inspection",
      status: "completed",
      createdAt: iso(now - 45 * day),
      updatedAt: iso(now - 28 * day),
      customerId: "demo",
      reason: "calibration",
      description: "Annual output calibration due per warranty terms.",
      contactName: "Anja Werner",
      contactEmail: "anja.werner@example.com",
      machineId: "ewm-tetrix-301-002",
      machineLabel: "EWM Tetrix 301 Synergic AC/DC",
      serial: "EWM-2023-44871",
      items: [],
      attachments: [],
      events: [
        {
          id: "ev-21",
          at: iso(now - 45 * day),
          status: "submitted",
          author: "customer",
        },
        {
          id: "ev-22",
          at: iso(now - 35 * day),
          status: "in_progress",
          author: "swr",
          note: "Calibration performed. ±2 A at 100/200/300 A.",
        },
        {
          id: "ev-23",
          at: iso(now - 28 * day),
          status: "completed",
          author: "swr",
          note: "Certificate filed. Next calibration due 09/2026.",
        },
      ],
      resolution: "Within tolerance. Certificate issued.",
    },
  ];

  for (const c of seeds) STORE.set(c.id, c);
}

// ---------------------------------------------------------------------------
// Public repository
// ---------------------------------------------------------------------------

export async function listCustomerCases(
  customerId = "demo",
): Promise<ServiceCaseSummary[]> {
  seedIfNeeded();
  return Array.from(STORE.values())
    .filter((c) => c.customerId === customerId)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .map(toSummary);
}

export async function getCase(
  id: string,
  customerId = "demo",
): Promise<ServiceCase | null> {
  seedIfNeeded();
  const c = STORE.get(id);
  if (!c) return null;
  if (c.customerId !== customerId) return null;
  return c;
}

export interface CreateCaseInput {
  kind: ServiceCaseKind;
  reason: ServiceCaseReason;
  description: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  orderId?: string;
  orderIncrementId?: string;
  machineId?: string;
  machineLabel?: string;
  serial?: string;
  items?: ServiceCaseLineItem[];
  attachments?: Array<{ fileName: string; sizeBytes: number; mimeType: string }>;
  customerId?: string;
}

function randomId(prefix: string): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${new Date().getFullYear()}-${n}`;
}

export async function createCase(input: CreateCaseInput): Promise<ServiceCase> {
  seedIfNeeded();
  const now = new Date().toISOString();
  const id = randomId("SC");
  const created: ServiceCase = {
    id,
    kind: input.kind,
    status: "submitted",
    createdAt: now,
    updatedAt: now,
    customerId: input.customerId ?? "demo",
    reason: input.reason,
    description: input.description,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    orderId: input.orderId,
    orderIncrementId: input.orderIncrementId,
    machineId: input.machineId,
    machineLabel: input.machineLabel,
    serial: input.serial,
    items: input.items ?? [],
    attachments: (input.attachments ?? []).map((a, i) => ({
      id: `${id}-att-${i + 1}`,
      fileName: a.fileName,
      sizeBytes: a.sizeBytes,
      mimeType: a.mimeType,
      uploadedAt: now,
      kind: a.mimeType.startsWith("image/") ? "photo" : "document",
    })),
    events: [
      {
        id: `${id}-ev-1`,
        at: now,
        status: "submitted",
        author: "customer",
        note: "Submitted via account portal.",
      },
    ],
  };
  STORE.set(id, created);
  return created;
}

export async function listCasesForOrder(
  orderId: string,
  customerId = "demo",
): Promise<ServiceCaseSummary[]> {
  const all = await listCustomerCases(customerId);
  return all.filter((c) => c.orderId === orderId);
}

export async function listCasesForMachine(
  machineId: string,
  customerId = "demo",
): Promise<ServiceCaseSummary[]> {
  const all = await listCustomerCases(customerId);
  return all.filter((c) => c.machineId === machineId);
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

export function serviceStatusTone(status: ServiceCaseStatus): string {
  switch (status) {
    case "submitted":
      return "bg-primary/10 text-primary";
    case "received":
      return "bg-primary-fixed text-primary";
    case "in_progress":
      return "bg-secondary/10 text-secondary";
    case "awaiting_customer":
      return "bg-warning/10 text-warning";
    case "completed":
      return "bg-secondary text-white";
    case "rejected":
      return "bg-error/10 text-error";
  }
}

export function serviceKindAccent(kind: ServiceCaseKind): string {
  switch (kind) {
    case "return":
      return "bg-primary text-white";
    case "repair":
      return "bg-secondary text-white";
    case "inspection":
      return "bg-warning/10 text-warning";
  }
}

export function isTerminalStatus(status: ServiceCaseStatus): boolean {
  return status === "completed" || status === "rejected";
}

export const SERVICE_STATUSES: ServiceCaseStatus[] = [
  "submitted",
  "received",
  "in_progress",
  "awaiting_customer",
  "completed",
  "rejected",
];

export const RETURN_REASONS: ServiceCaseReason[] = [
  "damaged_in_transit",
  "defective",
  "wrong_item",
  "not_needed",
  "warranty",
  "other",
];

export const REPAIR_REASONS: ServiceCaseReason[] = [
  "breakdown",
  "defective",
  "warranty",
  "calibration",
  "other",
];
