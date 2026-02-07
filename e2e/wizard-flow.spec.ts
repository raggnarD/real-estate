import { test, expect } from '@playwright/test'

test.describe('Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('should complete full wizard flow via "Continue without signing in"', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Step 1: Intro Modal - Click Get Started
    const getStartedButton = page.getByRole('button', { name: /get started/i })
    await expect(getStartedButton).toBeVisible({ timeout: 10000 })
    await expect(getStartedButton).toBeEnabled({ timeout: 10000 })
    await getStartedButton.click({ force: true })

    // Step 2: How RushRoost Works screen
    await expect(page.getByRole('heading', { name: /how rushroost works/i }).first()).toBeVisible({ timeout: 10000 })

    const nextButton = page.getByRole('button', { name: /next/i })
    await expect(nextButton).toBeVisible({ timeout: 10000 })
    await nextButton.click()

    // Step 3: Auth Step - "One Final Step" or "Sign In to Activate"
    await expect(page.getByRole('heading', { name: /one final step/i }).or(page.getByRole('heading', { name: /how rushroost works/i }))).toBeVisible({ timeout: 10000 })

    // Check for "Continue without signing in" button
    const continueWithoutSignInButton = page.getByRole('button', { name: /continue without signing in/i })
    await expect(continueWithoutSignInButton).toBeVisible({ timeout: 10000 })
    await continueWithoutSignInButton.click()

    // Step 4: Should navigate to Neighborhood Finder
    await expect(page).toHaveURL(/.*neighborhood-finder/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /neighborhood finder/i })).toBeVisible({ timeout: 10000 })
  })

  test('should go back and forth between onboarding steps', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Start wizard
    await page.getByRole('button', { name: /get started/i }).click({ force: true })

    // On "How RushRoost Works"
    await expect(page.getByRole('heading', { name: /how rushroost works/i }).first()).toBeVisible()
    await page.getByRole('button', { name: /next/i }).click()

    // On Auth screen
    await expect(page.getByRole('heading', { name: /one final step/i })).toBeVisible()

    // Click Back
    await page.getByRole('button', { name: /back/i }).click()

    // Should be back on "How RushRoost Works"
    await expect(page.getByRole('heading', { name: /how rushroost works/i }).first()).toBeVisible()
  })
})
