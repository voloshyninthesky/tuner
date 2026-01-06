import { useMemo } from 'react';

interface TunerNeedleProps {
  cents: number;
  isActive: boolean;
}

// All tick marks from -50 to +50 in steps of 10
const TICKS = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];

export function TunerNeedle({ cents, isActive }: TunerNeedleProps) {
  // Clamp cents to -50 to +50 range
  const clampedCents = Math.max(-50, Math.min(50, cents));

  // Calculate rotation angle: -50 cents = -45deg, +50 cents = +45deg
  const rotation = (clampedCents / 50) * 45;

  // Determine color based on how in-tune it is
  const { color, label } = useMemo(() => {
    const absCents = Math.abs(clampedCents);
    if (!isActive) {
      return { color: '#6b7280', label: 'Waiting...' };
    }
    if (absCents <= 3) {
      return { color: '#22c55e', label: 'In Tune!' };
    }
    if (absCents <= 10) {
      return { color: '#84cc16', label: 'Almost' };
    }
    if (absCents <= 25) {
      return { color: '#eab308', label: clampedCents < 0 ? 'Too Low' : 'Too High' };
    }
    return { color: '#ef4444', label: clampedCents < 0 ? 'Too Low' : 'Too High' };
  }, [clampedCents, isActive]);

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[2/1]">
      {/* Background arc */}
      <svg
        viewBox="0 0 200 110"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* Arc background */}
        <path
          d="M 15 100 A 85 85 0 0 1 185 100"
          fill="none"
          stroke="#374151"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Green zone indicator (±5 cents) */}
        <path
          d="M 95.5 15.4 A 85 85 0 0 1 104.5 15.4"
          fill="none"
          stroke="#22c55e"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {TICKS.map((tick) => {
          const angle = ((tick / 50) * 45 - 90) * (Math.PI / 180);
          const isMajor = tick === 0 || Math.abs(tick) === 50;
          const isZero = tick === 0;

          const innerRadius = isMajor ? 68 : 74;
          const outerRadius = 85;
          const x1 = 100 + Math.cos(angle) * innerRadius;
          const y1 = 100 + Math.sin(angle) * innerRadius;
          const x2 = 100 + Math.cos(angle) * outerRadius;
          const y2 = 100 + Math.sin(angle) * outerRadius;

          // Only show labels at -50, 0, +50
          const showLabel = tick === -50 || tick === 0 || tick === 50;

          return (
            <g key={tick}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isZero ? '#22c55e' : '#6b7280'}
                strokeWidth={isMajor ? 2.5 : 1.5}
              />
              {showLabel && (
                <text
                  x={100 + Math.cos(angle) * 54}
                  y={100 + Math.sin(angle) * 54}
                  fill={isZero ? '#22c55e' : '#9ca3af'}
                  fontSize="9"
                  fontWeight={isZero ? 'bold' : 'normal'}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {tick > 0 ? `+${tick}` : tick}
                </text>
              )}
            </g>
          );
        })}

        {/* Needle */}
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '100px 100px',
            transition: isActive ? 'transform 0.1s ease-out' : 'none'
          }}
        >
          {/* Needle shadow */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="22"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="20"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Center circle */}
          <circle
            cx="100"
            cy="100"
            r="10"
            fill="#1f2937"
            stroke={color}
            strokeWidth="3"
          />
        </g>
      </svg>

      {/* Status label */}
      <div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 text-sm font-medium"
        style={{ color }}
      >
        {label}
      </div>
    </div>
  );
}
