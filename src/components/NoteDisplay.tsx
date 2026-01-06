import type { DetectedPitch, Note } from '../types';

interface NoteDisplayProps {
  detectedPitch: DetectedPitch | null;
  targetNote: Note | null;
}

export function NoteDisplay({ detectedPitch, targetNote }: NoteDisplayProps) {
  const displayNote = detectedPitch?.note || targetNote;

  if (!displayNote) {
    return (
      <div className="text-center py-3">
        <div className="text-5xl font-bold text-gray-500">--</div>
        <div className="text-sm text-gray-500 mt-1">Play a note</div>
      </div>
    );
  }

  const isInTune = detectedPitch && Math.abs(detectedPitch.cents) <= 5;

  return (
    <div className="text-center py-2">
      <div
        className={`text-6xl font-bold transition-colors ${
          isInTune ? 'text-green-500' : 'text-white'
        }`}
      >
        {displayNote.name}
        <span className="text-2xl align-top ml-1">{displayNote.octave}</span>
      </div>

      {detectedPitch && (
        <div className="mt-1 flex items-center justify-center gap-3 text-sm">
          <span className="text-gray-400">
            {detectedPitch.frequency.toFixed(1)} Hz
          </span>
          <span className={`font-medium ${
            Math.abs(detectedPitch.cents) <= 5
              ? 'text-green-500'
              : 'text-yellow-500'
          }`}>
            {detectedPitch.cents > 0 ? '+' : ''}{detectedPitch.cents}¢
          </span>
        </div>
      )}

      {targetNote && !detectedPitch && (
        <div className="mt-1 text-sm text-gray-500">
          Target: {targetNote.frequency.toFixed(1)} Hz
        </div>
      )}
    </div>
  );
}
