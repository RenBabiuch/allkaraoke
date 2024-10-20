import { Song, SongPreview } from 'interfaces';
import beatToMs from 'Scenes/Game/Singing/GameState/Helpers/beatToMs';
import { getFirstNoteStartFromSections } from 'Songs/utils/notesSelectors';

export default function getSongFirstNoteMs(song: Song | SongPreview): number {
  const firstNote = Math.min(
    ...song.tracks.map((track) => ('sections' in track ? getFirstNoteStartFromSections(track.sections) : track.start)),
  );
  return beatToMs(firstNote, song) + song.gap;
}
