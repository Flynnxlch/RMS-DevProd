import { useEffect, useMemo, useRef, useState } from 'react';

const CONTROL_EFFECTIVENESS_OPTIONS = [
  'Cukup dan Efektif, artinya control berupa SOP, Pedoman, Manual, Prosedur, WI, Program yang dimiliki sudah mencakup risiko yang dimaksud dan pelaksanaannya berjalan dengan optimal',
  'Cukup dan Efektif Sebagian, artinya control yang dimiliki sudah mencakup pengendalian risiko namun pelaksanaannya tidak konsisten dan belum optimal',
  'Cukup dan Tidak Efektif, artinya control yang dimiliki sudah mencakuup pengendalian risiko terkait namun tidak dilaksanakan, missal terdapat kegiatan yang tidak mengacu ke SOP',
  'Tidak Cukup dan Efektif Sebagian, artinya sudah ada control SOP, pedoman, prosedur yang dimiliki namun belum seluruh risiko namun pelaksanaannya cukup efektif, karena tidak cukup maka harus menambah atau merevisi pedomannya agar menjelaskan terkait risiko',
  'Tidak Cukup dan Tidak Efektif, artinya control yang ada tidak mampu meminimalisir risiko dan tidak dilaksanakan juga oleh para karyawan sehingga pedoman/sop tadi harus diganti',
];

export default function ControlEffectivenessDropdown({
  id,
  value,
  onChange,
  error = false,
  openUpward = false,
  className = '',
  placeholder = 'Pilih Penilaian Efektivitas',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(() => {
    if (!value) return null;
    return CONTROL_EFFECTIVENESS_OPTIONS.find((opt) => opt === value) || null;
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';
  const borderClass = error ? 'border-red-500 dark:border-red-500' : '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${inputBase} ${borderClass} text-left cursor-pointer pr-10`}
        >
          <span className="block truncate text-sm">{selected || placeholder}</span>
        </button>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <i className={`bi bi-chevron-down text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className={`absolute z-50 w-full ${
              openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
            } bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden`}
          >
            <div
              ref={listRef}
              className="max-h-[192px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {CONTROL_EFFECTIVENESS_OPTIONS.map((opt) => {
                const isSelected = selected === opt || value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isSelected
                        ? 'bg-[#0c9361]/10 dark:bg-[#0c9361]/20 text-[#0c9361] dark:text-[#0c9361] font-medium'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
