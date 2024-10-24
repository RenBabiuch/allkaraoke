import { Meta, StoryFn, StoryObj } from '@storybook/react';
import PlayersManager from 'Players/PlayersManager';
import GameState from 'Scenes/Game/Singing/GameState/GameState';
import Player, { PlayerRef } from 'Scenes/Game/Singing/Player';
import convertTxtToSong from 'Songs/utils/convertTxtToSong';
import { processSong } from 'Songs/utils/processSong/processSong';
import { GAME_MODE, SingSetup } from 'interfaces';
import { ComponentProps, useEffect, useRef } from 'react';
import { txtfile } from 'stories/songFixture';
import { ValuesType } from 'utility-types';
import 'utils/exposeSingletons';

interface StoryArgs {
  tolerance: number;
  speed: number;
  playerNum: number;
  gameMode: ValuesType<typeof GAME_MODE>;
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Game/Singing/Player',
  component: Player,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    playerNum: { control: { type: 'range', min: 1, max: 4, step: 1 } },
    speed: { control: { type: 'range', min: 1, max: 200, step: 1 } },
    tolerance: { control: { type: 'range', min: 0, max: 6, step: 1 } },
    gameMode: { control: 'radio', options: [GAME_MODE.DUEL, GAME_MODE.PASS_THE_MIC, GAME_MODE.CO_OP] },
  },
  args: {
    playerNum: 2,
    tolerance: 3,
    speed: 100,
    gameMode: GAME_MODE.DUEL,
  },
} as Meta<ComponentProps<typeof Player>>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<StoryArgs> = (args) => {
  const song = processSong(convertTxtToSong(txtfile));
  song.bpm = song.bpm * (args.speed / 100);

  const singSetup: SingSetup = {
    tolerance: args.tolerance,
    players: new Array(args.playerNum).fill(0).map((t, i) => ({ number: i as 0 | 1 | 2 | 3, track: 0 })),
    id: 'storybook-id',
    mode: args.gameMode,
  };
  PlayersManager.getPlayers().forEach((player) => PlayersManager.removePlayer(player.number));
  singSetup.players.map((player) => PlayersManager.addPlayer(player.number));

  console.log(singSetup, PlayersManager.getPlayers());
  useEffect(() => {
    GameState.resetSingSetup();
    GameState.setSingSetup(singSetup);
    GameState.setSong(song);
  }, [args.tolerance, args.playerNum, args.gameMode]);

  const ref = useRef<PlayerRef | null>(null);

  useEffect(() => {
    ref.current?.play();
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <Player
        autoplay={false}
        ref={ref}
        onSongEnd={() => {
          GameState.resetSingSetup();
          GameState.setSingSetup(singSetup);
          GameState.setSong(song);

          setTimeout(() => {
            ref.current?.play();
          }, 100);
        }}
        players={singSetup.players}
        singSetup={singSetup}
        width={1280}
        height={720}
        song={song}
      />
    </div>
  );
};

const Test = Template.bind({});

type Story = StoryObj<typeof Test>;

export const GameSingingPlayerStory = {
  render: (args) => <Test {...args} />,
} satisfies Story;
