import { test, expect } from '@playwright/test';

test.describe('Spreadsheet Engine E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock user to bypass Firebase Auth
    await page.addInitScript(() => {
      window.localStorage.setItem('e2e_test_user', JSON.stringify({
        uid: 'test-user-e2e',
        displayName: 'E2E Tester',
        email: 'test@example.com'
      }));
    });
  });

  test('should create a spreadsheet and allow formula entry', async ({ page }) => {
    // 1. Go to dashboard
    await page.goto('/');
    await expect(page).toHaveTitle(/Sheets/);
    
    // 2. Open Create Modal
    await page.getByRole('button', { name: '+ New Spreadsheet' }).click();
    
    // Wait for the modal input
    const titleInput = page.getByRole('textbox', { name: /Title/i });
    await expect(titleInput).toBeVisible();
    
    // Type a title and create
    const randomTitle = `E2E Test Sheet ${Date.now()}`;
    await titleInput.fill(randomTitle);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    
    // Wait for navigation to the new document
    await page.waitForURL(/\/document\/.+/);
    
    // 3. Wait for the Grid to render completely and initial Firebase payload to settle
    await expect(page.locator('role=grid')).toBeVisible();
    await expect(page.locator('th', { hasText: 'B' })).toBeVisible();
    await page.waitForTimeout(1500); // Wait for optimistic load to settle
    
    // 4. Input values and test formulas securely
    // Click A1, press Enter to enter edit mode, fill, press Enter to commit
    await page.locator('[data-cellid="A1"]').click();
    await page.keyboard.press('Enter');
    await page.locator('[data-cellid="A1"] input').fill('10');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-cellid="A1"] span')).toHaveText('10', { timeout: 10000 });
    
    // Short pause for Firebase RTDB roundtrip
    await page.waitForTimeout(500);
    
    // Do the same for A2
    await page.locator('[data-cellid="A2"]').click();
    await page.keyboard.press('Enter');
    await page.locator('[data-cellid="A2"] input').fill('20');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-cellid="A2"] span')).toHaveText('20', { timeout: 10000 });
    
    // Short pause for Firebase RTDB roundtrip
    await page.waitForTimeout(500);
    
    // Do the same for A3
    await page.locator('[data-cellid="A3"]').click();
    await page.keyboard.press('Enter');
    await page.locator('[data-cellid="A3"] input').fill('=SUM(A1,A2)');
    await page.keyboard.press('Enter');
    
    // 5. Verify the computed output of A3 is '30'
    // Give Firebase and our optimistic evaluator extra time
    await page.waitForTimeout(1500); 
    await expect(page.locator('[data-cellid="A3"] span')).toHaveText('30', { timeout: 15000 });

    
    // Verify the title is reflecting at the top
    await expect(page.getByRole('heading', { name: randomTitle })).toBeVisible();
  });
});
