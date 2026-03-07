interface ChipSelectProps {
  options: readonly string[] | string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
  allowCustom?: boolean;
}

export default function ChipSelect({ options, selected, onChange, label, allowCustom }: ChipSelectProps) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const addCustom = () => {
    const custom = prompt('Enter custom option:');
    if (custom && !selected.includes(custom)) {
      onChange([...selected, custom]);
    }
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {[...options].map(option => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selected.includes(option)
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {option}
          </button>
        ))}
        {/* Show custom selections not in original options */}
        {selected.filter(s => !options.includes(s)).map(custom => (
          <button
            key={custom}
            type="button"
            onClick={() => toggle(custom)}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white shadow-sm"
          >
            {custom}
          </button>
        ))}
        {allowCustom && (
          <button
            type="button"
            onClick={addCustom}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-50 text-blue-600 border border-dashed border-blue-300 hover:bg-blue-50"
          >
            + Custom
          </button>
        )}
      </div>
    </div>
  );
}
