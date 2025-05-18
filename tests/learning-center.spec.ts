import { test, expect } from '@playwright/test';

test.describe('学习中心功能测试', () => {
  const learningCenterURL = '/learning-center';

  // 在每个测试用例运行前，导航到学习中心页面并登录
  test.beforeEach(async ({ page }) => {
    await page.goto('/'); // Go to homepage to login first

    // --- LOGIN LOGIC (Referencing main.spec.ts for userMenuTrigger) ---
    const openLoginModalButtonText = /Login/i;
    const loginDialogTitleText = /Login to your account/i;
    const usernameLabelText = /Username/i;
    const passwordLabelText = /Password/i;
    const loginFormSubmitButtonText = /Login/i;
    
    const userMenuTrigger = page.locator('header').getByRole('button').filter({
      has: page.locator('> div').getByText(/^[A-Z0-9]$/)
    });

    await page.getByRole('button', { name: openLoginModalButtonText }).filter({ has: page.locator('svg.lucide-log-in') }).click();
    const loginDialog = page.getByRole('dialog', { name: loginDialogTitleText });
    await expect(loginDialog).toBeVisible();
    await loginDialog.getByLabel(usernameLabelText).fill('junjiezhou1122');
    await loginDialog.getByLabel(passwordLabelText).fill('Zjj20031122');
    await loginDialog.getByRole('button', { name: loginFormSubmitButtonText }).click();
    
    await expect(userMenuTrigger).toBeVisible({ timeout: 20000 }); 
    // --- END LOGIN LOGIC ---

    console.log('Login successful, current URL after login check:', page.url());
    await page.goto(learningCenterURL);
    console.log('Navigated to Learning Center, current URL:', page.url());
    await expect(page.getByRole('heading', { name: /Learning Center|学习中心/i, level: 1 })).toBeVisible({ timeout: 10000 });
    console.log('Learning Center heading is visible.');
  });

  test('应能正确显示学习中心的初始布局和标签页', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Learning Center/i, level: 1 })).toBeVisible();
    
    // Pause before checking for the descriptive text
    await page.pause();
    
    await expect(page.getByText(/Comprehensive hub for all your learning needs|一个满足您所有学习需求的综合中心/i)).toBeVisible();

    const tabsList = page.getByRole('tablist');
    await expect(tabsList).toBeVisible();

    const universityCoursesTab = tabsList.getByRole('tab', { name: /University Courses|大学课程/i });
    await expect(universityCoursesTab).toBeVisible();
    await expect(universityCoursesTab).toHaveAttribute('data-state', 'active');

    await expect(tabsList.getByRole('tab', { name: /Online Courses|在线课程/i })).toBeVisible();
    await expect(tabsList.getByRole('tab', { name: /Learning Methods|学习方法/i })).toBeVisible();
    await expect(tabsList.getByRole('tab', { name: /Learning Tools|学习工具/i })).toBeVisible();
  });

  test.describe('大学课程标签页功能', () => {
    const addCourseButtonText = /\+ Add University Course|添加课程/i; 
    const importCsvButtonText = /Import from CSV|导入CSV/i;
    const addCourseDialogTitleText = /Add New University Course|添加新的大学课程/i; 

    test('应默认选中并显示大学课程标签内容', async ({ page }) => {
      await expect(page.locator('div[role="tabpanel"][data-orientation="horizontal"]:not([hidden])')
        .getByRole('button', { name: addCourseButtonText })).toBeVisible();
    });

    test('登录用户应能看到添加课程和导入CSV按钮', async ({ page }) => {
      await expect(page.getByRole('button', { name: addCourseButtonText })).toBeVisible();
      await expect(page.getByRole('button', { name: importCsvButtonText })).toBeVisible();
    });

    test('点击添加课程按钮应打开添加课程对话框', async ({ page }) => {
      await page.getByRole('button', { name: addCourseButtonText }).click();
      const dialog = page.getByRole('dialog', { name: addCourseDialogTitleText });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel(/University|大学/i)).toBeVisible();
      await expect(dialog.getByLabel(/Course Title|课程标题/i)).toBeVisible();
      await expect(dialog.getByRole('button', { name: /Save Course|保存课程/i })).toBeVisible(); 
    });

    test.skip('点击导入CSV按钮应打开导入CSV对话框', async ({ page }) => {
      await page.getByRole('button', { name: importCsvButtonText }).click();
    });

    // TODO: Add tests for:
    // - Successfully adding a course through the dialog form
    // - Form validation for adding a course
    // - Filtering courses
    // - Searching courses
    // - Pagination
    // - Bookmarking a course
    // - CSV upload functionality (once details are available)
  });

  // test.describe('在线课程标签页功能', () => { ... });
}); 