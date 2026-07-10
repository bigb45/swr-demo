import { notFound } from "next/navigation";

/** Unmatched paths under a locale prefix (e.g. `/en/customs`) → localized 404. */
export default function CatchAllPage() {
  notFound();
}
