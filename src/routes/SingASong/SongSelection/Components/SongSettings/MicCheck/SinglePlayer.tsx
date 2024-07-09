import styled from '@emotion/styled';
import { PlayerMicCheck } from 'modules/Elements/VolumeIndicator';
import { PlayerEntity } from 'modules/Players/PlayersManager';
import usePlayerMicStatus from 'modules/hooks/players/usePlayerMicStatus';
import Ping from 'routes/SingASong/SongSelection/Components/SongSettings/MicCheck/Ping';
import PlayerStatus from 'routes/SingASong/SongSelection/Components/SongSettings/MicCheck/Status';

interface Props {
  player: PlayerEntity;
}
export default function SinglePlayer({ player }: Props) {
  const status = usePlayerMicStatus(player.number);

  return (
    <Indicator key={player.number} data-test={`indicator-player-${player.number}`}>
      <Ping playerNumber={player.number} />
      <PlayerStatus status={status} />
      {status !== 'unavailable' && <PlayerMicCheck playerNumber={player.number} />}
      <PlayerName className="ph-no-capture">{player.getName()}</PlayerName>
    </Indicator>
  );
}

const Indicator = styled.div`
  position: relative;
  border: 0.1rem solid white;
  padding: 1rem 3rem;
  background: black;
  width: 80%;

  text-align: center;
  gap: 1.25rem;
  font-size: 2.3rem;
  color: white;

  -webkit-text-stroke: 1px black;
`;

const PlayerName = styled.span`
  position: relative;
  z-index: 1;
`;
