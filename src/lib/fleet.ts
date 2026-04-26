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
  notes?: string;
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
    notes: "Used on the structural fab line. Annual gas calibration scheduled in March.",
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
    id: "metabo-w26-180-003",
    customerId: "demo",
    brand: "Metabo",
    model: "W 26-180 MVT",
    category: "power-tools",
    serial: "MET-2025-21008",
    purchasedAt: "2025-01-08",
    warrantyUntil: "2028-01-08",
    productSku: "MET-W26-180",
    maintenance: [],
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
    id: "bosch-gws-180-005",
    customerId: "demo",
    brand: "Bosch",
    model: "GWS 18V-180 PSC",
    category: "power-tools",
    serial: "BOS-2024-71190",
    purchasedAt: "2024-11-21",
    warrantyUntil: "2027-11-21",
    productSku: "BOS-GWS-18V-180",
    maintenance: [],
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
