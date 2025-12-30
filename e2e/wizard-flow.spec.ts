import { test, expect } from '@playwright/test'

test.describe('Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('should complete full wizard flow', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Step 1: Intro Modal - Click Get Started
    const getStartedButton = page.getByRole('button', { name: /get started/i })
    await expect(getStartedButton).toBeVisible({ timeout: 10000 })
    await expect(getStartedButton).toBeEnabled({ timeout: 10000 })
    // Use force click to bypass overlay interception issues
    await getStartedButton.click({ force: true })

    // Wait for the intro modal to close and the next modal to appear
    // Wait for the "How RushRoost Works" heading to be visible
    await expect(page.getByRole('heading', { name: /how rushroost works/i }).first()).toBeVisible({ timeout: 10000 })
    
    // Wait a bit for any transitions to complete
    await page.waitForTimeout(300)
    
    // Step 2: How RushRoost Works Modal - Click Get Started to show API setup
    // Find the Get Started button in the modal (use first() to handle multiple matches)
    const setupApiKeyButton = page.getByRole('button', { name: /get started/i }).first()
    await expect(setupApiKeyButton).toBeVisible({ timeout: 10000 })
    await expect(setupApiKeyButton).toBeEnabled({ timeout: 10000 })
    
    // Use force click to bypass any overlay issues
    await setupApiKeyButton.click({ force: true })

    // Step 3: API Key Setup - Use shared key (default)
    // Use getByRole with heading to avoid strict mode violation (there are both h2 and h3 with this text)
    await expect(page.getByRole('heading', { name: /setup api key/i }).first()).toBeVisible({ timeout: 10000 })
    const saveButton = page.getByRole('button', { name: /continue/i })
    await expect(saveButton).toBeVisible({ timeout: 10000 })
    await saveButton.click()

    // Step 4: Accept Terms - wait for terms modal
    // Use getByRole with heading to avoid strict mode violation (there are multiple elements with "terms" text)
    await expect(page.getByRole('heading', { name: /terms.*conditions/i })).toBeVisible({ timeout: 10000 })
    // Check the checkbox first
    const checkbox = page.getByLabel(/i accept/i).or(page.locator('input[type="checkbox"]'))
    await expect(checkbox).toBeVisible({ timeout: 10000 })
    await checkbox.check()
    // Then click accept button
    const acceptButton = page.getByRole('button', { name: /accept.*activate/i })
    await expect(acceptButton).toBeVisible({ timeout: 10000 })
    await expect(acceptButton).toBeEnabled({ timeout: 10000 })
    await acceptButton.click()

    // Step 5: Should navigate to Neighborhood Finder
    await expect(page).toHaveURL(/.*neighborhood-finder/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /neighborhood finder/i })).toBeVisible({ timeout: 10000 })
  })

  test('should allow entering custom API key', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Navigate to API setup
    const getStartedButton1 = page.getByRole('button', { name: /get started/i })
    await expect(getStartedButton1).toBeVisible({ timeout: 10000 })
    await expect(getStartedButton1).toBeEnabled({ timeout: 10000 })
    // Use force click to bypass overlay interception issues
    await getStartedButton1.click({ force: true })

    // After clicking Get Started on intro modal, the "How RushRoost Works" modal appears
    // Wait for it and click "Get Started" again to show API setup (use first() to handle multiple matches)
    await expect(page.getByRole('heading', { name: /how rushroost works/i }).first()).toBeVisible({ timeout: 10000 })
    
    // Wait a bit for any transitions to complete
    await page.waitForTimeout(300)
    
    const getStartedButton2 = page.getByRole('button', { name: /get started/i }).first()
    await expect(getStartedButton2).toBeVisible({ timeout: 10000 })
    await expect(getStartedButton2).toBeEnabled({ timeout: 10000 })
    
    // Use force click to bypass any overlay issues
    await getStartedButton2.click({ force: true })

    // Wait for API setup form
    // Use getByRole with heading to avoid strict mode violation (there are both h2 and h3 with this text)
    await expect(page.getByRole('heading', { name: /setup api key/i }).first()).toBeVisible({ timeout: 10000 })

    // Select "My Own API Key" option
    const ownKeyRadio = page.getByLabel(/my own api key/i)
    await expect(ownKeyRadio).toBeVisible({ timeout: 10000 })
    await ownKeyRadio.click()

    // Enter API key
    const apiKeyInput = page.getByPlaceholder(/enter your api key/i)
    await expect(apiKeyInput).toBeVisible({ timeout: 10000 })
    await apiKeyInput.fill('test-api-key-12345')

    // Save - button text is "Continue" not "Save and Continue"
    const continueButton = page.getByRole('button', { name: /continue/i })
    await expect(continueButton).toBeVisible({ timeout: 10000 })
    await expect(continueButton).toBeEnabled({ timeout: 10000 })
    await continueButton.click()

    // Should navigate to Neighborhood Finder
    await expect(page).toHaveURL(/.*neighborhood-finder/, { timeout: 15000 })
  })
})

