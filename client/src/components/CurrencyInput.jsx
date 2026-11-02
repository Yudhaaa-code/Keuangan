import React from 'react';

export function formatRibuan(val) {
  if (val === '' || val === null || val === undefined) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

export function parseRibuan(formatted) {
  if (!formatted) return '';
  return String(formatted).replace(/\D/g, '');
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  required = false,
  className = '',
  inputClassName = '',
  showPrefix = true,
}) {
  const displayValue = formatRibuan(value);
  const customClass = (className || inputClassName || '').trim();

  const handleChange = (e) => {
    const rawDigits = parseRibuan(e.target.value);
    onChange(rawDigits);
  };

  if (!showPrefix) {
    const finalInputClass = customClass
      ? `w-full ${customClass}`
      : 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500';

    return (
      <input
        type="text"
        inputMode="numeric"
        required={required}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className={finalInputClass}
      />
    );
  }

  const finalPrefixClass = customClass
    ? `w-full pl-12 ${customClass}`
    : 'w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="relative w-full">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 pointer-events-none select-none">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        required={required}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className={finalPrefixClass}
      />
    </div>
  );
}

