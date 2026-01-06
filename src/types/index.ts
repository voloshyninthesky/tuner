export type Instrument = 'chromatic' | 'guitar' | 'bass' | 'ukulele';

export interface Note {
  name: string;
  octave: number;
  frequency: number;
}

export interface Tuning {
  id: string;
  name: string;
  instrument: Instrument;
  strings: Note[];
}

export interface DetectedPitch {
  frequency: number;
  clarity: number;
  note: Note | null;
  cents: number;
}

export interface TunerState {
  isListening: boolean;
  instrument: Instrument;
  tuningId: string;
  selectedString: number | null;
  detectedPitch: DetectedPitch | null;
  error: string | null;
}
