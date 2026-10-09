import React from 'react';
import { Task, TaskCategory } from '../types';
import { getMinutesSinceMidnight } from '../utils/time';

interface DayArcProps {
  tasks: Task[];
  selectedDate: string;
  size?: 'compact' | 'large';
  showSun?: boolean;
  centerPrimary?: string;
  centerSecondary?: string;
  className?: string;
}

// Category to color mapping as specified in Daylight Orbit tokens
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  work: '#2F3E8F',
  meeting: '#E4572E',
  fitness: '#2A8C8C',
  personal: '#7A5FA8',
  other: '#2A8C8C',
};

export const DayArc: React.FC<DayArcProps> = ({
  tasks,
  selectedDate,
  size = 'compact',
  showSun = true,
  centerPrimary,
  centerSecondary,
  className = '',
}) => {
  const isCompact = size === 'compact';
  const width = 342;
  const height = isCompact ? 134 : 196;

  // Arc center & radius
  const cx = width / 2; // 171
  const cy = height - 14;
  const r = isCompact ? 116 : 148;
  const strokeWidth = isCompact ? 12 : 14;

  // Daylight Orbit: 06:00 (360m) to 22:00 (1320m) = 960 minutes
  const START_MINUTES = 360; // 06:00
  const END_MINUTES = 1320; // 22:00
  const TOTAL_MINUTES = 960;

  // Helper: map minutes since midnight to degree angle
  // 06:00 -> 180 deg (left), 22:00 -> 0 deg (right)
  const minutesToAngle = (m: number): number => {
    const clamped = Math.max(START_MINUTES, Math.min(END_MINUTES, m));
    return 180 - ((clamped - START_MINUTES) / TOTAL_MINUTES) * 180;
  };

  // Helper: point on arc in SVG coordinates (y flipped)
  const polarToCartesian = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  };

  // Helper: SVG arc path between two angles (from angle1 down to angle2, clockwise/sweep=1 in SVG coords)
  const createArcPath = (startAngle: number, endAngle: number) => {
    const startPoint = polarToCartesian(startAngle);
    const endPoint = polarToCartesian(endAngle);
    // sweep = 1 goes clockwise in SVG (which draws top arc from left to right)
    return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 0 1 ${endPoint.x} ${endPoint.y}`;
  };

  // Full track from 180 to 0 degrees
  const trackPath = createArcPath(180, 0);

  // Compute now minutes and position
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = selectedDate === todayStr;

  const sunAngle = minutesToAngle(currentMinutes);
  const sunPos = polarToCartesian(sunAngle);
  const isOutsideDaylight = currentMinutes < START_MINUTES || currentMinutes > END_MINUTES;

  // Filter tasks with a start time
  const scheduledTasks = tasks.filter((t) => !!t.startTime);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        role="img"
        aria-label={`Daylight Orbit Arc: ${centerPrimary || ''} ${centerSecondary || ''}`}
      >
        <defs>
          <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
        </defs>

        {/* Background Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--track, #D5DFE6)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Task Segments */}
        {scheduledTasks.map((task) => {
          const startM = getMinutesSinceMidnight(task.startTime);
          if (startM === null) return null;

          const duration = Math.max(20, task.durationMinutes || 30);
          const endM = startM + duration;

          const startAngle = minutesToAngle(startM);
          const endAngle = minutesToAngle(endM);

          // If start and end angles are identical, minimum delta
          const adjustedEndAngle = Math.abs(startAngle - endAngle) < 2 ? startAngle - 2 : endAngle;

          const path = createArcPath(startAngle, adjustedEndAngle);
          const color = CATEGORY_COLORS[task.category] || 'var(--color-personal, #7A5FA8)';
          const opacity = task.completed ? 0.35 : 0.95;

          return (
            <path
              key={task.id}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              opacity={opacity}
              className="transition-all duration-300"
            >
              <title>{`${task.title} (${task.startTime}, ${duration}m)`}</title>
            </path>
          );
        })}

        {/* Sun indicator */}
        {showSun && isToday && (
          <g className="transition-all duration-500">
            {/* Halo */}
            <circle
              cx={sunPos.x}
              cy={sunPos.y}
              r={12}
              fill="#F2A33A"
              opacity={isOutsideDaylight ? 0.2 : 0.35}
              filter="url(#sun-glow)"
            />
            {/* Sun Body */}
            <circle
              cx={sunPos.x}
              cy={sunPos.y}
              r={6.5}
              fill="#F2A33A"
              stroke="#FFFFFF"
              strokeWidth={2}
              opacity={isOutsideDaylight ? 0.7 : 1}
            />
          </g>
        )}

        {/* Time hour marks: 06:00 and 22:00 */}
        <text
          x={cx - r}
          y={cy + 13}
          textAnchor="middle"
          fill="var(--muted, #55636F)"
          fontSize="10"
          fontWeight="500"
          fontFamily="var(--font-body)"
        >
          06:00
        </text>
        <text
          x={cx + r}
          y={cy + 13}
          textAnchor="middle"
          fill="var(--muted, #55636F)"
          fontSize="10"
          fontWeight="500"
          fontFamily="var(--font-body)"
        >
          22:00
        </text>
      </svg>

      {/* Center Text inside Arc */}
      {(centerPrimary || centerSecondary) && (
        <div
          className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
          style={{ bottom: isCompact ? '16px' : '28px' }}
        >
          {centerPrimary && (
            <span
              className="font-heading font-bold text-2xl leading-tight tabular-nums"
              style={{ color: 'var(--ink, #17212B)' }}
            >
              {centerPrimary}
            </span>
          )}
          {centerSecondary && (
            <span
              className="font-body text-xs font-medium uppercase tracking-wider mt-0.5"
              style={{ color: 'var(--muted, #55636F)' }}
            >
              {centerSecondary}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
