const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001';
const SHOT = 'D:/mjuk-lov/.claude/skills/playwright-skill/shots';

const results = [];
function log(s) { console.log(s); results.push(s); }

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 120 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const fs = require('fs');
  if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });

  try {
    // ---- STEP 1: Go to /sv/logga-in ----
    log('\n===== STEP 1: /sv/logga-in =====');
    await page.goto(`${TARGET_URL}/sv/logga-in`, { waitUntil: 'networkidle', timeout: 20000 });
    log('Title: ' + await page.title());
    await page.screenshot({ path: `${SHOT}/01-login.png`, fullPage: true });
    log('Screenshot: 01-login.png');

    // Inventory of fields/buttons on the page
    const pwField = page.locator('input[type="password"]').first();
    const pwCount = await page.locator('input[type="password"]').count();
    log('Password fields found: ' + pwCount);

    // ---- STEP 2: Eye toggle ----
    log('\n===== STEP 2: Password eye toggle =====');
    const typeBefore = await pwField.getAttribute('type');
    log('Password input type before toggle: ' + typeBefore);

    // Fill something so the toggle effect is visible
    await pwField.fill('SecretPass123');

    // Find the toggle button. It's likely a button sibling within the password wrapper.
    // Try several strategies.
    let toggle = null;
    const candidates = [
      page.getByRole('button', { name: /visa|dölj|show|hide|lösenord|password/i }),
      page.locator('button[aria-label*="lösenord" i]'),
      page.locator('input[type="password"]').locator('xpath=following-sibling::button'),
      page.locator('input[type="password"]').locator('xpath=../button'),
      page.locator('input[type="password"]').locator('xpath=..').locator('button'),
    ];
    for (const c of candidates) {
      try { if (await c.count() > 0) { toggle = c.first(); break; } } catch (e) {}
    }

    if (!toggle) {
      log('TOGGLE: No obvious toggle button found via standard selectors. Dumping buttons near password field.');
      const wrapperButtons = await page.locator('input[type="password"]').locator('xpath=..').locator('button').count();
      log('Buttons inside password parent: ' + wrapperButtons);
    } else {
      const tlabel = (await toggle.getAttribute('aria-label')) || (await toggle.innerText().catch(()=> '')) || '(no label)';
      log('TOGGLE candidate found. label/text: ' + tlabel.trim());
      await toggle.click();
      await page.waitForTimeout(300);
      // After clicking, the input may have changed to text. Re-query by placeholder to track same field.
      const fieldByPlaceholder = page.locator('input[placeholder="Lösenord"]').first();
      const typeAfter = await fieldByPlaceholder.getAttribute('type').catch(async () => {
        return await page.locator('input').nth(1).getAttribute('type');
      });
      log('Password input type after toggle click: ' + typeAfter);
      await page.screenshot({ path: `${SHOT}/02-toggle-shown.png`, fullPage: true });

      // Toggle back
      // Re-find toggle (DOM may have re-rendered)
      let toggle2 = null;
      for (const c of [
        page.getByRole('button', { name: /visa|dölj|show|hide|lösenord|password/i }),
        page.locator('button[aria-label*="lösenord" i]'),
        page.locator('input[placeholder="Lösenord"]').locator('xpath=..').locator('button'),
      ]) {
        try { if (await c.count() > 0) { toggle2 = c.first(); break; } } catch (e) {}
      }
      if (toggle2) {
        await toggle2.click();
        await page.waitForTimeout(300);
        const typeAfter2 = await page.locator('input[placeholder="Lösenord"]').first().getAttribute('type');
        log('Password input type after second toggle click: ' + typeAfter2);
      }
    }

    // ---- STEP 3: Forgot password ----
    log('\n===== STEP 3: Glömt lösenord? =====');
    const forgot = page.getByText(/Glömt lösenord/i).first();
    if (await forgot.count() === 0) {
      log('FORGOT: "Glömt lösenord?" link/button NOT found.');
    } else {
      log('FORGOT: found "Glömt lösenord?" element.');
      await forgot.click();
      await page.waitForTimeout(500);

      // Enter email
      const emailField = page.locator('input[type="email"]').first();
      await emailField.fill('test+reset@example.com');
      log('Entered email: test+reset@example.com');
      await page.screenshot({ path: `${SHOT}/03a-reset-form.png`, fullPage: true });

      const submit = page.getByRole('button', { name: /Skicka återställningslänk/i }).first();
      const submitCount = await page.getByText(/Skicka återställningslänk/i).count();
      log('"Skicka återställningslänk" matches: ' + submitCount);
      await submit.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${SHOT}/03b-reset-submitted.png`, fullPage: true });

      const bodyText = await page.locator('body').innerText();
      // Look for a notice
      const noticeMatch = bodyText.match(/.*(skickat|skickad|kontroll|e-?post|mejl|länk|inkorg|återställ).*/i);
      log('Page body snippet after submit:');
      log(bodyText.split('\n').filter(l => l.trim()).slice(0, 40).join('\n'));

      const backBtn = page.getByText(/Tillbaka till inloggning/i);
      const backCount = await backBtn.count();
      log('"Tillbaka till inloggning" matches after submit: ' + backCount);

      // ---- STEP 4: Click Back to login ----
      log('\n===== STEP 4: Tillbaka till inloggning =====');
      if (backCount > 0) {
        await backBtn.first().click();
        await page.waitForTimeout(600);
        const pwAfterBack = await page.locator('input[type="password"]').count();
        const emailAfterBack = await page.locator('input[type="email"]').count();
        const hasSignInBtn = await page.getByText(/Logga in/i).count();
        log('After Back: password fields=' + pwAfterBack + ', email fields=' + emailAfterBack + ', "Logga in" matches=' + hasSignInBtn);
        await page.screenshot({ path: `${SHOT}/04-back-to-login.png`, fullPage: true });
        log(pwAfterBack > 0 ? 'RETURNED to sign-in form (password field present).' : 'Did NOT return to sign-in form.');
      } else {
        log('No "Tillbaka till inloggning" button to click.');
      }
    }

    // ---- STEP 5: Navigate directly to /sv/aterstall ----
    log('\n===== STEP 5: /sv/aterstall (no auth session) =====');
    // Clear any session
    await page.context().clearCookies();
    await page.goto(`${TARGET_URL}/sv/aterstall`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SHOT}/05-aterstall.png`, fullPage: true });
    const resetBody = await page.locator('body').innerText();
    log('aterstall page body snippet:');
    log(resetBody.split('\n').filter(l => l.trim()).slice(0, 40).join('\n'));

    const hasInvalid = /Länken är ogiltig/i.test(resetBody);
    const hasBack = await page.getByText(/Tillbaka till inloggning/i).count();
    const hasSessionMissing = /Auth session missing/i.test(resetBody);
    log('Contains "Länken är ogiltig...": ' + hasInvalid);
    log('"Tillbaka till inloggning" present: ' + (hasBack > 0));
    log('Contains "Auth session missing!": ' + hasSessionMissing);

  } catch (err) {
    log('ERROR: ' + err.message);
    await page.screenshot({ path: `${SHOT}/error.png`, fullPage: true }).catch(()=>{});
  } finally {
    await page.waitForTimeout(800);
    await browser.close();
    log('\n===== DONE =====');
  }
})();
