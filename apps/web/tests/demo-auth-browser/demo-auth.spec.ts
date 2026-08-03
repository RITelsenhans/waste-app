import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  createDemoSession,
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_MAX_AGE_SECONDS,
} from "../../lib/demo-auth";
import { TEST_ACCESS_PASSWORD, TEST_SESSION_SECRET } from "./fixture";

async function logIn(page: import("@playwright/test").Page) {
  await page.goto("/demo");
  await page.getByLabel("Passwort").fill(TEST_ACCESS_PASSWORD);
  await page.getByRole("button", { name: "Demo öffnen" }).click();
  await expect(page).toHaveURL(/\/demo$/);
}

test("leitet Seiten und API ohne Anmeldung zur geschützten Demo um", async ({ page, request }) => {
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fdemo$/);
  await expect(page.getByRole("heading", { name: "Abfall APP Demo" })).toBeVisible();

  const apiResponse = await request.get("/v1/health/ready");
  expect(apiResponse.status()).toBe(401);
});

test("weist ein falsches Passwort zurück", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Passwort").fill("absichtlich-falsch");
  await page.getByRole("button", { name: "Demo öffnen" }).click();

  await expect(page.getByRole("alert")).toContainText("nicht korrekt");
  await expect(page).toHaveURL(/\/login\?error=invalid/);
});

test("meldet an, leitet die API gleichursprünglich weiter und deaktiviert Admin", async ({
  context,
  page,
}) => {
  await logIn(page);
  await expect(page.getByLabel("Kommune auswählen")).toHaveValue("demo");

  const healthResponse = await page.request.get("/v1/health/ready");
  expect(healthResponse.status()).toBe(200);
  await expect(healthResponse.json()).resolves.toMatchObject({ status: "ready" });

  const adminResponse = await page.request.get("/v1/admin/collections?tenantId=demo");
  expect(adminResponse.status()).toBe(403);

  const sessionCookie = (await context.cookies()).find(
    (cookie) => cookie.name === DEMO_SESSION_COOKIE,
  );
  expect(sessionCookie).toMatchObject({ httpOnly: true, sameSite: "Strict" });
});

test("meldet die Sitzung wieder ab", async ({ page }) => {
  await logIn(page);
  await page.getByRole("button", { name: "Abmelden" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fdemo$/);
});

test("verweigert manipulierte und abgelaufene Cookies", async ({ context, page }) => {
  await context.addCookies([
    {
      name: DEMO_SESSION_COOKIE,
      url: "http://127.0.0.1:14000",
      value: "v1.9999999999.manipuliert",
    },
  ]);
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fdemo$/);

  const expiredSession = createDemoSession(
    {
      DEMO_ACCESS_PASSWORD: TEST_ACCESS_PASSWORD,
      DEMO_SESSION_SECRET: TEST_SESSION_SECRET,
    },
    Date.now() - (DEMO_SESSION_MAX_AGE_SECONDS + 60) * 1_000,
  );
  await context.addCookies([
    {
      name: DEMO_SESSION_COOKIE,
      url: "http://127.0.0.1:14000",
      value: expiredSession ?? "",
    },
  ]);
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fdemo$/);
});

test("@a11y hat auf der Anmeldeseite keine automatisch erkennbaren WCAG-Verstöße", async ({
  page,
}) => {
  await page.goto("/login");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("startet im Freigabemodus keine Pflegeoberfläche", async () => {
  await expect(
    fetch("http://127.0.0.1:14001", { signal: AbortSignal.timeout(1_000) }),
  ).rejects.toThrow();
});
