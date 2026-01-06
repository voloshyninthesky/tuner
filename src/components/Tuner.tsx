import { useState, useCallback, useEffect, useRef } from 'react';
import type { Instrument, Tuning, DetectedPitch } from '../types';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useTelegram } from '../hooks/useTelegram';
import { getTuningsForInstrument, getTuningById, findClosestStringNote } from '../lib/tunings';
import { TunerNeedle } from './TunerNeedle';
import { NoteDisplay } from './NoteDisplay';
import { StringSelector } from './StringSelector';
import { InstrumentSelector } from './InstrumentSelector';
import { ChromaticNotes } from './ChromaticNotes';

export function Tuner() {
  const [instrument, setInstrument] = useState<Instrument>('chromatic');
  const [tuning, setTuning] = useState<Tuning>(getTuningsForInstrument('chromatic')[0]);
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [detectedStringIndex, setDetectedStringIndex] = useState<number | null>(null);

  const { isTMA, hapticFeedback } = useTelegram();
  const wasInTuneRef = useRef(false);

  const handlePitchDetected = useCallback((pitch: DetectedPitch | null) => {
    if (pitch && pitch.note) {
      // Find which string is closest
      const { stringIndex } = findClosestStringNote(pitch.frequency, tuning);
      setDetectedStringIndex(stringIndex);

      // Haptic feedback when in tune
      const isInTune = Math.abs(pitch.cents) <= 3;
      if (isInTune && !wasInTuneRef.current && isTMA) {
        hapticFeedback.notificationOccurred('success');
      }
      wasInTuneRef.current = isInTune;
    } else {
      setDetectedStringIndex(null);
    }
  }, [tuning, isTMA, hapticFeedback]);

  const { isListening, error, start, stop, detectedPitch } = useAudioAnalyzer({
    tuning,
    onPitchDetected: handlePitchDetected
  });

  // Update tuning when instrument changes
  useEffect(() => {
    const newTunings = getTuningsForInstrument(instrument);
    setTuning(newTunings[0]);
    setSelectedString(null);
    setDetectedStringIndex(null);
  }, [instrument]);

  const handleTuningChange = useCallback((tuningId: string) => {
    const newTuning = getTuningById(tuningId);
    if (newTuning) {
      setTuning(newTuning);
      setSelectedString(null);
      setDetectedStringIndex(null);
    }
  }, []);

  const handleToggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // Determine the target note based on selection
  const targetNote = selectedString !== null
    ? tuning.strings[selectedString]
    : detectedStringIndex !== null
      ? tuning.strings[detectedStringIndex]
      : null;

  // Calculate cents for the needle
  const displayCents = detectedPitch?.cents ?? 0;

  return (
    <div className="flex flex-col h-full px-4 py-6">
      {/* Instrument & Tuning Selection */}
      <div className="mb-6">
        <InstrumentSelector
          instrument={instrument}
          tuning={tuning}
          onInstrumentChange={setInstrument}
          onTuningChange={handleTuningChange}
        />
      </div>

      {/* Main Tuner Display */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Tuner Needle */}
        <div className="mb-4">
          <TunerNeedle
            cents={displayCents}
            isActive={isListening && detectedPitch !== null}
          />
        </div>

        {/* Note Display */}
        <div className="mb-6">
          <NoteDisplay
            detectedPitch={detectedPitch}
            targetNote={targetNote}
          />
        </div>

        {/* String Selector or Chromatic Notes */}
        <div className="mb-6">
          {instrument === 'chromatic' ? (
            <ChromaticNotes
              detectedNote={detectedPitch?.note ?? null}
              isActive={isListening && detectedPitch !== null}
            />
          ) : (
            <StringSelector
              tuning={tuning}
              selectedString={selectedString}
              detectedStringIndex={isListening ? detectedStringIndex : null}
              onSelectString={setSelectedString}
            />
          )}
        </div>
      </div>

      {/* Start/Stop Button */}
      <div className="mt-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleToggle}
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition-all
            ${isListening
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }
          `}
        >
          {isListening ? 'Stop Tuning' : 'Start Tuning'}
        </button>

        <p className="text-center text-xs text-gray-500 mt-3">
          {isListening
            ? 'Listening... Play a string'
            : 'Tap to start using your microphone'
          }
        </p>
      </div>
    </div>
  );
}
