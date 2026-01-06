import { useMemo } from 'react';

interface TunerNeedleProps {
  cents: number;
  isActive: boolean;
}

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
    <div className="relative w-full max-w-xs mx-auto aspect-[2/1]">
      {/* Background arc */}
      <svg
        viewBox="0 0 200 100"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* Tick marks */}
        {[-50, -25, 0, 25, 50].map((tick) => {
          const angle = ((tick / 50) * 45 - 90) * (Math.PI / 180);
          const innerRadius = 70;
          const outerRadius = 85;
          const x1 = 100 + Math.cos(angle) * innerRadius;
          const y1 = 100 + Math.sin(angle) * innerRadius;
          const x2 = 100 + Math.cos(angle) * outerRadius;
          const y2 = 100 + Math.sin(angle) * outerRadius;

          return (
            <g key={tick}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={tick === 0 ? '#22c55e' : '#4b5563'}
                strokeWidth={tick === 0 ? 3 : 2}
              />
              <text
                x={100 + Math.cos(angle) * 58}
                y={100 + Math.sin(angle) * 58}
                fill="#9ca3af"
                fontSize="10"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {tick > 0 ? `+${tick}` : tick}
              </text>
            </g>
          );
        })}

        {/* Arc background */}
        <path
          d="M 15 100 A 85 85 0 0 1 185 100"
          fill="none"
          stroke="#374151"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Green zone indicator */}
        <path
          d="M 94 15.2 A 85 85 0 0 1 106 15.2"
          fill="none"
          stroke="#22c55e"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Needle */}
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '100px 100px',
            transition: isActive ? 'transform 0.1s ease-out' : 'none'
          }}
        >
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="20"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle
            cx="100"
            cy="100"
            r="8"
            fill={color}
          />
        </g>
      </svg>

      {/* Status label */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm font-medium"
        style={{ color }}
      >
        {label}
      </div>
    </div>
  );
}
