/**
 * YIN Pitch Detection Algorithm
 *
 * Based on the paper:
 * "YIN, a fundamental frequency estimator for speech and music"
 * by Alain de Cheveigné and Hideki Kawahara
 *
 * This implementation provides accurate pitch detection suitable for
 * musical instrument tuning.
 */

export interface PitchResult {
  frequency: number;
  clarity: number;
}

const DEFAULT_THRESHOLD = 0.25;
const MIN_FREQUENCY = 27.5; // A0
const MAX_FREQUENCY = 2000; // Limit max frequency for instruments

/**
 * Detect pitch from audio buffer using YIN algorithm
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = DEFAULT_THRESHOLD
): PitchResult | null {
  // Calculate the buffer size limits based on frequency range
  const maxPeriod = Math.floor(sampleRate / MIN_FREQUENCY);
  const minPeriod = Math.ceil(sampleRate / MAX_FREQUENCY);

  // Need at least 2x the max period for autocorrelation
  const halfBuffer = Math.floor(buffer.length / 2);
  const actualMaxPeriod = Math.min(maxPeriod, halfBuffer);

  if (actualMaxPeriod < minPeriod) {
    return null;
  }

  // Step 1: Calculate the difference function
  const yinBuffer = new Float32Array(actualMaxPeriod);

  for (let tau = 0; tau < actualMaxPeriod; tau++) {
    yinBuffer[tau] = 0;
    for (let i = 0; i < actualMaxPeriod; i++) {
      const delta = buffer[i] - buffer[i + tau];
      yinBuffer[tau] += delta * delta;
    }
  }

  // Step 2: Calculate the cumulative mean normalized difference
  yinBuffer[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau < actualMaxPeriod; tau++) {
    runningSum += yinBuffer[tau];
    if (runningSum === 0) {
      yinBuffer[tau] = 1;
    } else {
      yinBuffer[tau] *= tau / runningSum;
    }
  }

  // Step 3: Find the first dip below threshold (absolute threshold)
  // This is key for finding the fundamental, not a harmonic
  let tauEstimate = -1;
  let minValue = Infinity;

  for (let tau = minPeriod; tau < actualMaxPeriod; tau++) {
    if (yinBuffer[tau] < threshold) {
      // Find the local minimum in this dip
      while (tau + 1 < actualMaxPeriod && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      // Take the first good dip (fundamental frequency)
      tauEstimate = tau;
      minValue = yinBuffer[tau];
      break;
    }
  }

  // No pitch found
  if (tauEstimate === -1) {
    return null;
  }

  // Step 4: Parabolic interpolation for better accuracy
  let betterTau: number;

  if (tauEstimate > 0 && tauEstimate < actualMaxPeriod - 1) {
    const s0 = yinBuffer[tauEstimate - 1];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[tauEstimate + 1];

    // Avoid division by zero
    const denominator = 2 * (2 * s1 - s2 - s0);
    if (Math.abs(denominator) > 1e-10) {
      betterTau = tauEstimate + (s2 - s0) / denominator;
    } else {
      betterTau = tauEstimate;
    }
  } else {
    betterTau = tauEstimate;
  }

  // Ensure betterTau is positive
  if (betterTau <= 0) {
    return null;
  }

  const frequency = sampleRate / betterTau;
  const clarity = 1 - minValue;

  // Validate frequency is in expected range
  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
    return null;
  }

  return {
    frequency,
    clarity
  };
}

/**
 * Check if the audio buffer has enough signal to analyze
 */
export function hasSignal(buffer: Float32Array, threshold: number = 0.003): boolean {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sum / buffer.length);
  return rms > threshold;
}

/**
 * Apply a simple smoothing to reduce noise
 */
export function smoothFrequency(
  current: number,
  previous: number | null,
  smoothingFactor: number = 0.4
): number {
  if (previous === null) {
    return current;
  }

  // Only smooth if frequencies are close (within 3%)
  const ratio = current / previous;
  if (ratio > 0.97 && ratio < 1.03) {
    return previous * (1 - smoothingFactor) + current * smoothingFactor;
  }

  return current;
}
