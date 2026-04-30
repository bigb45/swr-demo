// Customer fleet (registered machines) repository.
//
// "My Fleet" is the part of the customer account where service-heavy industrial
// buyers see the machines they own, their warranty status, and their
// maintenance history. The production source will most likely be a custom
// Magento `CustomerMachine` module (linked to invoices) or an EDE service
// feed — neither exists yet, so we hide the data source behind this module and
// ship a deterministic demo seed for the prototype.
//
// Toggle the demo with `NEXT_PUBLIC_FLEET_DEMO=1` so screenshots are reliable.

export type MachineCategory =
  | "welding"
  | "power-tools"
  | "pneumatic"
  | "machines"
  | "measuring"
  | "safety";

export type WarrantyStatus = "active" | "expiring" | "expired";

export type MaintenanceKind =
  | "service"
  | "repair"
  | "calibration"
  | "inspection"
  | "warranty";

export interface MaintenanceRecord {
  id: string;
  date: string; // ISO date
  kind: MaintenanceKind;
  title: string;
  notes?: string;
  technician?: string;
  documentId?: string; // optional /catalog/[id] reference (e.g. service report)
}

export interface Machine {
  id: string;
  customerId: string; // opaque identifier; matched to the signed-in customer
  brand: string;
  model: string;
  category: MachineCategory;
  serial: string;
  purchasedAt: string; // ISO date
  warrantyUntil: string; // ISO date
  productSku?: string; // links back to /products/[sku] if applicable
  imageUrl?: string;
  /** Short line shown under the title (deployment / line assignment). */
  notes?: string;
  /** Key technical values for the customer-facing detail page (power, size, etc.). */
  specs?: { key: string; value: string }[];
  maintenance: MaintenanceRecord[];
}

export function warrantyStatus(machine: Machine, today = new Date()): WarrantyStatus {
  const end = new Date(machine.warrantyUntil);
  const ms90 = 90 * 24 * 60 * 60 * 1000;
  if (end.getTime() < today.getTime()) return "expired";
  if (end.getTime() - today.getTime() < ms90) return "expiring";
  return "active";
}

