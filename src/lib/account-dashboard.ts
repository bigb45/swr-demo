import { listCustomerMachines, warrantyStatus } from "@/lib/fleet";
import { listCustomerQuotations } from "@/lib/quotations";
import { getCustomerEmail, listCustomerOrders } from "@/lib/orders";
import type { MagentoOrderSummary } from "@/types/magento";

/** Order states treated as closed for the “active logistics” badge on /account. */
const TERMINAL_ORDER_STATUSES = new Set(["complete", "canceled", "closed"]);

export interface AccountDashboardStats {
  activeOrders: number;
  pendingQuotations: number;
  fleetAlerts: number;
}

export async function getAccountDashboardStats(
  customerToken: string,
): Promise<AccountDashboardStats> {
  const email = await getCustomerEmail(customerToken);
  let activeOrders = 0;
  if (email) {
    const orders = await listCustomerOrders(email);
    activeOrders = orders.filter(
      (o: MagentoOrderSummary) => !TERMINAL_ORDER_STATUSES.has(o.status),
    ).length;
  }

  const quotations = await listCustomerQuotations(customerToken);
  const pendingQuotations = quotations.filter((q) => q.status === "open").length;

  const machines = await listCustomerMachines();
  const fleetAlerts = machines.filter((m) => {
    const w = warrantyStatus(m);
    return w === "expiring" || w === "expired";
  }).length;

  return { activeOrders, pendingQuotations, fleetAlerts };
}
