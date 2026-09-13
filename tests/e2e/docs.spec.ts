import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`mobile reading navigation closes and restores focus: ${reducedMotion}`, async ({page}) => {
    await page.setViewportSize({width:390, height:844});
    await page.emulateMedia({reducedMotion});
    await page.goto('/quick-start');
    const toggle = page.getByRole('button', {name:'Toggle navigation bar'});
    await toggle.click();
    await expect(page.locator('.navbar')).toHaveClass(/navbar-sidebar--show/);
    await page.keyboard.press('Escape');
    await expect(page.locator('.navbar')).not.toHaveClass(/navbar-sidebar--show/);
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.getByRole('button', {name:'Close navigation bar'}).click();
    await expect(page.locator('.navbar')).not.toHaveClass(/navbar-sidebar--show/);
    await expect(toggle).toBeFocused();
  });
}

for (const width of [320,390,768]) {
  test(`entry actions remain inside ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    const actions = page.locator('header a');
    await expect(actions.first()).toHaveText('Quick Start');
    for (const action of await actions.all()) {
      const box = await action.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(16);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width - 16);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('copy retains the exact authored multiline command', async ({page, context}) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/quick-start');
  const source = readFileSync('docs/quick-start.md', 'utf8');
  const expected = source.match(/```bash\n([\s\S]*?)\n```/)![1];
  await page.getByRole('button',{name:'Copy code to clipboard'}).first().click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
});

test('existing navigation retrieves configuration, adapter and planned feature', async ({page}) => {
  await page.goto('/intro');
  const sidebar = page.locator('.theme-doc-sidebar-container');
  await sidebar.getByRole('link', {name:'Configuration', exact:true}).click();
  await expect(page.locator('article')).toContainText('FORNAX_HTTP_PORT');
  await sidebar.getByRole('link', {name:'OpenCode integration', exact:true}).click();
  await expect(page).toHaveURL(/\/opencode-integration$/);
  await sidebar.getByRole('button', {name:/Planned \(v0\.0\.4/}).click();
  await sidebar.getByRole('link', {name:'Evidence graph (planned)', exact:true}).click();
  await expect(page.getByRole('heading', {level:1})).toContainText('planned for v0.0.4');
});
