import { expect } from '@playwright/experimental-ct-react';
import { Browser, BrowserContext, Page } from '@playwright/test';

export class RemoteMicSettingsPage {
  constructor(
    private page: Page,
    private context: BrowserContext,
    private browser: Browser,
  ) {}

  public async goToMicrophoneSettings() {
    await this.page.getByTestId('microphone-settings').click();
  }

  public async resetMicrophone() {
    await this.page.getByTestId('reset-microphone').click();
  }

  public get remoteMicID() {
    return this.page.getByTestId('remote-mic-id');
  }

  public get adjustMicrophoneLag() {
    return this.page.getByTestId('microphone-delay');
  }

  public async increaseMicInputDelay() {
    await this.adjustMicrophoneLag.getByTestId('numeric-input-up').click();
  }

  public async expectMicInputDelayToBe(value: string) {
    await expect(this.adjustMicrophoneLag.getByTestId('numeric-input-value')).toContainText(value);
  }
}
