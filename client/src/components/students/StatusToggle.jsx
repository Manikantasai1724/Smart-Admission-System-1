import React, { memo } from 'react';

function StatusToggle({ checked = false, onChange, disabled = false, label = '' }) {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`toggle-switch ${
          checked
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-md shadow-emerald-500/25'
            : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`toggle-switch-dot ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400 select-none">{label}</span>
      )}
    </div>
  );
}

export default memo(StatusToggle);
