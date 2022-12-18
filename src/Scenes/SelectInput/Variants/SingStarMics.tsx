import useKeyboardNav from 'hooks/useKeyboardNav';
import { MenuButton } from 'Elements/Menu';
import { useMicrophoneList } from 'Scenes/SelectInput/hooks/useMicrophoneList';
import { useEventEffect, useEventListenerSelector } from 'Scenes/Game/Singing/Hooks/useEventListener';
import GameStateEvents from 'Scenes/Game/Singing/GameState/GameStateEvents';
import InputManager from 'Scenes/Game/Singing/Input/InputManager';
import { MicrophoneInputSource } from 'Scenes/SelectInput/InputSources/Microphone';
import { useEffect } from 'react';
import MicCheck from 'Scenes/SelectInput/MicCheck';
import { CheckCircle } from '@mui/icons-material';

interface Props {
    onBack: () => void;
    onSave: () => void;
    closeButtonText: string;
}

function SingStarMics(props: Props) {
    const { register } = useKeyboardNav({ onBackspace: props.onBack });
    const { Microphone } = useMicrophoneList(true);

    const isSetup = useEventListenerSelector(
        [GameStateEvents.playerInputChanged, GameStateEvents.inputListChanged],
        () => {
            const inputs = InputManager.getInputs();

            const isSameDeviceId = [...new Set(inputs.map((input) => input.deviceId))].length === 1;
            const isMicInput = !inputs.find((input) => input.inputSource !== 'Microphone');

            return isSameDeviceId && isMicInput;
        },
    );

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
    useEventEffect(GameStateEvents.inputListChanged, () => {
        const preferred = Microphone.list.filter((input) => input.preferred !== undefined);
        if (preferred.length === 2 && preferred[0].deviceId === preferred[1].deviceId) {
            preferred.forEach((input) => {
                InputManager.setPlayerInput(
                    input.preferred!,
                    MicrophoneInputSource.inputName,
                    input.channel,
                    input.deviceId,
                );
            });
        }
    });

    return (
        <>
            {!isSetup && (
                <>
                    <h3>Connect your SingStar microphones.</h3>
                    <h4>Make sure you only connect one pair.</h4>
                </>
            )}
            {isSetup && (
                <>
                    <h2>
                        <CheckCircle /> <strong>SingStar</strong> microphone connected!
                    </h2>
                    <MicCheck names={['Blue', 'Red']} />
                </>
            )}

            <MenuButton {...register('back', props.onBack)} data-test="back-button">
                Back
            </MenuButton>
            <MenuButton
                {...(isSetup ? register('Sing a song', onContinue, undefined, true) : {})}
                disabled={!isSetup}
                data-test="save-button">
                {props.closeButtonText}
            </MenuButton>
        </>
    );
}

export default SingStarMics;
