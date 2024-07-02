import { styled } from '@linaria/react';
import Loader from 'modules/Elements/Loader';
import { MenuButton } from 'modules/Elements/Menu';
import InputManager from 'modules/GameEngine/Input/InputManager';
import events from 'modules/GameEvents/GameEvents';
import { useEventEffect, useEventListenerSelector } from 'modules/GameEvents/hooks';
import PlayersManager from 'modules/Players/PlayersManager';
import UserMediaEnabled from 'modules/UserMedia/UserMediaEnabled';
import useKeyboardNav from 'modules/hooks/useKeyboardNav';
import isChromium from 'modules/utils/isChromium';
import isWindows from 'modules/utils/isWindows';
import { useEffect, useState } from 'react';
import InputSources from 'routes/SelectInput/InputSources';
import { MicrophoneInputSource } from 'routes/SelectInput/InputSources/Microphone';
import MicCheck from 'routes/SelectInput/MicCheck';
import { useMicrophoneList } from 'routes/SelectInput/hooks/useMicrophoneList';
import usePlayerNumberPreset from 'routes/SelectInput/hooks/usePlayerNumberPreset';
import { MicSetupPreference } from 'routes/Settings/SettingsState';
import { ValuesType } from 'utility-types';

interface Props {
  onSetupComplete: (complete: boolean) => void;
  onBack: () => void;
  onSave: () => void;
  closeButtonText: string;
  changePreference: (pref: ValuesType<typeof MicSetupPreference>) => void;
}

function SingStarMics(props: Props) {
  usePlayerNumberPreset(2);
  const { register } = useKeyboardNav({ onBackspace: props.onBack });
  const { Microphone } = useMicrophoneList(true, 'Microphone');
  const [showAdvancedTip, setShowAdvancedTip] = useState(false);

  const isSetup = useEventListenerSelector([events.playerInputChanged, events.inputListChanged], () => {
    const inputs = PlayersManager.getInputs();

    const isSameDeviceId = [...new Set(inputs.map((input) => input.deviceId))].length === 1;
    const isMicInput = !inputs.find((input) => input.source !== 'Microphone');
    const areAllPreferred = !inputs.find(
      (input) => InputSources.getInputForPlayerSelected(input)?.preferred === undefined,
    );

    return isSameDeviceId && isMicInput && areAllPreferred;
  });

  useEffect(() => {
    if (isSetup) {
      InputManager.startMonitoring();
    }
    return () => {
      InputManager.stopMonitoring();
    };
  }, [isSetup]);

  const onContinue = () => {
    props.onSave();
  };

  // Look for proper microphones in the list when the list changes
  const [listChanged, setListChanged] = useState(false);
  useEventEffect(events.inputListChanged, (initial) => {
    const preferred = Microphone.list.filter((input) => input.preferred !== undefined);
    if (preferred.length === 2 && preferred[0].deviceId === preferred[1].deviceId) {
      preferred.forEach((input) => {
        PlayersManager.getPlayer(input.preferred!)?.changeInput(
          MicrophoneInputSource.inputName,
          input.channel,
          input.deviceId,
        );
      });
    }
    if (!initial) {
      setListChanged(true);
    }
  });

  useEffect(() => {
    props.onSetupComplete(isSetup);
  }, [isSetup]);

  useEffect(() => {
    if (isSetup) {
      setShowAdvancedTip(false);
    } else {
      const timeout = setTimeout(() => setShowAdvancedTip(true), 2500);

      return () => clearTimeout(timeout);
    }
  }, [isSetup]);

  return (
    <>
      <UserMediaEnabled fallback={<h2>Please allow access to the microphone so we can find SingStar ones.</h2>}>
        {!isSetup && (
          <>
            <h3>
              <Loader size="0.85em" /> Connect your SingStar microphones.
            </h3>
            <h4 data-test="setup-not-completed">It can take a couple of seconds to detect after you connect them.</h4>
            {listChanged && (
              <h4>
                <h4 data-test="list-change-info">
                  Available microphones list has changed, but no SingStar mics were found. Try{' '}
                  <button onClick={() => props.changePreference('advanced')}>Advanced</button> setup.
                </h4>
              </h4>
            )}
            {showAdvancedTip && (
              <>
                {!listChanged && (
                  <ChromeIssue data-test="advanced-tip">
                    If they don't get detected, try{' '}
                    <button onClick={() => props.changePreference('advanced')}>Advanced</button> section in the previous
                    menu.
                  </ChromeIssue>
                )}
                {isChromium() && isWindows() && (
                  <ChromeIssue>
                    <strong>Chrome</strong> is known for not handling SingStar mics well. If you notice any problems,
                    try using an alternative browser (eg. <strong>MS Edge</strong> or <strong>Firefox</strong>)
                  </ChromeIssue>
                )}
              </>
            )}
          </>
        )}
        {isSetup && (
          <>
            <h2 data-test="setup-completed">
              <strong>SingStar</strong> microphone connected!
            </h2>

            <MicCheck names={['Blue', 'Red']} />
          </>
        )}
      </UserMediaEnabled>

      <MenuButton {...register('back-button', props.onBack)}>Change Input Type</MenuButton>
      <MenuButton
        {...register('save-button', onContinue, undefined, true, { disabled: !isSetup })}
        data-test="save-button">
        {props.closeButtonText}
      </MenuButton>
    </>
  );
}

const ChromeIssue = styled.h4`
  background: darkred;
  padding: 1rem;
`;

export default SingStarMics;
