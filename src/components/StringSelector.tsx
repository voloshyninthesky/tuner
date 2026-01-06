import type { Tuning } from '../types';

interface StringSelectorProps {
  tuning: Tuning;
  selectedString: number | null;
  detectedStringIndex: number | null;
  onSelectString: (index: number | null) => void;
}

export function StringSelector({
  tuning,
  selectedString,
  detectedStringIndex,
  onSelectString
}: StringSelectorProps) {
  const stringCount = tuning.strings.length;

  // Don't render for chromatic mode
  if (tuning.instrument === 'chromatic' || stringCount === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="text-xs text-gray-400 text-center mb-2">
        Tap a string to lock, or let it auto-detect
      </div>

      <div className="flex justify-center gap-2">
        {tuning.strings.map((note, index) => {
          const isSelected = selectedString === index;
          const isDetected = detectedStringIndex === index && selectedString === null;
          const stringNumber = stringCount - index; // Strings are numbered from high to low

          return (
            <button
              key={index}
              onClick={() => onSelectString(isSelected ? null : index)}
              className={`
                relative flex flex-col items-center justify-center
                w-12 h-16 rounded-lg transition-all
                ${isSelected
                  ? 'bg-indigo-600 ring-2 ring-indigo-400'
                  : isDetected
                    ? 'bg-green-600/30 ring-2 ring-green-500'
                    : 'bg-gray-800 hover:bg-gray-700'
                }
              `}
            >
              <span className="text-xs text-gray-400 absolute top-1">
                {stringNumber}
              </span>
              <span className={`text-lg font-bold ${
                isSelected || isDetected ? 'text-white' : 'text-gray-300'
              }`}>
                {note.name}
              </span>
              <span className="text-xs text-gray-500">
                {note.octave}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
