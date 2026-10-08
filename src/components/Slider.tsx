import React from 'react';
import { haptic } from '../utils/dateAndHaptics';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label?: string;
  unit?: string;
  onChange: (val: number) => void;
  presets?: Array<{ label: string; value: number }>;
  ariaLabel?: string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  label,
  unit = '',
  onChange,
  presets,
  ariaLabel,
  className = '',
}) => {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = Number(e.target.value);
    if (nextVal !== value) {
      haptic(6);
      onChange(nextVal);
    }
  };

  const handlePreset = (presetVal: number) => {
    haptic(8);
    onChange(presetVal);
  };

  return (
    <div className={`w-full select-none ${className}`}>
      {(label || unit) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--muted)' }}>
              {label}
            </span>
          )}
          <span
            className="text-xs font-extrabold px-2 py-0.5 rounded-lg tabular-nums transition-transform active:scale-105"
            style={{ backgroundColor: 'var(--tint)', color: 'var(--accent)' }}
          >
            {value}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      )}

      <div className="relative py-2 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          aria-label={ariaLabel || label || 'Value slider'}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          className="w-full h-2.5 rounded-full appearance-none cursor-pointer focus:outline-none transition-all"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--line) ${pct}%, var(--line) 100%)`,
          }}
        />
      </div>

      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5 no-scrollbar">
          {presets.map((p) => {
            const active = value === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePreset(p.value)}
                className="flex-1 min-h-[38px] px-2.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 whitespace-nowrap"
                style={{
                  backgroundColor: active ? 'var(--tint)' : 'var(--surface)',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Slider;
