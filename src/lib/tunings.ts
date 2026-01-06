import type { Tuning, Note, Instrument } from '../types';

// Note frequencies (A4 = 440Hz)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function noteToFrequency(name: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(name.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#'));
  if (noteIndex === -1) return 0;

  // A4 = 440Hz, semitones from A4
  const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9);
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

export function createNote(name: string, octave: number): Note {
  return {
    name,
    octave,
    frequency: noteToFrequency(name, octave)
  };
}

export function frequencyToNote(frequency: number): { note: Note; cents: number } {
  if (frequency <= 0) {
    return { note: createNote('A', 4), cents: 0 };
  }

  // Calculate semitones from A4
  const semitonesFromA4 = 12 * Math.log2(frequency / 440);
  const roundedSemitones = Math.round(semitonesFromA4);
  const cents = Math.round((semitonesFromA4 - roundedSemitones) * 100);

  // Convert to note and octave
  const noteIndex = ((roundedSemitones % 12) + 12 + 9) % 12; // +9 because A is at index 9
  const octave = 4 + Math.floor((roundedSemitones + 9) / 12);

  return {
    note: createNote(NOTE_NAMES[noteIndex], octave),
    cents
  };
}

export function findClosestStringNote(frequency: number, tuning: Tuning): { note: Note; cents: number; stringIndex: number } {
  let closestNote = tuning.strings[0];
  let closestCents = Infinity;
  let stringIndex = 0;

  tuning.strings.forEach((note, index) => {
    const cents = 1200 * Math.log2(frequency / note.frequency);
    if (Math.abs(cents) < Math.abs(closestCents)) {
      closestCents = cents;
      closestNote = note;
      stringIndex = index;
    }
  });

  return {
    note: closestNote,
    cents: Math.round(closestCents),
    stringIndex
  };
}

// Guitar tunings (strings from low to high: 6 to 1)
export const GUITAR_TUNINGS: Tuning[] = [
  {
    id: 'guitar-standard',
    name: 'Standard',
    instrument: 'guitar',
    strings: [
      createNote('E', 2),
      createNote('A', 2),
      createNote('D', 3),
      createNote('G', 3),
      createNote('B', 3),
      createNote('E', 4),
    ]
  },
  {
    id: 'guitar-drop-d',
    name: 'Drop D',
    instrument: 'guitar',
    strings: [
      createNote('D', 2),
      createNote('A', 2),
      createNote('D', 3),
      createNote('G', 3),
      createNote('B', 3),
      createNote('E', 4),
    ]
  },
  {
    id: 'guitar-drop-c',
    name: 'Drop C',
    instrument: 'guitar',
    strings: [
      createNote('C', 2),
      createNote('G', 2),
      createNote('C', 3),
      createNote('F', 3),
      createNote('A', 3),
      createNote('D', 4),
    ]
  },
  {
    id: 'guitar-half-step-down',
    name: 'Half Step Down',
    instrument: 'guitar',
    strings: [
      createNote('D#', 2),
      createNote('G#', 2),
      createNote('C#', 3),
      createNote('F#', 3),
      createNote('A#', 3),
      createNote('D#', 4),
    ]
  },
  {
    id: 'guitar-open-g',
    name: 'Open G',
    instrument: 'guitar',
    strings: [
      createNote('D', 2),
      createNote('G', 2),
      createNote('D', 3),
      createNote('G', 3),
      createNote('B', 3),
      createNote('D', 4),
    ]
  },
  {
    id: 'guitar-dadgad',
    name: 'DADGAD',
    instrument: 'guitar',
    strings: [
      createNote('D', 2),
      createNote('A', 2),
      createNote('D', 3),
      createNote('G', 3),
      createNote('A', 3),
      createNote('D', 4),
    ]
  },
];

// Bass tunings (strings from low to high: 4 to 1)
export const BASS_TUNINGS: Tuning[] = [
  {
    id: 'bass-standard',
    name: 'Standard',
    instrument: 'bass',
    strings: [
      createNote('E', 1),
      createNote('A', 1),
      createNote('D', 2),
      createNote('G', 2),
    ]
  },
  {
    id: 'bass-drop-d',
    name: 'Drop D',
    instrument: 'bass',
    strings: [
      createNote('D', 1),
      createNote('A', 1),
      createNote('D', 2),
      createNote('G', 2),
    ]
  },
  {
    id: 'bass-half-step-down',
    name: 'Half Step Down',
    instrument: 'bass',
    strings: [
      createNote('D#', 1),
      createNote('G#', 1),
      createNote('C#', 2),
      createNote('F#', 2),
    ]
  },
  {
    id: 'bass-5-string',
    name: '5-String Standard',
    instrument: 'bass',
    strings: [
      createNote('B', 0),
      createNote('E', 1),
      createNote('A', 1),
      createNote('D', 2),
      createNote('G', 2),
    ]
  },
];

// Ukulele tunings (strings from bottom to top: 4 to 1)
export const UKULELE_TUNINGS: Tuning[] = [
  {
    id: 'ukulele-standard',
    name: 'Standard (C)',
    instrument: 'ukulele',
    strings: [
      createNote('G', 4),
      createNote('C', 4),
      createNote('E', 4),
      createNote('A', 4),
    ]
  },
  {
    id: 'ukulele-low-g',
    name: 'Low G',
    instrument: 'ukulele',
    strings: [
      createNote('G', 3),
      createNote('C', 4),
      createNote('E', 4),
      createNote('A', 4),
    ]
  },
  {
    id: 'ukulele-d-tuning',
    name: 'D Tuning',
    instrument: 'ukulele',
    strings: [
      createNote('A', 4),
      createNote('D', 4),
      createNote('F#', 4),
      createNote('B', 4),
    ]
  },
  {
    id: 'ukulele-baritone',
    name: 'Baritone',
    instrument: 'ukulele',
    strings: [
      createNote('D', 3),
      createNote('G', 3),
      createNote('B', 3),
      createNote('E', 4),
    ]
  },
];

export const ALL_TUNINGS: Tuning[] = [...GUITAR_TUNINGS, ...BASS_TUNINGS, ...UKULELE_TUNINGS];

export function getTuningsForInstrument(instrument: Instrument): Tuning[] {
  return ALL_TUNINGS.filter(t => t.instrument === instrument);
}

export function getTuningById(id: string): Tuning | undefined {
  return ALL_TUNINGS.find(t => t.id === id);
}

export function getDefaultTuningForInstrument(instrument: Instrument): Tuning {
  const tunings = getTuningsForInstrument(instrument);
  return tunings[0];
}
