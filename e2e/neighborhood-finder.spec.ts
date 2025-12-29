import { test, expect } from '@playwright/test'

test.describe('Neighborhood Finder', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API key in localStorage
    await page.goto('/neighborhood-finder')
    await page.evaluate(() => {
      localStorage.setItem('rushroost_api_key', 'test-api-key')
    })
  })

  test('should display neighborhood finder page', async ({ page }) => {
    await page.goto('/neighborhood-finder')
    await expect(page.getByText(/neighborhood finder/i)).toBeVisible()
  })

  test('should show work address input', async ({ page }) => {
    await page.goto('/neighborhood-finder')
    const workAddressInput = page.getByPlaceholder(/enter your work address/i)
    await expect(workAddressInput).toBeVisible()
  })

  test('should show commute time input', async ({ page }) => {
    await page.goto('/neighborhood-finder')
    const commuteTimeInput = page.getByPlaceholder(/max commute time/i)
    await expect(commuteTimeInput).toBeVisible()
  })

  test('should display stage gate when in wizard mode', async ({ page }) => {
    await page.goto('/neighborhood-finder')
    // Stage gate should show step 1
    await expect(page.getByText(/step 1/i)).toBeVisible()
  })
})

