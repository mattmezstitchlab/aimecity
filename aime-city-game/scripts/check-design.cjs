const { chromium } = require('playwright');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const results = [];

async function check(label, condition, detail = '') {
  results.push({ label, pass: Boolean(condition), detail });
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!condition) throw new Error(`UI check failed: ${label}${detail ? ` (${detail})` : ''}`);
}

async function dimensions(locator) {
  return locator.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    top: element.scrollTop,
    overflow: getComputedStyle(element).overflowY,
  }));
}

async function scrollToBottom(locator) {
  return locator.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    return { clientHeight: element.clientHeight, scrollHeight: element.scrollHeight, top: element.scrollTop };
  });
}

async function checkMonochrome(page, label) {
  const violations = await page.evaluate(() => {
    const banned = /(?:rgb|rgba)\(\s*255\s*,\s*(?:79|134)\s*,\s*(?:163|84)\b/i;
    const found = [];
    for (const element of document.querySelectorAll('body *')) {
      if (found.length >= 10) break;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || rect.bottom < 0 || rect.top > innerHeight) continue;
      const style = getComputedStyle(element);
      const properties = ['color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'borderBottomColor', 'boxShadow', 'textShadow'];
      for (const property of properties) {
        if (banned.test(style[property] || '')) {
          found.push({ tag: element.tagName, property, value: style[property].slice(0, 100) });
          break;
        }
      }
    }
    return found;
  });
  await check(`${label} : aucun fuchsia/orange dans les styles visibles`, violations.length === 0, JSON.stringify(violations));
}

async function openDemo(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Partie démo/ }).click();
  await page.getByText('Camille', { exact: false }).first().waitFor();
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    // Portrait short enough to force every sheet to scroll.
    const mobile = await browser.newContext({ viewport: { width: 390, height: 680 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const phone = await mobile.newPage();
    await phone.goto(BASE, { waitUntil: 'networkidle' });
    await phone.getByRole('button', { name: /Nouvelle histoire/ }).click();
    let sheet = phone.getByTestId('aime-sheet').last();
    let dim = await dimensions(sheet);
    await check('Portrait : fenêtre nouvelle histoire scrollable', dim.scrollHeight > dim.clientHeight + 50, JSON.stringify(dim));
    dim = await scrollToBottom(sheet);
    await check('Portrait : défilement réel de la fenêtre', dim.top > 40, JSON.stringify(dim));
    await check('Portrait : action du formulaire accessible', await sheet.getByRole('button', { name: /Ouvrir mon monde/ }).isVisible());
    await sheet.getByRole('button', { name: 'Fermer', exact: true }).click();
    await check('Portrait : fermeture de la fenêtre', (await phone.getByTestId('aime-sheet').count()) === 0);
    await checkMonochrome(phone, 'Accueil portrait');

    await phone.getByRole('button', { name: /Partie démo/ }).click();
    const mobileNav = phone.getByRole('navigation', { name: 'Navigation au pouce' });
    await mobileNav.getByRole('button', { name: 'Casting' }).click();
    await phone.getByRole('button', { name: /Ouvrir Iris Nakamoto/ }).click();
    let viewer = phone.getByTestId('character-viewer');
    await check('Portrait : fiche personnage ouverte', await viewer.isVisible());
    let bounds = await viewer.boundingBox();
    await check('Portrait : fiche ancrée au viewport', bounds && Math.abs(bounds.y) < 2 && bounds.width >= 389, JSON.stringify(bounds));
    let scroller = phone.getByTestId('character-details-scroll');
    dim = await dimensions(scroller);
    await check('Portrait : colonne personnage scrollable', dim.scrollHeight > dim.clientHeight + 100, JSON.stringify(dim));
    dim = await scrollToBottom(scroller);
    await check('Portrait : scroller atteint le bas', dim.top > 100, JSON.stringify(dim));
    await check('Portrait : action équipe toujours visible', await viewer.getByRole('button', { name: /Retirer de l'équipe/ }).isVisible());
    await checkMonochrome(phone, 'Fiche portrait');
    await scroller.getByRole('button', { name: /M'approprier cette carte/ }).click();
    sheet = phone.getByTestId('aime-sheet').last();
    dim = await dimensions(sheet);
    await check('Portrait : fenêtre appropriation scrollable', dim.scrollHeight > dim.clientHeight + 50, JSON.stringify(dim));
    dim = await scrollToBottom(sheet);
    await check('Portrait : bas formulaire professionnel atteignable', dim.top > 40, JSON.stringify(dim));
    await check('Portrait : enregistrer la carte accessible', await sheet.getByRole('button', { name: /Enregistrer ma carte/ }).isVisible());
    await sheet.getByRole('button', { name: 'Fermer', exact: true }).click();
    await viewer.getByRole('button', { name: /Revenir à la collection/ }).click();

    await mobileNav.getByRole('button', { name: 'Monde' }).click();
    await phone.getByRole('button', { name: /Love District —/ }).first().click();
    sheet = phone.getByTestId('aime-sheet').last();
    dim = await dimensions(sheet);
    await check('Portrait : fenêtre quartier scrollable', dim.scrollHeight > dim.clientHeight + 50, JSON.stringify(dim));
    dim = await scrollToBottom(sheet);
    await check('Portrait : métiers et missions en bas du quartier atteignables', dim.top > 40, JSON.stringify(dim));
    await sheet.getByRole('button', { name: /Alma Fournier/ }).first().click();
    await check('Portrait : la fiche ouverte depuis la ville passe au premier plan', await phone.getByTestId('character-viewer').isVisible());
    await check('Portrait : panneau de quartier fermé avant la fiche', (await phone.getByTestId('aime-sheet').count()) === 0);
    await phone.getByRole('button', { name: /Revenir à la collection/ }).click();

    await mobileNav.getByRole('button', { name: 'Missions' }).click();
    await phone.getByRole('button', { name: /Prochaine action/ }).first().click();
    sheet = phone.getByTestId('aime-sheet').last();
    dim = await dimensions(sheet);
    await check('Portrait : fenêtre mission scrollable', dim.scrollHeight > dim.clientHeight + 50, JSON.stringify(dim));
    dim = await scrollToBottom(sheet);
    await check('Portrait : plan B et note atteignables', dim.top > 40, JSON.stringify(dim));
    await sheet.getByRole('button', { name: 'Fermer', exact: true }).click();

    await phone.getByRole('button', { name: /Ouvrir le menu complet/ }).click();
    sheet = phone.getByTestId('aime-sheet').last();
    dim = await dimensions(sheet);
    await check('Portrait : menu complet scrollable', dim.scrollHeight > dim.clientHeight + 50, JSON.stringify(dim));
    dim = await scrollToBottom(sheet);
    await check('Portrait : réglages visibles en bas du menu', dim.top > 40, JSON.stringify(dim));
    await sheet.getByRole('button', { name: 'Fermer', exact: true }).click();

    // Rotate without clearing local state.
    await phone.setViewportSize({ width: 844, height: 390 });
    await phone.waitForTimeout(300);
    const rail = phone.getByRole('navigation', { name: 'Navigation principale' });
    await rail.getByRole('button', { name: 'Casting' }).click();
    await phone.getByRole('button', { name: /Ouvrir Iris Nakamoto/ }).click();
    viewer = phone.getByTestId('character-viewer');
    bounds = await viewer.boundingBox();
    await check('Paysage : fiche ancrée au viewport', bounds && Math.abs(bounds.y) < 2 && bounds.width >= 843, JSON.stringify(bounds));
    scroller = phone.getByTestId('character-details-scroll');
    dim = await dimensions(scroller);
    await check('Paysage : fiche personnage scrollable', dim.scrollHeight > dim.clientHeight + 100, JSON.stringify(dim));
    dim = await scrollToBottom(scroller);
    await check('Paysage : défilement du panneau latéral', dim.top > 100, JSON.stringify(dim));
    await check('Paysage : barre équipe visible', await viewer.getByRole('button', { name: /Retirer de l'équipe/ }).isVisible());
    await checkMonochrome(phone, 'Fiche paysage');
    await viewer.getByRole('button', { name: /Revenir à la collection/ }).click();

    // Desktop (non mobile browser context).
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const deskPage = await desktop.newPage();
    await openDemo(deskPage);
    const deskRail = deskPage.getByRole('navigation', { name: 'Navigation principale' });
    await deskRail.getByRole('button', { name: 'Casting' }).click();
    await deskPage.getByRole('button', { name: /Ouvrir Iris Nakamoto/ }).click();
    const deskViewer = deskPage.getByTestId('character-viewer');
    bounds = await deskViewer.boundingBox();
    await check('Ordinateur : fiche couvre réellement tout le viewport', bounds && Math.abs(bounds.x) < 2 && Math.abs(bounds.y) < 2 && bounds.width >= 1439 && bounds.height >= 899, JSON.stringify(bounds));
    const deskScroller = deskPage.getByTestId('character-details-scroll');
    dim = await dimensions(deskScroller);
    await check('Ordinateur : panneau personnage scrollable', dim.scrollHeight > dim.clientHeight + 100, JSON.stringify(dim));
    await deskScroller.hover();
    await deskPage.mouse.wheel(0, 490);
    await deskPage.waitForTimeout(140);
    const wheelTop = await deskScroller.evaluate(element => element.scrollTop);
    await check('Ordinateur : défilement à la molette', wheelTop > 20, `scrollTop=${wheelTop}`);
    dim = await scrollToBottom(deskScroller);
    await check('Ordinateur : bas de fiche atteignable', dim.top > 100, JSON.stringify(dim));
    await checkMonochrome(deskPage, 'Fiche ordinateur');
    await deskPage.getByRole('button', { name: /Revenir à la collection/ }).click();
    await deskPage.getByRole('button', { name: /Ouvrir le menu complet/ }).click();
    sheet = deskPage.getByTestId('aime-sheet').last();
    dim = await dimensions(sheet);
    await check('Ordinateur : menu complet scrollable', dim.scrollHeight > dim.clientHeight + 30, JSON.stringify(dim));
    dim = await scrollToBottom(sheet);
    await check('Ordinateur : fin du menu atteignable', dim.top > 30, JSON.stringify(dim));

    const smallContext = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const smallPage = await smallContext.newPage();
    await smallPage.goto(BASE, { waitUntil: 'networkidle' });
    await smallPage.getByRole('button', { name: /Nouvelle histoire/ }).click();
    // Wait until the opening transition has completed before starting a real touch gesture.
    await smallPage.waitForTimeout(500);
    const smallSheet = smallPage.getByTestId('aime-sheet').last();
    const smallBounds = await smallSheet.boundingBox();
    const cdp = await smallContext.newCDPSession(smallPage);
    const x = Math.round(smallBounds.x + 30);
    const y = Math.round(smallBounds.y + smallBounds.height - 100);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 9; step += 1) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 35 * step }] });
      await smallPage.waitForTimeout(25);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await smallPage.waitForTimeout(250);
    const touchTop = await smallSheet.evaluate((element) => element.scrollTop);
    await check('320px : geste de défilement tactile réel', touchTop > 80, `scrollTop=${touchTop}`);
    const horizontal = await smallPage.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    await check('320px : aucun débordement horizontal', horizontal.scrollWidth <= horizontal.viewport + 1, JSON.stringify(horizontal));
    await smallSheet.getByRole('button', { name: 'Fermer', exact: true }).click();
    await smallPage.getByRole('button', { name: /Partie démo/ }).click();
    await smallPage.getByRole('navigation', { name: 'Navigation au pouce' }).getByRole('button', { name: 'Casting' }).click();
    await smallPage.getByRole('button', { name: /Ouvrir Naya Vex/ }).click();
    await smallPage.getByRole('button', { name: /Ajouter à mon équipe/ }).click();
    await smallPage.reload({ waitUntil: 'networkidle' });
    await smallPage.getByRole('navigation', { name: 'Navigation au pouce' }).getByRole('button', { name: 'Équipe' }).click();
    await check('320px : sélection persistante après rechargement', await smallPage.getByText('Naya Vex').first().isVisible());
    await smallContext.close();
    await desktop.close();
    await mobile.close();
    console.log(`SUCCESS: ${results.length} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
