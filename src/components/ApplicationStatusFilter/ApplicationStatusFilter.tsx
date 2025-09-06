import * as React from 'react';
import { StatusFilter } from '@/types/query';

type SelectorSliderProps = {
  applicationState: StatusFilter;
  onChange: (value: StatusFilter) => void;
  labels?: Partial<Record<StatusFilter, string>>;
  counts?: Partial<Record<StatusFilter, number>>;
  className?: string;
  disabled?: boolean;
};

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Denied', label: 'Denied' },
];

export default function ApplicationStatusFilter({
  applicationState,
  onChange,
  labels,
  counts,
  className,
  disabled,
}: SelectorSliderProps) {
  const value = applicationState; // alias for clarity with existing logic

  const idx = React.useMemo(
    () => OPTIONS.findIndex((o) => o.value === value),
    [value]
  );

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (idx + dir + OPTIONS.length) % OPTIONS.length;
      onChange(OPTIONS[next].value);
    },
    [idx, onChange, disabled]
  );

  const wrapperClasses = [
    'inline-flex items-center gap-1  bg-gray-200 p-1 shadow-inner rounded-sm',
    disabled ? 'opacity-60' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="tablist"
      aria-label="Filter applications by status"
      onKeyDown={onKeyDown}
      className={wrapperClasses}
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        const label = labels?.[opt.value] ?? opt.label;
        const count = counts?.[opt.value];

        const buttonClasses = [
          'group relative px-6 py-2.5 text-sm font-medium transition text-gray-200 text-button rounded-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 hover:cursor-pointer',
          active
            ? 'bg-white text-purple-600 shadow-sm ring-1 ring-gray-300'
            : 'text-gray-600 hover:text-gray-900',
        ].join(' ');

        const badgeClasses = [
          'min-w-[1.25rem] rounded-full px-1 text-center text-[11px] leading-4 ring-1',
          active
            ? 'bg-purple-50 text-purple-700 ring-purple-200'
            : 'bg-gray-100 text-gray-600 ring-gray-200 group-hover:bg-gray-50',
        ].join(' ');

        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            aria-disabled={disabled || undefined}
            disabled={disabled}
            className={buttonClasses}
            onClick={() => !disabled && onChange(opt.value)}
          >
            <span className="inline-flex items-center gap-2">
              <span>{label}</span>
              {typeof count === 'number' && (
                <span className={badgeClasses}>{count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
