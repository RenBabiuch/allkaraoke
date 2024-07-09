import styled from '@emotion/styled';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { GAME_MODE, Note } from 'interfaces';
import styles from 'modules/GameEngine/Drawing/styles';
import GameState from 'modules/GameEngine/GameState/GameState';
import PlayersManager, { PlayerEntity } from 'modules/Players/PlayersManager';
import isNotesSection from 'modules/Songs/utils/isNotesSection';
import { getFirstNoteStartFromSections } from 'modules/Songs/utils/notesSelectors';
import { ComponentProps, Fragment, PropsWithChildren, useMemo } from 'react';
import LyricsVolumeIndicator from 'routes/Game/Singing/GameOverlay/Components/LyricsVolumeIndicator';
import { MobilePhoneModeSetting, useSettingValue } from 'routes/Settings/SettingsState';
import tinycolor from 'tinycolor2';

interface Props {
  player: PlayerEntity;
  bottom?: boolean;
  effectsEnabled: boolean;
  showMultipleLines: boolean;
}

function Lyrics({ player, bottom = false, effectsEnabled, showMultipleLines }: Props) {
  const playerState = GameState.getPlayer(player.number)!;
  const [mobilePhoneMode] = useSettingValue(MobilePhoneModeSetting);
  const playerColor = styles.colors.players[player.number].text;
  const thisPlayerChanges =
    GameState.getSingSetup()?.mode === GAME_MODE.PASS_THE_MIC ? playerState.getTrack().changes : [];
  const section = playerState.getCurrentSection();
  const nextSection = playerState.getNextSection();
  const subsequentSection = playerState.getNextSection(2);
  const currentBeat = GameState.getCurrentBeat();
  const beatLength = GameState.getSongBeatLength();

  const previousChange = Math.max(0, ...thisPlayerChanges.filter((beat) => beat <= (section?.start ?? -Infinity)));
  const nextChange = thisPlayerChanges.find((beat) => beat > (section?.start ?? Infinity)) ?? Infinity;
  const timeToNextChange = (nextChange - currentBeat) * beatLength;

  const passTheMicProgress = (nextChange - currentBeat) / (nextChange - previousChange);

  const shouldBlink = timeToNextChange < 2500;

  const hasNotes = isNotesSection(section);

  const beatsBetweenSectionAndNote = hasNotes ? getFirstNoteStartFromSections([section]) - section.start : 0;

  return (
    <LyricsContainer shouldBlink={shouldBlink} bottom={bottom} data-test={`lyrics-container-player-${player.number}`}>
      {!mobilePhoneMode && effectsEnabled && (
        <VolumeIndicatorContainer>
          {showMultipleLines ? (
            <SLyricsVolumeIndicator player={player} />
          ) : (
            GameState.getPlayers().map((player) => (
              <SLyricsVolumeIndicator key={player.getNumber()} player={PlayersManager.getPlayer(player.getNumber())!} />
            ))
          )}
        </VolumeIndicatorContainer>
      )}
      {timeToNextChange < Infinity && (
        <PassTheMicProgress color={playerColor} progress={passTheMicProgress <= 1 ? passTheMicProgress * 100 : 0} />
      )}
      {hasNotes ? (
        <>
          <LyricsLine data-test={`lyrics-current-player-${player.number}`} effectsEnabled={effectsEnabled}>
            <HeadstartContainer>
              <Headstart
                color={playerColor}
                percent={Math.min(2, (currentBeat - section.start) / beatsBetweenSectionAndNote)}
              />
            </HeadstartContainer>
            {section?.notes.map((note) => {
              const fill = Math.max(0, Math.min(2, (currentBeat - note.start) / note.length));
              return (
                <LyricContainer type={note.type} key={note.start}>
                  <LyricActiveContainer>
                    <LyricActive fill={fill} color={playerColor}>
                      {note.lyrics.trim()}
                    </LyricActive>
                    {note.lyrics.endsWith(' ') && ' '}
                  </LyricActiveContainer>
                  {note.lyrics}
                </LyricContainer>
              );
            })}
            {nextSection?.start === nextChange && <PassTheMicSymbol data-should-shake={true} />}
          </LyricsLine>
        </>
      ) : (
        <LyricsLine effectsEnabled={effectsEnabled}>&nbsp;</LyricsLine>
      )}
      {isNotesSection(nextSection) ? (
        <LyricsLine nextLine data-test={`lyrics-next-player-${player.number}`} effectsEnabled={effectsEnabled}>
          {nextSection.notes.map((note) => (
            <Fragment key={note.start}>{note.lyrics}</Fragment>
          ))}
          {subsequentSection?.start === nextChange && <PassTheMicSymbol />}
        </LyricsLine>
      ) : (
        <LyricsLine effectsEnabled={effectsEnabled} nextLine>
          &nbsp;
        </LyricsLine>
      )}
    </LyricsContainer>
  );
}

