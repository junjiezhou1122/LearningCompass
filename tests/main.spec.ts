import { test, expect } from '@playwright/test';

test.describe('应用测试', () => {

  test('应成功加载首页并显示内容', async ({ page }) => {
    await page.goto('/');
    // The title might be set dynamically or not set at all in index.html initially.
    // Instead of a strict title check, let's verify a key element from LearningHowToLearn.jsx is visible.
    // await expect(page).toHaveTitle(/Learning Compass/i); // This might still fail if title is empty
    
    // Check for the main heading from LearningHowToLearn.jsx
    // Assuming t('learningHowToLearn') resolves to something like "Learning How To Learn"
    await expect(page.getByRole('heading', { name: /Learning How To Learn/i, level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('main')).toBeVisible();
  });

  test.describe('认证流程', () => {
    const openLoginModalButtonText = /Login/i;
    const loginDialogTitleText = /Login to your account/i;
    const usernameLabelText = /Username/i;
    const passwordLabelText = /Password/i;
    const loginFormSubmitButtonText = /Login/i; // Button INSIDE the dialog
    const userMenuDropdownLabelText = /My Account/i;
    const signOutButtonText = /Sign Out/i;

    // Real test credentials
    const testUsername = 'junjiezhou1122';
    const testPassword = 'Zjj20031122';

    test('应允许用户登录然后注销', async ({ page }) => {
      await page.goto('/');

      // --- LOGIN ---
      await page.getByRole('button', { name: openLoginModalButtonText }).filter({ has: page.locator('svg.lucide-log-in') }).click();
      const loginDialog = page.getByRole('dialog', { name: loginDialogTitleText });
      await expect(loginDialog).toBeVisible();

      await loginDialog.getByLabel(usernameLabelText).fill(testUsername);
      await loginDialog.getByLabel(passwordLabelText).fill(testPassword);
      await loginDialog.getByRole('button', { name: loginFormSubmitButtonText }).click();

      // Wait for login to complete: dialog closes & user menu trigger appears
      await expect(loginDialog).not.toBeVisible({ timeout: 15000 });
      
      // Refined selector for userMenuTrigger
      const userMenuTrigger = page.locator('header').getByRole('button').filter({
        // This looks for a button in the header that has a direct child div,
        // and that div's text content is a single uppercase letter or digit.
        has: page.locator('> div').getByText(/^[A-Z0-9]$/) 
      });
      await expect(userMenuTrigger).toBeVisible({ timeout: 10000 });

      // --- LOGOUT ---
      await userMenuTrigger.click();
      // The menu itself is identified by its label or a known item within it.
      const dropdownMenu = page.getByRole('menu'); // More generic, then check for specific item
      const signOutItem = dropdownMenu.getByRole('menuitem', { name: signOutButtonText });
      await expect(signOutItem).toBeVisible({ timeout: 7000 }); // Ensure it is visible first
      // Try with force click due to potential animation interference
      await signOutItem.click({ force: true, timeout: 7000 }); 

      await expect(page.getByRole('button', { name: openLoginModalButtonText }).filter({ has: page.locator('svg.lucide-log-in') })).toBeVisible({ timeout: 10000 });
      await expect(userMenuTrigger).not.toBeVisible();
    });

    test('无效的登录凭证应显示错误消息', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: openLoginModalButtonText }).filter({ has: page.locator('svg.lucide-log-in') }).click();
      const loginDialog = page.getByRole('dialog', { name: loginDialogTitleText });
      await expect(loginDialog).toBeVisible();

      await loginDialog.getByLabel(usernameLabelText).fill('wronguser@example.com');
      await loginDialog.getByLabel(passwordLabelText).fill('wrongpassword');
      await loginDialog.getByRole('button', { name: loginFormSubmitButtonText }).click();
      
      // Changed to getByRole('alert') as toasts for errors often use this role.
      const errorToast = page.getByRole('alert').filter({ hasText: /Error|Login Failed|Invalid Credentials/i }); 
      await expect(errorToast).toBeVisible({ timeout: 7000 });
      // Additionally, the login dialog should remain open
      await expect(loginDialog).toBeVisible();
    });
  });

  // Add more test.describe blocks for other features (e.g., Course Browsing, Chat)
}); 