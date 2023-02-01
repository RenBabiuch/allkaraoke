import { expect, test } from '@playwright/test';
import { initTestMode, mockSongs } from './helpers';

test.beforeEach(async ({ page, context }) => {
    await initTestMode({ page, context });
    await mockSongs({ page, context });
});

const LAST_VISIT_NO_NEW_SONGS = new Date('2023-01-16T10:35:39.918Z').getTime();
const LAST_VISIT_NEW_SONG = new Date('2023-01-14T10:35:39.918Z').getTime();

test('New songs - displays new song twice by default and doesnt show it in filters', async ({ page }) => {
    await page.addInitScript(
        ([timestamp]) => {
            window.localStorage.setItem('LAST_VISIT_KEY', String(timestamp));
        },
        [LAST_VISIT_NEW_SONG],
    );

    await page.goto('/?e2e-test');
    await page.getByTestId('skip').click({ force: true });

    await page.getByTestId('sing-a-song').click({ force: true });

    await expect(page.getByTestId('song-e2e-new-test.json')).toBeVisible();
    await expect(page.getByTestId('song-e2e-new-test.json-new-group')).toBeVisible();

    // Should still show new group when playlists are used
    await page.getByTestId('playlist-English').click({ force: true });
    await expect(page.getByTestId('song-e2e-new-test.json')).toBeVisible();
    await expect(page.getByTestId('song-e2e-new-test.json-new-group')).toBeVisible();

    await page.keyboard.type('playwright');
    await expect(page.getByTestId('song-e2e-new-test.json')).toBeVisible();
    await expect(page.getByTestId('song-e2e-new-test.json-new-group')).not.toBeVisible();
});

test('New songs - doesnt display new songs if the visit is after', async ({ page }) => {
    await page.addInitScript(
        ([timestamp]) => {
            window.localStorage.setItem('LAST_VISIT_KEY', String(timestamp));
        },
        [LAST_VISIT_NO_NEW_SONGS],
    );

    await page.goto('/?e2e-test');
    await page.getByTestId('skip').click({ force: true });

    await page.getByTestId('sing-a-song').click({ force: true });

    await expect(page.getByTestId('song-e2e-new-test.json')).toBeVisible();
    await expect(page.getByTestId('song-e2e-new-test.json-new-group')).not.toBeVisible();
});

test('New songs - doesnt display new songs on first visit', async ({ page }) => {
    await page.goto('/?e2e-test');
    await page.getByTestId('skip').click({ force: true });

    await page.getByTestId('sing-a-song').click({ force: true });

    await expect(page.getByTestId('song-e2e-new-test.json')).toBeVisible();
    await expect(page.getByTestId('song-e2e-new-test.json-new-group')).not.toBeVisible();
});