import type { DetectedPitch, Note } from '../types';

interface NoteDisplayProps {
  detectedPitch: DetectedPitch | null;
  targetNote: Note | null;
}

export function NoteDisplay({ detectedPitch, targetNote }: NoteDisplayProps) {
  const displayNote = detectedPitch?.note || targetNote;

  if (!displayNote) {
    return (
      <div className="text-center py-6">
        <div className="text-6xl font-bold text-gray-500">--</div>
        <div className="text-lg text-gray-500 mt-2">Play a note</div>
      </div>
    );
  }

  const isInTune = detectedPitch && Math.abs(detectedPitch.cents) <= 5;

  return (
    <div className="text-center py-6">
      <div
        className={`text-7xl font-bold transition-colors ${
          isInTune ? 'text-green-500' : 'text-white'
        }`}
      >
        {displayNote.name}
        <span className="text-3xl align-top ml-1">{displayNote.octave}</span>
      </div>

      {detectedPitch && (
        <div className="mt-3 space-y-1">
          <div className="text-lg text-gray-400">
            {detectedPitch.frequency.toFixed(1)} Hz
          </div>
          <div className={`text-sm font-medium ${
            Math.abs(detectedPitch.cents) <= 5
              ? 'text-green-500'
              : detectedPitch.cents < 0
                ? 'text-yellow-500'
                : 'text-yellow-500'
          }`}>
            {detectedPitch.cents > 0 ? '+' : ''}{detectedPitch.cents} cents
          </div>
        </div>
      )}

      {targetNote && !detectedPitch && (
        <div className="mt-3 text-gray-500">
          Target: {targetNote.frequency.toFixed(1)} Hz
        </div>
      )}
    </div>
  );
}