// Deterministic demo seed: shown when NEXT_PUBLIC_FLEET_DEMO=1.
// Set NEXT_PUBLIC_FLEET_DEMO=1 in .env.local to exercise repair / pick / fleet flows.
const DEMO_MACHINES: Machine[] = [
  {
    id: "fronius-tps320i-001",
    customerId: "demo",
    brand: "Fronius",
    model: "TPS 320i C Pulse",
    category: "welding",
    serial: "31170842",
    purchasedAt: "2024-03-12",
    warrantyUntil: "2027-03-12",
    productSku: "FRO-TPS-320i",
    notes: "Bay 2 — structural fabrication. 50/50 Ar/CO₂ mix, Euro central connector.",
    specs: [
      { key: "Process", value: "MIG/MAG pulse, 4-roll drive" },
      { key: "Welding current", value: "3–320 A" },
      { key: "Mains", value: "3×400 V 50/60 Hz, 32 A" },
      { key: "Open-circuit voltage", value: "≤ 100 V" },
      { key: "Protection class", value: "IP 23" },
    ],
    maintenance: [
      {
        id: "fronius-tps320i-001-m1",
        date: "2025-03-18",
        kind: "service",
        title: "Annual service & gas calibration",
        technician: "M. Becker",
        notes: "Wire feed roller pack replaced. Pulse program library updated to 2025.04.",
      },
      {
        id: "fronius-tps320i-001-m2",
        date: "2024-09-04",
        kind: "repair",
        title: "Torch trigger replacement",
        technician: "F. Klein",
        notes: "Customer-supplied torch — covered under torch warranty.",
      },
    ],
  },
  {
    id: "ewm-tetrix-301-002",
    customerId: "demo",
    brand: "EWM",
    model: "Tetrix 301 Synergic AC/DC",
    category: "welding",
    serial: "EWM-2023-44871",
    purchasedAt: "2023-08-22",
    warrantyUntil: "2026-08-22",
    productSku: "EWM-TETRIX-301",
    notes: "Mobile repair cart — TIG and stick for stainless / aluminium on-site jobs.",
    specs: [
      { key: "Process", value: "TIG AC/DC, stick (MMA)" },
      { key: "Output range", value: "5–300 A" },
      { key: "Duty cycle", value: "300 A @ 40% @ 25 °C" },
      { key: "Weight", value: "19.1 kg" },
    ],
    maintenance: [
      {
        id: "ewm-tetrix-301-002-m1",
        date: "2025-09-30",
        kind: "calibration",
        title: "Output current calibration",
        technician: "M. Becker",
        notes: "Within ±2 A at 100 / 200 / 300 A reference points. Certificate filed.",
      },
    ],
  },
  {
    id: "lorch-spro-500-006",
    customerId: "demo",
    brand: "Lorch",
    model: "S-Pro 500",
    category: "welding",
    serial: "LOR-SP500-DE-2024-0018",
    purchasedAt: "2024-05-20",
    warrantyUntil: "2029-05-20",
    productSku: "LOR-SPRO-500",
    notes: "Main shipyard hall — long seams on S355 and duplex sheet.",
    specs: [
      { key: "Process", value: "MIG/MAG pulsed, 4-roll" },
      { key: "Current range", value: "20–500 A" },
      { key: "Wire", value: "Ø 0.8–1.6 mm" },
      { key: "Mains", value: "3×400 V, 44 kVA max." },
    ],
    maintenance: [
      {
        id: "lorch-spro-500-006-m1",
        date: "2025-04-10",
        kind: "service",
        title: "Cooling unit flush & recirculation test",
        technician: "F. Klein",
      },
    ],
  },
  {
    id: "esab-renegade-et300-007",
    customerId: "demo",
    brand: "ESAB",
    model: "Renegade ET 300i PFC",
    category: "welding",
    serial: "ESAB-RG-ET300-11492",
    purchasedAt: "2019-11-10",
    warrantyUntil: "2024-11-10",
    productSku: "ESAB-RG-ET300",
    notes: "Field kit — 230/400 V. Out of standard warranty; service contract SWR-2024.",
    specs: [
      { key: "Process", value: "Stick (MMA), Lift-TIG" },
      { key: "Output", value: "10–300 A" },
      { key: "OCV", value: "≤ 80 V" },
      { key: "Weight", value: "9.1 kg" },
    ],
    maintenance: [
      {
        id: "esab-renegade-et300-007-m1",
        date: "2024-08-12",
        kind: "repair",
        title: "Rectifier module replacement",
        technician: "M. Becker",
        notes: "Dehumidifier kit fitted for outdoor use.",
      },
    ],
  },
  {
    id: "metabo-w26-180-003",
    customerId: "demo",
    brand: "Metabo",
    model: "W 26-180 MVT",
    category: "power-tools",
    serial: "MET-2025-21008",
    purchasedAt: "2025-01-08",
    warrantyUntil: "2028-01-08",
    productSku: "MET-W26-180",
    notes: "180 mm corded angle grinder — deburring and weld prep in stainless area.",
    specs: [
      { key: "Disc Ø", value: "180 mm" },
      { key: "Power", value: "2600 W" },
      { key: "No-load speed", value: "8500 / min" },
      { key: "Mains", value: "230 V" },
      { key: "Weight", value: "5.5 kg" },
    ],
    maintenance: [],
  },
  {
    id: "bosch-gws-180-005",
    customerId: "demo",
    brand: "Bosch",
    model: "GWS 18V-180 PSC",
    category: "power-tools",
    serial: "BOS-2024-71190",
    purchasedAt: "2024-11-21",
    warrantyUntil: "2027-11-21",
    productSku: "BOS-GWS-18V-180",
    notes: "ProCORE 8.0 Ah. Assigned to site container build-out crew.",
    specs: [
      { key: "Disc Ø", value: "180 mm" },
      { key: "Battery", value: "18 V (2× 8.0 Ah)" },
      { key: "No-load speed", value: "8500 / min" },
      { key: "Weight (incl. battery)", value: "2.8 kg" },
    ],
    maintenance: [],
  },
  {
    id: "makita-ga9040r-008",
    customerId: "demo",
    brand: "Makita",
    model: "GA9040R",
    category: "power-tools",
    serial: "MK-GA9-2019-778",
    purchasedAt: "2019-03-14",
    warrantyUntil: "2026-05-20",
    productSku: "MK-GA9040R",
    notes: "230 mm — heavy bevelling. Warranty end within 90 days: plan inspection.",
    specs: [
      { key: "Disc Ø", value: "230 mm" },
      { key: "Power", value: "2600 W" },
      { key: "No-load speed", value: "8500 / min" },
      { key: "Spindle", value: "M 14" },
    ],
    maintenance: [
      {
        id: "makita-ga9040r-008-m1",
        date: "2024-12-01",
        kind: "inspection",
        title: "Armature runout check after bearing noise",
        technician: "F. Klein",
      },
    ],
  },
  {
    id: "hilti-ag125-15-009",
    customerId: "demo",
    brand: "Hilti",
    model: "AG 125-15 (AVC+)",
    category: "power-tools",
    serial: "HIL-AG125-880021",
    purchasedAt: "2025-02-18",
    warrantyUntil: "2027-02-18",
    productSku: "HIL-AG125-15",
    notes: "125 mm with anti-vibration side handle — close-quarter grinding.",
    specs: [
      { key: "Disc Ø", value: "125 mm" },
      { key: "Power", value: "1500 W" },
      { key: "No-load speed", value: "11000 / min" },
    ],
    maintenance: [],
  },
  {
    id: "dewalt-dcd796-010",
    customerId: "demo",
    brand: "DeWalt",
    model: "DCD796P2T Combi drill",
    category: "power-tools",
    serial: "DW-DCD796-2024-5521",
    purchasedAt: "2024-04-01",
    warrantyUntil: "2027-04-01",
    productSku: "DW-DCD796P2T",
    notes: "2× 5.0 Ah XR, hammer mode for M8–M12 anchors in concrete.",
    specs: [
      { key: "Max torque (hard/soft)", value: "70 / 27 Nm" },
      { key: "Chuck", value: "1.5–13 mm metal" },
      { key: "Strokes", value: "0–3400 / min" },
      { key: "Battery", value: "18 V XR" },
    ],
    maintenance: [],
  },
  {
    id: "flott-sb8-012",
    customerId: "demo",
    brand: "Flott",
    model: "SB 8 P",
    category: "machines",
    serial: "FLO-SB8-1988-004",
    purchasedAt: "2018-06-01",
    warrantyUntil: "2021-06-01",
    productSku: "FLO-SB8P",
    notes: "Column drill, belt drive. Off warranty; annual guard interlock test required.",
    specs: [
      { key: "Spindle taper", value: "MK 2" },
      { key: "Throat", value: "170 mm" },
      { key: "Quill travel", value: "120 mm" },
      { key: "Motor", value: "0.9 kW 400 V" },
    ],
    maintenance: [
      {
        id: "flott-sb8-012-m1",
        date: "2025-01-20",
        kind: "inspection",
        title: "E-stop and belt guard interlock",
        technician: "External — SWR",
      },
    ],
  },
  {
    id: "aircraft-airprofi-3-602-004",
    customerId: "demo",
    brand: "Aircraft",
    model: "Airprofi 703/270/10 V",
    category: "pneumatic",
    serial: "AIR-COMP-99012",
    purchasedAt: "2022-06-15",
    warrantyUntil: "2025-06-15",
    productSku: "AIR-AIRPROFI-703",
    notes: "Ring line feed at 10 bar. Warranty lapsed; service agreement covers oil & filters.",
    specs: [
      { key: "Receiver", value: "270 l" },
      { key: "Flow / pressure", value: "703 l/min @ 10 bar" },
      { key: "Motor", value: "5.5 kW" },
      { key: "Sound pressure", value: "72 dB(A)" },
    ],
    maintenance: [
      {
        id: "aircraft-airprofi-3-602-004-m1",
        date: "2025-05-02",
        kind: "service",
        title: "Compressor service & oil change",
        technician: "F. Klein",
      },
      {
        id: "aircraft-airprofi-3-602-004-m2",
        date: "2024-05-14",
        kind: "inspection",
        title: "Annual pressure vessel inspection",
        technician: "External — TÜV Süd",
        notes: "Next inspection due 05/2026.",
      },
    ],
  },
  {
    id: "ata-215a-020",
    customerId: "demo",
    brand: "ATA",
    model: "215A HD angle die grinder",
    category: "pneumatic",
    serial: "ATA-215-44102",
    purchasedAt: "2021-01-20",
    warrantyUntil: "2026-07-10",
    productSku: "ATA-215A-HD",
    notes: "Locksmith area — 125 mm with exhaust over hose.",
    specs: [
      { key: "Collet / disc", value: "6 mm / up to 125 mm" },
      { key: "Free speed", value: "12000 / min" },
      { key: "Air cons.", value: "18 l/s @ 6.3 bar" },
    ],
    maintenance: [
      {
        id: "ata-215a-020-m1",
        date: "2025-02-11",
        kind: "service",
        title: "Vane set + governor clean",
        technician: "F. Klein",
      },
    ],
  },
  {
    id: "mitutoyo-500-014",
    customerId: "demo",
    brand: "Mitutoyo",
    model: "QuantuMike IP65 0–150 mm",
    category: "measuring",
    serial: "MTY-QM-150-88301",
    purchasedAt: "2022-10-10",
    warrantyUntil: "2027-10-10",
    productSku: "MTY-QM-150-IP65",
    notes: "QA incoming inspection. Due ISO 17025 lab calibration Feb each year.",
    specs: [
      { key: "Range / resolution", value: "0–150 mm / 0.001 mm" },
      { key: "Accuracy", value: "±2 µm" },
      { key: "Protection", value: "IP65" },
    ],
    maintenance: [
      {
        id: "mitutoyo-500-014-m1",
        date: "2025-02-05",
        kind: "calibration",
        title: "DIN EN ISO 17025 length calibration",
        technician: "External — DAkkS lab",
        notes: "Valid until 2026-02-04.",
      },
    ],
  },
];

export interface FleetRepository {
  listForCustomer(customerId: string): Promise<Machine[]>;
  getMachine(id: string): Promise<Machine | null>;
}

const demoEnabled = process.env.NEXT_PUBLIC_FLEET_DEMO === "1";

const demoRepository: FleetRepository = {
  async listForCustomer() {
    return DEMO_MACHINES;
  },
  async getMachine(id) {
    return DEMO_MACHINES.find((m) => m.id === id) ?? null;
  },
};

const emptyRepository: FleetRepository = {
  async listForCustomer() {
    return [];
  },
  async getMachine() {
    return null;
  },
};

export const fleetRepository: FleetRepository = demoEnabled
  ? demoRepository
  : emptyRepository;

export async function listCustomerMachines(customerId = "demo"): Promise<Machine[]> {
  return fleetRepository.listForCustomer(customerId);
}

export async function getCustomerMachine(id: string): Promise<Machine | null> {
  return fleetRepository.getMachine(id);
}
