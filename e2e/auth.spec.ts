import { test, expect } from '@playwright/test';

// Use a generated unique ID for concurrent test execution
const TEST_UID = `e2e-tester-${Date.now()}`;

test.describe('Authentication & Dashboard Flow', () => {
  // We mock the Firebase auth flow in our app by injecting a cookie or utilizing Playwright's route interception
  // But given it's a real Firebase project, we can test the UI elements rendering at least, 
  // or use a mock endpoint if configured. For this E2E, we'll verify the Auth page loads
  // and attempts to log in.

  test('should load the authentication page and show Google sign-in', async ({ page }) => {
    await page.goto('/auth');
    
    // Check page title and headings
    await expect(page).toHaveTitle(/Sheets/);
    await expect(page.getByRole('heading', { level: 1, name: 'Sheets' })).toBeVisible();
    await expect(page.getByText('Collaborative spreadsheets, simplified.')).toBeVisible();
    
    // Check for the Continue with Google button
    const loginBtn = page.getByRole('button', { name: /Continue with Google/i });
    await expect(loginBtn).toBeVisible();
  });

  // Note: True E2E auth against Google requires bypassing captchas/security.
  // We test the layout and routing protections instead.
  test('should redirect protected routes to auth page', async ({ page }) => {
    // Navigate to homepage without auth
    await page.goto('/');
    
    // Should be redirected to /auth
    await expect(page).toHaveURL(/.*\/auth/);
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  });
});