const SLyricsVolumeIndicator = styled(LyricsVolumeIndicator)`
  flex: 1;
`;

const VolumeIndicatorContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const HeadstartContainer = styled.span`
  position: relative;
  height: 0;
`;

const BaseHeadstart = styled.span`
  position: absolute;
  width: 15rem;
  height: 3.1rem;
  margin: 0.7rem 0;
  right: 10rem;
`;

const Headstart = ({ percent, color }: { percent: number; color: string }) => {
  const rgbColor = useMemo(() => {
    const rgb = tinycolor(color).toRgb();
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  }, [color]);

  return (
    <BaseHeadstart
      style={{
        transformOrigin: 'right',
        transform: `scaleX(${Math.min(1, 2 - percent)})`,
        right: `${Math.max(0, 1 - percent) * 15}rem`,
        background: `linear-gradient(270deg, rgba(${rgbColor}, 1) 0%, rgba(${rgbColor}, 0.5) 25%, rgba(${rgbColor}, 0) 100%)`,
      }}
    />
  );
};

const LyricsContainer = styled.div<{ shouldBlink: boolean; bottom: boolean }>`
  @keyframes blink {
    100% {
      background-color: rgba(0, 0, 0, ${(props) => (props.bottom ? '0.85' : '0.5')});
    }
    30% {
      background-color: rgba(0, 0, 0, ${(props) => (props.bottom ? '0.85' : '0.5')});
    }
    50% {
      background-color: rgba(200, 200, 200, ${(props) => (props.bottom ? '0.85' : '0.5')});
    }
    30% {
      background-color: rgba(0, 0, 0, ${(props) => (props.bottom ? '0.85' : '0.5')});
    }
    0% {
      background-color: rgba(0, 0, 0, ${(props) => (props.bottom ? '0.85' : '0.5')});
    }
  }

  box-sizing: border-box;

  padding: 1rem;
  background: rgba(0, 0, 0, ${(props) => (props.bottom ? '0.9' : '0.5')});
  width: 100%;
  text-align: center;
  line-height: 1;
  position: relative;
  ${(props) => (props.shouldBlink ? `animation: blink 350ms ease-in-out infinite both;` : ``)}
`;

const LyricContainer = styled.span<{ type: Note['type'] }>`
  font-style: ${(props) => (props.type === 'freestyle' ? 'italic' : 'normal')};
`;

const LyricActiveContainer = styled.span`
  position: absolute;
  z-index: 1;
`;
const BaseLyricActive = styled.span``;

const LyricActive = ({ fill, color, children }: PropsWithChildren<{ fill: number; color: string }>) => (
  <BaseLyricActive
    style={{
      clipPath: `inset(0 ${(1 - (fill === 0 ? 0 : fill + 0.05)) * 100}% -5rem 0)`,
      color: `${color}`,
    }}>
    {children}
  </BaseLyricActive>
);

const BasePassTheMicProgress = styled.div`
  position: absolute;
  height: 1rem;
  width: 100%;
`;

const PassTheMicProgress = (props: { progress: number } & ComponentProps<typeof BasePassTheMicProgress>) => (
  <BasePassTheMicProgress
    data-test="pass-the-mic-progress"
    style={{
      background: props.color,
      transformOrigin: 'left',
      transform: `scaleX(${props.progress / 100})`,
    }}
  />
);

const PassTheMicSymbol = styled(SwapHorizIcon)`
  @keyframes shake {
    10%,
    90% {
      transform: translate3d(-0.1rem, 0, 0);
    }

    20%,
    80% {
      transform: translate3d(0.2rem, 0, 0);
    }

    30%,
    50%,
    70% {
      transform: translate3d(-0.4rem, 0, 0);
    }

    40%,
    60% {
      transform: translate3d(0.4rem, 0, 0);
    }
  }
  font-size: 3rem;
  margin-left: 2rem;

  &[data-should-shake='true'] {
    animation: shake 0.92s cubic-bezier(0.36, 0.07, 0.19, 0.97) both infinite;
    fill: ${styles.colors.text.active};
    font-size: 4rem;
  }
`;
const LyricsLine = styled.div<{ nextLine?: boolean; effectsEnabled: boolean }>`
  font-size: ${({ nextLine, effectsEnabled }) => (effectsEnabled ? 3.5 + (nextLine ? 0 : 1) : 2)}rem;

  height: ${({ effectsEnabled }) => (effectsEnabled ? 4.5 : 2)}rem;
  -webkit-text-stroke-width: ${({ effectsEnabled }) => (effectsEnabled ? '2px' : '1px')};

  color: ${({ nextLine }) => (nextLine ? styles.colors.text.inactive : styles.colors.text.default)};

  font-family: 'Comic Sans MS', Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif;
  z-index: 10;
`;

export default Lyrics;
