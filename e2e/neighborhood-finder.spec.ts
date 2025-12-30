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
    await expect(page.getByRole('heading', { name: /neighborhood finder/i })).toBeVisible()
  })

  test('should show work address input', async ({ page }) => {
    await page.goto('/neighborhood-finder')
    const workAddressInput = page.getByPlaceholder(/enter your work address/i)
    await expect(workAddressInput).toBeVisible()
  })

  test('should show commute time input', async ({ page }) => {
    await page.goto('/neighborhood-finder')
    // Wait for the form to be visible
    await page.waitForSelector('form', { state: 'visible' })
    // Try label first, fallback to id selector
    const commuteTimeInput = page.locator('#max-commute-time')
    await expect(commuteTimeInput).toBeVisible()
  })

  test('should display stage gate when in wizard mode', async ({ page }) => {
    // Set wizard mode and API key in localStorage before navigating
    await page.goto('/neighborhood-finder')
    await page.evaluate(() => {
      localStorage.setItem('wizard_active', 'true')
      localStorage.setItem('rushroost_api_key', 'test-api-key')
    })
    await page.reload()
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    // Stage gate should show step 1 - look for the title "Enter Your Work Address"
    await expect(page.getByText(/enter your work address/i)).toBeVisible()
  })
})

