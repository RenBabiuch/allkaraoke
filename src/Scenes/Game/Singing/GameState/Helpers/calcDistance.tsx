import GameState from '../GameState';

const MIDDLEA = 440;
const SEMITONE = 69;

export const pitchFromFrequency = (freq: number) =>
    Math.round(12 * (Math.log(freq / MIDDLEA) / Math.log(2))) + SEMITONE;

const getFrequencyOfNote = (note: number) => MIDDLEA * Math.pow(2, (note - SEMITONE) / 12);
const getDistanceInCents = (noteFreq: number, freq: number) =>
    Math.floor((1200 * Math.log(freq / noteFreq)) / Math.log(2));

const getCentDistance = (targetNote: number, freq: number) => {
    const tolerance = GameState.getTolerance();

    const noteFreq = getFrequencyOfNote(targetNote);
    const cents = getDistanceInCents(noteFreq, freq);
    // To handle cases for cents like -1150 (=50) or 1150 (=-50)
    const distance = Math.sign(cents) * ((((Math.abs(cents) % 1200) + 600) % 1200) - 600);

    return distance / (tolerance * 100 + 50);
};

export const calcDistanceBetweenPitches = (note: number, targetNote: number) => {
    const tolerance = GameState.getTolerance();
    // +6 / - 6 are here to avoid distances like -8 in favor of +4
    // (so smallest between "too high" or "too low" pitch to hit the note in whatever octave)
    const noteDistance = (((note % 12) - (targetNote % 12) + 6) % 12) - 6;

    return Math.abs(noteDistance) <= tolerance ? 0 : noteDistance;
};

export const calcDistance = (frequency: number, targetNote: number) => {
    const note = pitchFromFrequency(frequency);
    let preciseDistance: number = -1;
    const distance = calcDistanceBetweenPitches(note, targetNote);

    if (distance === 0) {
        preciseDistance = getCentDistance(targetNote, frequency);
    }

    return { distance, preciseDistance };
};
