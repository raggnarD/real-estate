import { test, expect } from '@playwright/test'

test.describe('Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('should complete full wizard flow', async ({ page }) => {
    await page.goto('/')

    // Step 1: Intro Modal - Click Get Started
    const getStartedButton = page.getByRole('button', { name: /get started/i })
    await expect(getStartedButton).toBeVisible()
    await getStartedButton.click()

    // Step 2: How RushRoost Works Modal - Click Get Started to show API setup
    // Wait for the modal to appear
    await expect(page.getByRole('heading', { name: /how rushroost works/i })).toBeVisible()
    // Find the Get Started button in the modal (use first() to handle multiple matches)
    const setupApiKeyButton = page.getByRole('button', { name: /get started/i }).first()
    await expect(setupApiKeyButton).toBeVisible()
    await setupApiKeyButton.click()

    // Step 3: API Key Setup - Use shared key (default)
    await expect(page.getByText(/setup api key/i)).toBeVisible()
    const saveButton = page.getByRole('button', { name: /continue/i })
    await saveButton.click()

    // Step 4: Accept Terms
    const acceptButton = page.getByRole('button', { name: /accept.*activate/i })
    await acceptButton.click()

    // Step 5: Should navigate to Neighborhood Finder
    await expect(page).toHaveURL(/.*neighborhood-finder/)
    await expect(page.getByRole('heading', { name: /neighborhood finder/i })).toBeVisible()
  })

  test('should allow entering custom API key', async ({ page }) => {
    await page.goto('/')

    // Navigate to API setup
    await page.getByRole('button', { name: /get started/i }).click()
    // After clicking Get Started on intro modal, the "How RushRoost Works" modal appears
    // Wait for it and click "Get Started" again to show API setup
    await expect(page.getByRole('heading', { name: /how rushroost works/i })).toBeVisible()
    const getStartedButton = page.getByRole('button', { name: /get started/i }).first()
    await expect(getStartedButton).toBeVisible()
    await getStartedButton.click()

    // Select "My Own API Key" option
    const ownKeyRadio = page.getByLabel(/my own api key/i)
    await ownKeyRadio.click()

    // Enter API key
    const apiKeyInput = page.getByPlaceholder(/enter your api key/i)
    await apiKeyInput.fill('test-api-key-12345')

    // Save - button text is "Continue" not "Save and Continue"
    await page.getByRole('button', { name: /continue/i }).click()

    // Should navigate to Neighborhood Finder
    await expect(page).toHaveURL(/.*neighborhood-finder/)
  })
})

