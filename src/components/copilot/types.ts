import type {
  CopilotSuggestedPrompt,
  CopilotOptionsRequest,
  CopilotOrderRow,
} from "@/lib/copilot-stream";

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imagePreviewUrl?: string;
  imageName?: string;
  /** Optional product cards below the prose (SKUs parsed post-reply). */
  widgetSkus?: string[];
  /** Optional order-history rows below the prose (parsed from an `order_list` reply). */
  orderRows?: CopilotOrderRow[];
  /** Backend-supplied follow-up chips, rendered (animated) once the reply settles. */
  suggestedPrompts?: CopilotSuggestedPrompt[];
  /** Required-options gate ("needs_options"); renders an inline picker under the bubble. */
  optionsRequest?: CopilotOptionsRequest;
  /** Set while assistant message is actively streaming tokens. */
  streaming?: boolean;
  createdAt: number;
}

export interface CopilotImageAttachment {
  name: string;
  mimeType: string;
  dataUrl: string;
  base64: string;
}

/** Optional page context for PDP/listing suggestion chips (D3). */
export interface CopilotPageContext {
  sku?: string;
  productName?: string;
  categoryName?: string;
}

export type {
  CopilotStatus,
  CopilotSuggestedPrompt,
  CopilotOptionsRequest,
  CopilotOptionGroup,
  CopilotOptionValue,
  CopilotOrderRow,
} from "@/lib/copilot-stream";
