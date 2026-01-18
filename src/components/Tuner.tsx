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

  const [micError, setMicError] = useState<string | null>(null);

  const handleButtonPress = useCallback(() => {
    if (isListening) {
      stop();
      return;
    }

    setMicError(null);

    // Call getUserMedia directly in the click handler (required for mobile WebViews)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Microphone not supported');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        start(stream);
      })
      .catch(err => {
        console.error('Mic error:', err);
        setMicError('Microphone access denied. Please allow in Telegram settings.');
      });
  }, [isListening, start, stop]);

  // Don't use Telegram's Main Button - it breaks the user gesture chain for getUserMedia
  // Instead, we'll show our custom button on all platforms

  // Determine the target note based on selection
  const targetNote = selectedString !== null
    ? tuning.strings[selectedString]
    : detectedStringIndex !== null
      ? tuning.strings[detectedStringIndex]
      : null;

  // Calculate cents for the needle
  const displayCents = detectedPitch?.cents ?? 0;

  return (
    <div className="flex flex-col h-full px-4 py-4 overflow-hidden">
      {/* Instrument & Tuning Selection */}
      <div className="mb-4 flex-shrink-0">
        <InstrumentSelector
          instrument={instrument}
          tuning={tuning}
          onInstrumentChange={setInstrument}
          onTuningChange={handleTuningChange}
        />
      </div>

      {/* Main Tuner Display */}
      <div className="flex-1 flex flex-col justify-center min-h-0 overflow-auto">
        {/* Tuner Needle */}
        <div className="mb-2 flex-shrink-0">
          <TunerNeedle
            cents={displayCents}
            isActive={isListening && detectedPitch !== null}
          />
        </div>

        {/* Note Display */}
        <div className="mb-3 flex-shrink-0">
          <NoteDisplay
            detectedPitch={detectedPitch}
            targetNote={targetNote}
          />
        </div>

        {/* String Selector or Chromatic Notes */}
        <div className="mb-2 flex-shrink-0">
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

      {/* Start/Stop Button - hidden on mobile TMA where we use Telegram's Main Button */}
      <div className="flex-shrink-0 pt-2 pb-4">
        {(error || micError) && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm text-center">
            {error || micError}
          </div>
        )}

        <button
          onClick={handleButtonPress}
          type="button"
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition-all
            cursor-pointer select-none active:scale-[0.98] relative z-50
            ${isListening
              ? 'bg-red-600 active:bg-red-700 text-white'
              : 'bg-indigo-600 active:bg-indigo-700 text-white'
            }
          `}
          style={{
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            pointerEvents: 'auto',
            minHeight: '56px'
          }}
        >
          {isListening ? 'Stop' : 'Start Tuning'}
        </button>

        <p className="text-center text-xs text-gray-500 mt-2 pb-1">
          {isListening ? 'Listening...' : 'Tap to use microphone'}
        </p>
      </div>
    </div>
  );
}
