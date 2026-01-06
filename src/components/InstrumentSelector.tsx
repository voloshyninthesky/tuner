import type { Instrument, Tuning } from '../types';
import { getTuningsForInstrument } from '../lib/tunings';

interface InstrumentSelectorProps {
  instrument: Instrument;
  tuning: Tuning;
  onInstrumentChange: (instrument: Instrument) => void;
  onTuningChange: (tuningId: string) => void;
}

const INSTRUMENTS: { id: Instrument; label: string; icon: string }[] = [
  { id: 'guitar', label: 'Guitar', icon: '🎸' },
  { id: 'bass', label: 'Bass', icon: '🎸' },
  { id: 'ukulele', label: 'Ukulele', icon: '🪕' },
];

export function InstrumentSelector({
  instrument,
  tuning,
  onInstrumentChange,
  onTuningChange
}: InstrumentSelectorProps) {
  const tunings = getTuningsForInstrument(instrument);

  return (
    <div className="space-y-4">
      {/* Instrument tabs */}
      <div className="flex justify-center gap-2">
        {INSTRUMENTS.map((inst) => (
          <button
            key={inst.id}
            onClick={() => onInstrumentChange(inst.id)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all
              ${instrument === inst.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }
            `}
          >
            <span className="mr-1">{inst.icon}</span>
            {inst.label}
          </button>
        ))}
      </div>

      {/* Tuning dropdown */}
      <div className="flex justify-center">
        <select
          value={tuning.id}
          onChange={(e) => onTuningChange(e.target.value)}
          className="
            bg-gray-800 text-white px-4 py-2 rounded-lg
            border border-gray-700 focus:border-indigo-500 focus:outline-none
            cursor-pointer
          "
        >
          {tunings.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.strings.map(s => s.name).join(' ')})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
