import { expect, test } from '@playwright/test';
import { initTestMode, mockRandom, mockSongs } from './helpers';

import initialise from './PageObjects/initialise';

let pages: ReturnType<typeof initialise>;
test.beforeEach(async ({ page, context, browser }) => {
  pages = initialise(page, context, browser);
  await initTestMode({ page, context });
  await mockSongs({ page, context });
  await mockRandom({ page, context }, 0);
});
const columnLastUpdate = 'Last Update';
const lastUpdateColumnNum = 4;
const lastUpdate1 = 'January 16, 2023';
const lastUpdate2 = 'January 15, 2023';
const lastUpdate3 = 'August 18, 2022';

test('Sorting songs by last update works ', async ({ page }) => {
  await page.goto('/?e2e-test');
  await pages.landingPage.enterTheGame();
  await pages.inputSelectionPage.skipToMainMenu();
  await pages.mainMenuPage.goToManageSongs();
  await pages.manageSongsPage.goToEditSongs();
  await expect(pages.editSongsPage.getColumnHeader(columnLastUpdate)).toBeVisible();
  await expect(pages.editSongsPage.getTableCell(1, lastUpdateColumnNum)).toBeEmpty();
  await expect(pages.editSongsPage.getTableCell(2, lastUpdateColumnNum)).toBeEmpty();
  await expect(pages.editSongsPage.getTableCell(3, lastUpdateColumnNum)).toBeEmpty();

  await pages.editSongsPage.sortByLastUpdateDESC();
  await expect(pages.editSongsPage.getTableCell(1, lastUpdateColumnNum)).toHaveText(lastUpdate1);
  await expect(pages.editSongsPage.getTableCell(2, lastUpdateColumnNum)).toHaveText(lastUpdate2);
  await expect(pages.editSongsPage.getTableCell(3, lastUpdateColumnNum)).toHaveText(lastUpdate3);
});

const columnID = 'ID';
const columnArtist = 'Artist';
const columnVideo = 'Video';

test('Showing and hiding columns in table works, resets after refresh', async ({ page }) => {
  await page.goto('/?e2e-test');
  await pages.landingPage.enterTheGame();
  await pages.inputSelectionPage.skipToMainMenu();
  await pages.mainMenuPage.goToManageSongs();
  await pages.manageSongsPage.goToEditSongs();
  await expect(pages.editSongsPage.getColumnHeader(columnArtist)).toBeVisible();
  await expect(pages.editSongsPage.getColumnHeader(columnID)).not.toBeVisible();
  await expect(pages.editSongsPage.getColumnHeader(columnVideo)).not.toBeVisible();

  await pages.editSongsPage.toggleColumnVisibility(columnID);
  await pages.editSongsPage.toggleColumnVisibility(columnVideo);
  await expect(pages.editSongsPage.getColumnHeader(columnID)).toBeVisible();
  await expect(pages.editSongsPage.getColumnHeader(columnVideo)).toBeVisible();

  await pages.editSongsPage.hideAllColumns();
  await expect(pages.editSongsPage.getColumnHeader(columnArtist)).not.toBeVisible();
  await expect(pages.editSongsPage.getColumnHeader(columnID)).not.toBeVisible();
  await expect(pages.editSongsPage.getColumnHeader(columnVideo)).not.toBeVisible();

  await page.reload();
  await expect(pages.editSongsPage.getColumnHeader(columnArtist)).toBeVisible();
  await expect(pages.editSongsPage.getColumnHeader(columnID)).not.toBeVisible();
  await expect(pages.editSongsPage.getColumnHeader(columnVideo)).not.toBeVisible();
});

const columnYear = 'Year';
const yearColumnNum = 2;
const year1 = '1990';
const year2 = '1994';
const year3 = '1994';
const filteredYear = '1995';
test('Filtering songs shows proper results', async ({ page }) => {
  await page.goto('/?e2e-test');
  await pages.landingPage.enterTheGame();
  await pages.inputSelectionPage.skipToMainMenu();
  await pages.mainMenuPage.goToManageSongs();
  await pages.manageSongsPage.goToEditSongs();
  await expect(pages.editSongsPage.getColumnHeader(columnYear)).toBeVisible();
  await expect(pages.editSongsPage.getTableCell(1, yearColumnNum)).toHaveText(year1);
  await expect(pages.editSongsPage.getTableCell(2, yearColumnNum)).toHaveText(year2);
  await expect(pages.editSongsPage.getTableCell(3, yearColumnNum)).toHaveText(year3);

  await pages.editSongsPage.filterByColumnName(columnYear, filteredYear);
  await expect(pages.editSongsPage.getTableCell(1, yearColumnNum)).toHaveText(filteredYear);
  await expect(pages.editSongsPage.getTableCell(2, yearColumnNum)).toHaveText(filteredYear);
  await expect(pages.editSongsPage.getTableCell(3, yearColumnNum)).toHaveText(filteredYear);
});
