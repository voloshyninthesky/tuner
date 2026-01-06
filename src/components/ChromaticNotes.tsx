import type { Note } from '../types';

interface ChromaticNotesProps {
  detectedNote: Note | null;
  isActive: boolean;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function ChromaticNotes({ detectedNote, isActive }: ChromaticNotesProps) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="grid grid-cols-12 gap-0.5">
        {NOTES.map((note) => {
          const isDetected = isActive && detectedNote?.name === note;
          const isSharp = note.includes('#');

          return (
            <div
              key={note}
              className={`
                flex items-center justify-center py-1.5 rounded text-xs font-medium transition-all
                ${isDetected
                  ? 'bg-green-600 text-white scale-110 z-10 shadow-lg'
                  : isSharp
                    ? 'bg-gray-900 text-gray-400'
                    : 'bg-gray-800 text-gray-300'
                }
              `}
            >
              {note}
            </div>
          );
        })}
      </div>
    </div>
  );
}
