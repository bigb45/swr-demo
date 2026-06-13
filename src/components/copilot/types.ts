export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imagePreviewUrl?: string;
  imageName?: string;
  /** Optional product cards below the prose (SKUs parsed post-reply). */
  widgetSkus?: string[];
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
