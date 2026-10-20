import { Preferences } from "@capacitor/preferences";

const ADDRESS_QUERY_KEY = "pilot-address-query";

export async function loadAddressQuery(): Promise<string | undefined> {
  const result = await Preferences.get({ key: ADDRESS_QUERY_KEY });
  return result.value?.trim() || undefined;
}

export async function saveAddressQuery(value: string): Promise<void> {
  await Preferences.set({ key: ADDRESS_QUERY_KEY, value: value.trim() });
}
