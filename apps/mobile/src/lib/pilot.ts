import type { CollectionEvent } from "@waste/api-client";

export const DEFAULT_ADDRESS_QUERY = "Musterstraße 12";

const germanDate = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  weekday: "long",
});

export function formatCollectionDate(value: string): string {
  return germanDate.format(new Date(`${value}T12:00:00`));
}

export function nextCollection(
  collections: CollectionEvent[],
  today = new Date(),
): CollectionEvent | undefined {
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return [...collections]
    .filter((collection) => collection.status !== "cancelled")
    .filter((collection) => collection.effectiveDate >= localToday)
    .sort((left, right) => left.effectiveDate.localeCompare(right.effectiveDate))[0];
}
