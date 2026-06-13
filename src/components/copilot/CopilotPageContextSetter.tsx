"use client";

import { useEffect } from "react";
import type { CopilotPageContext } from "./types";
import { useCopilot } from "./CopilotProvider";

/** Mount on PDP/listing pages to inject contextual suggestion chips into CopilotPanel. */
export default function CopilotPageContextSetter({
  sku,
  productName,
  categoryName,
}: CopilotPageContext) {
  const { setPageContext } = useCopilot();

  useEffect(() => {
    setPageContext({ sku, productName, categoryName });
    return () => setPageContext(null);
  }, [sku, productName, categoryName, setPageContext]);

  return null;
}
