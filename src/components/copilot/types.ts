export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Optional product cards below the prose (SKUs parsed post-reply). */
  widgetSkus?: string[];
  /** Set while assistant message is actively streaming tokens. */
  streaming?: boolean;
  createdAt: number;
}
