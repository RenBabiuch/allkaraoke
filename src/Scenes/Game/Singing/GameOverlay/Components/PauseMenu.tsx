import { MenuButton, MenuContainer } from 'Elements/Menu';
import Modal from 'Elements/Modal';
import RateSong from 'Scenes/Game/Singing/GameOverlay/Components/RateSong';
import GameState from 'Scenes/Game/Singing/GameState/GameState';
import SelectInputModal from 'Scenes/SelectInput/SelectInputModal';
import InputLag from 'Scenes/Settings/InputLag';
import SongsService from 'Songs/SongsService';
import useKeyboardNav from 'hooks/useKeyboardNav';
import useSmoothNavigate from 'hooks/useSmoothNavigate';
import { useEffect, useRef, useState } from 'react';
import isE2E from 'utils/isE2E';

interface Props {
  onResume: () => void;
  onExit: () => void;
  onRestart: () => void;
}

export default function PauseMenu({ onResume, onExit, onRestart }: Props) {
  const navigate = useSmoothNavigate();
  const menuRef = useRef<null | HTMLButtonElement>(null);
  const inputLagRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    menuRef.current?.focus();
  }, [menuRef]);

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);

  const { register } = useKeyboardNav({ enabled: !isInputModalOpen });

  const [rateSongOpen, setRateSongOpen] = useState(false);
  const handleExit = async () => {
    const progress = GameState.getSongCompletionProgress();
    const songPreview = (await SongsService.getIndex()).find((song) => song.id === GameState.getSong()?.id);

    // todo add e2e test
    if (!songPreview?.local && progress < 0.7 && !isE2E()) {
      setRateSongOpen(true);
    } else {
      onExit();
    }
  };

  return (
    <Modal onClose={onResume}>
      {!rateSongOpen && (
        <>
          <MenuContainer>
            <MenuButton {...register('button-resume-song', onResume)} ref={menuRef}>
              Resume song
            </MenuButton>
            <MenuButton {...register('button-restart-song', onRestart)}>Restart song</MenuButton>
            <MenuButton {...register('button-exit-song', handleExit)}>Exit song</MenuButton>
            <MenuButton {...register('input-settings', () => setIsInputModalOpen(true))}>
              Microphones settings
            </MenuButton>
            <hr />
            <InputLag ref={inputLagRef} {...register('input-lag', () => inputLagRef.current?.focus())} />
            <MenuButton
              {...register('edit-song', () => navigate(`edit/song/`, { song: GameState.getSong()?.id ?? '' }))}
              size="small">
              Edit song
            </MenuButton>
          </MenuContainer>
          {isInputModalOpen && (
            <SelectInputModal onClose={() => setIsInputModalOpen(false)} closeButtonText={'Back to Pause Menu'} />
          )}
        </>
      )}
      {rateSongOpen && <RateSong onExit={onExit} register={register} />}
    </Modal>
  );
}
