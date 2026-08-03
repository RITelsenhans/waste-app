export const TEST_ACCESS_PASSWORD = ["browser", "fixture", "not", "a", "secret"].join("-");
export const TEST_SESSION_SECRET = Array.from({ length: 48 }, (_, index) =>
  String.fromCharCode(65 + (index % 26)),
).join("");
