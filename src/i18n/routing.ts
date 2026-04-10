import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en", "fr"],
  defaultLocale: "de",
});

export type Locale = (typeof routing.locales)[number];
