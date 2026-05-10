"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

export interface CustomerSessionContextValue {
  /** True when `swr_customer_token` was present on the server render. */
  isAuthenticated: boolean;
}

const CustomerSessionContext =
  createContext<CustomerSessionContextValue | null>(null);

export function CustomerSessionProvider({
  children,
  isAuthenticated,
}: {
  children: ReactNode;
  isAuthenticated: boolean;
}) {
  return (
    <CustomerSessionContext.Provider value={{ isAuthenticated }}>
      {children}
    </CustomerSessionContext.Provider>
  );
}

export function useCustomerSession(): CustomerSessionContextValue {
  const ctx = useContext(CustomerSessionContext);
  if (!ctx) {
    throw new Error(
      "useCustomerSession must be used within CustomerSessionProvider",
    );
  }
  return ctx;
}
