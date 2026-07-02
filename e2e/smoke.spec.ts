import { test, expect } from "@playwright/test";

test("explains a weekday-morning cron with runs and breakdown", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Cron expression").fill("0 9 * * 1-5");

  await expect(page.getByText("At 09:00 every Monday through Friday.")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Next \d+ runs/ })).toBeVisible();
  await expect(page.getByText("Field breakdown")).toBeVisible();
  await expect(page.getByText("Monday through Friday", { exact: true })).toBeVisible();
});

test("shows an actionable error for an invalid expression", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Cron expression").fill("61 * * * *");

  await expect(page.getByText("Invalid cron expression")).toBeVisible();
  await expect(page.getByText(/Minute field/)).toBeVisible();
});

test("clicking an example fills the input", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Every 5 minutes" }).click();

  await expect(page.getByLabel("Cron expression")).toHaveValue("*/5 * * * *");
  await expect(page.getByText("Every 5 minutes.")).toBeVisible();
});

test("exposes copy actions and a custom start control", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Copy as Markdown" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy share link" })).toBeVisible();

  await page.getByLabel("Custom").check();
  await expect(page.getByLabel("Custom start date and time")).toBeVisible();
});

test("6-field dialect understands a seconds expression", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Dialect").selectOption("standard-6-field");
  await page.getByLabel("Cron expression").fill("*/30 * * * * *");

  await expect(page.getByText("Every 30 seconds.")).toBeVisible();
  await expect(page.getByText("Second", { exact: true })).toBeVisible();
});
