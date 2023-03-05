import { FrequencyRecord, NotesSection, PlayerNote, SingSetup, Song } from 'interfaces';
import isNotesSection from 'Songs/utils/isNotesSection';
import { getNoteAtBeat } from 'Songs/utils/notesSelectors';
import InputManager from '../Input/InputManager';
import GameStateEvents from './GameStateEvents';
import { appendFrequencyToPlayerNotes } from './Helpers/appendFrequencyToPlayerNotes';
import calculateScore from './Helpers/calculateScore';
import getCurrentBeat from './Helpers/getCurrentBeat';
import getSongBeatLength from 'Songs/utils/getSongBeatLength';

class PlayerState {
    private frequencyRecords: FrequencyRecord[] = [];
    private playerNotes: PlayerNote[] = [];
    private realFrequencyRecords: FrequencyRecord[] = [];
    private realPlayerNotes: PlayerNote[] = [];
    private min = Infinity;
    private max = -Infinity;

    private storedSectionIndex = 0;

    public constructor(private index: number, private name: string, private gameState: GameState) {
        this.getTrack()
            .sections.filter(isNotesSection)
            .forEach((section) =>
                section.notes.forEach((note) => {
                    this.min = Math.min(this.min, note.pitch);
                    this.max = Math.max(this.max, note.pitch);
                }),
            );
    }

    public getName = () => this.name;
    public setName = (name: string) => (this.name = name);

    public update = () => {
        const currentTime = this.gameState.getCurrentTime();

        const frequency = InputManager.getPlayerFrequency(this.index);
        const currentTimestamp = currentTime - InputManager.getPlayerInputLag(this.index);

        // If it's a pack of frequencies (from remote mic), restore last "real" frequencies,
        // add and recalculate for the received pack, and store newly computed
        // frequencies for the moment when new package arrive.
        // If it's a single frequency, just add it to the notes
        if (Array.isArray(frequency)) {
            const lastRealRecord = this.realFrequencyRecords.at(-1) || this.frequencyRecords[0];
            const timestampStep = (currentTimestamp - lastRealRecord.timestamp) / frequency.length;

            this.frequencyRecords = this.realFrequencyRecords;
            this.playerNotes = this.realPlayerNotes;

            for (let i = 0; i < frequency.length; i++) {
                const timestamp = lastRealRecord.timestamp + timestampStep * (i + 1);
                this.updatePlayerNotes(timestamp, frequency[i]);
            }

            this.realFrequencyRecords = [...this.frequencyRecords];
            this.realPlayerNotes = JSON.parse(JSON.stringify(this.playerNotes));
        } else {
            this.updatePlayerNotes(currentTimestamp, frequency);
        }

        this.dispatchSectionUpdate();
    };

    private dispatchSectionUpdate = () => {
        const currentSectionIndex = this.getCurrentSectionIndex();
        if (this.storedSectionIndex !== currentSectionIndex) {
            GameStateEvents.sectionChange.dispatch(this.index, this.storedSectionIndex);
            this.storedSectionIndex = currentSectionIndex;
        }
    };

    public updatePlayerNotes = (timestamp: number, frequency: number) => {
        const record = { timestamp, frequency };
        this.frequencyRecords.push(record);

        const recordBeat = record.timestamp / this.gameState.getSongBeatLength();
        const recordSection = this.getSectionByBeat(recordBeat);

        if (isNotesSection(recordSection)) {
            const note = getNoteAtBeat(recordSection, recordBeat, 0) ?? getNoteAtBeat(recordSection, recordBeat, 0.5);

            if (note) appendFrequencyToPlayerNotes(this.playerNotes, record, note, this.gameState.getSongBeatLength());
        }
    };

    public getPlayerNotes = () => this.playerNotes;
    public getPlayerFrequencies = () => this.frequencyRecords;

    public getSectionIndexByBeat = (beat: number) => {
        return this.getTrack().sections.findIndex((section, index, sections) => {
            if (beat < 0) return true;
            if (beat < section.start) return false;
            if (index === sections.length - 1) return true;
            return sections[index + 1].start > beat;
        });
    };

    public getCurrentSectionIndex = () => this.getSectionIndexByBeat(this.gameState.getCurrentBeat());

    public getSectionByBeat = (beat: number) => this.getTrack().sections[this.getSectionIndexByBeat(beat)] ?? null;

    public getCurrentSection = () => {
        const sectionIndex = this.getCurrentSectionIndex();

        return this.getTrack().sections[sectionIndex] ?? null;
    };

    public getNextSection = (index = 1) => {
        const sectionIndex = this.getCurrentSectionIndex();

        return sectionIndex > -1 ? this.getTrack().sections[sectionIndex + index] ?? null : null;
    };

    public getPreviousSection = (index = 1) => {
        const sectionIndex = this.getCurrentSectionIndex();

        return sectionIndex > -1 ? this.getTrack().sections[sectionIndex - index] ?? null : null;
    };

    public getLastNotesSection = () => {
        const last = this.getTrack().sections.at(-1);
        return isNotesSection(last) ? last : (this.getTrack().sections.at(-2) as NotesSection);
    };

    public getScore = () => calculateScore(this.playerNotes, this.gameState.getSong()!, this.getTrackIndex());

    public getMinPitch = () => this.min;
    public getMaxPitch = () => this.max;

    public getTrackIndex = () => this.gameState.getSingSetup()!.players[this.index].track;
    public getTrack = () => this.gameState.getSong()!.tracks[this.getTrackIndex()];

    public resetNotes = () => {
        this.playerNotes = [];
    };
}

class GameState {
    private song: Song | null = null;
    private currentTime: number = 0;
    private duration: number = 0;
    private singSetup: SingSetup | null = null;
    private playerStates: PlayerState[] = [];

    public setCurrentTime = (currentTime: number) => (this.currentTime = currentTime);
    public getCurrentTime = (accountGap = true) => {
        return this.currentTime - (accountGap && this.song ? this.song.gap : 0);
    };

    public getSongBeatLength = () => getSongBeatLength(this.song!);
    public getCurrentBeat = () => {
        return getCurrentBeat(this.getCurrentTime(), this.getSongBeatLength(), 0, false);
    };

    public setSong = (song: Song) => (this.song = song);
    public getSong = () => this.song;

    public setSingSetup = (singSetup: SingSetup) => {
        this.singSetup = singSetup;

        this.playerStates = singSetup.players.map(({ name }, index) => new PlayerState(index, name, this));
    };
    public getSingSetup = () => this.singSetup;
    public getTolerance = () => this.getSingSetup()?.tolerance ?? 2;

    public setDuration = (duration: number) => (this.duration = duration);
    public getDuration = () => this.duration;

    public getPlayer = (player: number) => this.playerStates[player];

    public getPlayers = () => this.playerStates;

    public getPlayerCount = () => this.playerStates.length;

    public startInputMonitoring = async () => {
        return InputManager.startMonitoring();
    };

    public stopInputMonitoring = () => {
        return InputManager.stopMonitoring();
    };

    public update = () => {
        this.playerStates.forEach((player) => player.update());
    };
    public resetPlayerNotes = () => {
        this.playerStates.forEach((player) => player.resetNotes());
    };
}

export default new GameState();
