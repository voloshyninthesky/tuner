import { useState, useRef, useCallback, useEffect } from 'react';
import { detectPitch, hasSignal, smoothFrequency } from '../lib/pitchDetection';
import { findClosestStringNote } from '../lib/tunings';
import type { DetectedPitch, Tuning } from '../types';

interface UseAudioAnalyzerOptions {
  tuning: Tuning;
  onPitchDetected?: (pitch: DetectedPitch | null) => void;
}

interface UseAudioAnalyzerReturn {
  isListening: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  detectedPitch: DetectedPitch | null;
}

const BUFFER_SIZE = 4096;
const SMOOTHING_FACTOR = 0.4;
const MIN_CLARITY = 0.65;
const NOTE_HOLD_TIME = 1500;

export function useAudioAnalyzer({
  tuning,
  onPitchDetected
}: UseAudioAnalyzerOptions): UseAudioAnalyzerReturn {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedPitch, setDetectedPitch] = useState<DetectedPitch | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousFrequencyRef = useRef<number | null>(null);
  const lastPitchRef = useRef<DetectedPitch | null>(null);
  const lastPitchTimeRef = useRef<number>(0);
  const holdTimeoutRef = useRef<number | null>(null);

  // Use refs to always have current values in the analyze loop
  const tuningRef = useRef<Tuning>(tuning);
  const onPitchDetectedRef = useRef(onPitchDetected);

  // Keep refs in sync with props
  useEffect(() => {
    tuningRef.current = tuning;
    // Reset previous frequency when tuning changes to avoid smoothing across different tunings
    previousFrequencyRef.current = null;
  }, [tuning]);

  useEffect(() => {
    onPitchDetectedRef.current = onPitchDetected;
  }, [onPitchDetected]);

  const clearHoldTimeout = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }, []);

  const analyze = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) {
      return;
    }

    const buffer = new Float32Array(BUFFER_SIZE);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const now = Date.now();
    const currentTuning = tuningRef.current;

    // Check if there's enough signal
    if (!hasSignal(buffer, 0.008)) {
      if (lastPitchRef.current && now - lastPitchTimeRef.current < NOTE_HOLD_TIME) {
        // Keep showing the last pitch
      } else if (lastPitchRef.current) {
        clearHoldTimeout();
        holdTimeoutRef.current = window.setTimeout(() => {
          setDetectedPitch(null);
          onPitchDetectedRef.current?.(null);
          lastPitchRef.current = null;
        }, 100);
      }
      animationFrameRef.current = requestAnimationFrame(analyze);
      return;
    }

    const result = detectPitch(buffer, audioContextRef.current.sampleRate);

    if (result && result.clarity >= MIN_CLARITY) {
      clearHoldTimeout();

      const smoothedFrequency = smoothFrequency(
        result.frequency,
        previousFrequencyRef.current,
        SMOOTHING_FACTOR
      );
      previousFrequencyRef.current = smoothedFrequency;

      // Find closest note from the CURRENT tuning (using ref)
      const { note, cents } = findClosestStringNote(smoothedFrequency, currentTuning);

      const pitch: DetectedPitch = {
        frequency: smoothedFrequency,
        clarity: result.clarity,
        note,
        cents
      };

      lastPitchRef.current = pitch;
      lastPitchTimeRef.current = now;
      setDetectedPitch(pitch);
      onPitchDetectedRef.current?.(pitch);
    }

    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [clearHoldTimeout]);

  const start = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = BUFFER_SIZE * 2;
      analyser.smoothingTimeConstant = 0;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);
      previousFrequencyRef.current = null;
      lastPitchRef.current = null;
      lastPitchTimeRef.current = 0;

      animationFrameRef.current = requestAnimationFrame(analyze);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      console.error('Audio analyzer error:', err);
    }
  }, [analyze]);

  const stop = useCallback(() => {
    clearHoldTimeout();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    previousFrequencyRef.current = null;
    lastPitchRef.current = null;
    lastPitchTimeRef.current = 0;
    setIsListening(false);
    setDetectedPitch(null);
  }, [clearHoldTimeout]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isListening,
    error,
    start,
    stop,
    detectedPitch
  };
}
