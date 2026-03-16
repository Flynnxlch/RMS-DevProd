import { useEffect, useRef, useState } from 'react';

const CABANG_OPTIONS = [
  { code: 'Kantor Pusat', label: 'KPS' },
  { code: 'SBU Cargo & Warehouse', label: 'CGO' },
  { code: 'HUB Bandara Internasional Soekarno-Hatta, Cengkareng', label: 'CGK' },
  { code: 'HUB Bandara Internasional Ngurah Rai, Denpasar', label: 'DPS' },
  { code: 'HUB Bandara Internasional Juanda, Surabaya', label: 'SUB' },
  { code: 'HUB Bandara Internasional Sultan Hasanuddin, Makassar', label: 'UPG' },
  { code: 'HUB Bandara Internasional Kualanamu, Medan', label: 'KNO' },
  { code: 'SPOKE Bandara Internasional APT Pranoto, Samarinda', label: 'AAP' },
  { code: 'SPOKE Bandara Internasional Pattimura, Ambon', label: 'AMQ' },
  { code: 'SPOKE Bandara Internasional Syamsudin Noor, Banjarmasin', label: 'BDJ' },
  { code: 'SPOKE Bandara Fatmawati Soekarno, Bengkulu', label: 'BKS' },
  { code: 'SPOKE Bandara Internasional Sepinggan, Balikpapan', label: 'BPN' },
  { code: 'SPOKE Bandara Internasional Hang Nadim, Batam', label: 'BTH' },
  { code: 'SPOKE Bandara Internasional Sultan Iskandar Muda, Banda Aceh', label: 'BTJ' },
  { code: 'SPOKE Bandara Internasional Blimbingsari, Banyuwangi', label: 'BWX' },
  { code: 'SPOKE Bandara Sultan Thaha, Jambi', label: 'DJB' },
  { code: 'SPOKE Bandara Internasional Sentani, Jayapura', label: 'DJJ' },
  { code: 'SPOKE Bandara Sisingamangaraja XII, Silangitgns', label: 'DTB' },
  { code: 'SPOKE Bandara Dr. Ferdinand Lumban Tobing, Sibolga', label: 'FLZ' },
  { code: 'SPOKE Bandara Binaka, Gunung Sitoli', label: 'GNS' },
  { code: 'SPOKE Bandara Internasional Halim Perdanakusuma, Jakarta', label: 'HLP' },
  { code: 'SPOKE Bandara Internasional Yogyakarta, Kulon Progo', label: 'YIA' },
  { code: 'SPOKE Bandara Internasional El Tari, Kupang', label: 'KOE' },
  { code: 'SPOKE Bandara Komodo, Labuan Bajo', label: 'LBJ' },
  { code: 'SPOKE Bandara Internasional Lombok Praya, Mataram', label: 'LOP' },
  { code: 'SPOKE Bandara Internasional Sam Ratulangi, Manado', label: 'MDC' },
  { code: 'SPOKE Bandara Internasional Mopah, Merauke', label: 'MKQ' },
  { code: 'SPOKE Bandara Rendani, Manokwari', label: 'MKW' },
  { code: 'SPOKE Bandara Internasional Minangkabau, Padang', label: 'PDG' },
  { code: 'SPOKE Bandara Depati Amir, Pangkal Pinang', label: 'PGK' },
  { code: 'SPOKE Bandara Internasional Syarif Kasim II, Pekanbaru', label: 'PKU' },
  { code: 'SPOKE Bandara Internasional SM Badaruddin II, Palembang', label: 'PLM' },
  { code: 'SPOKE Bandara Internasional Supadio, Pontianak', label: 'PNK' },
  { code: 'SPOKE Bandara Internasional Adisumarmo, Solo', label: 'SOC' },
  { code: 'SPOKE Bandara Internasional Jenderal Ahmad Yani, Semarang', label: 'SRG' },
  { code: 'SPOKE Bandara H.A.S Hanandjoeddin, Tanjung Pandan', label: 'TJQ' },
  { code: 'SPOKE Bandara Internasional Raden Inten II, Bandar Lampung', label: 'TKG' },
  { code: 'SPOKE Bandara Internasional Raja Haji Fisabilillah, Tanjung Pinang', label: 'TNJ' },
  { code: 'Station Representative Bandara Internasional Frans Kaisieppo, Biak', label: 'BIK' },
  { code: 'Station Representative Bandara Internasional Kertajati, Majalengka', label: 'KJT' },
];

export default function CabangDropdown({ value, onChange, error = false, openUpward = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  // Support both label (short code) and code (full name) for backward compatibility
  const selectedOption = CABANG_OPTIONS.find(opt => opt.label === value || opt.code === value) || CABANG_OPTIONS[0];

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
    // Send label (short code) instead of code (full name) for regionCode
    // This matches the keys in CABANG_SPECIFIC_DIVISIONS
    onChange(option.label);
    setIsOpen(false);
  };

  const inputBase = 'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';
  const borderClass = error ? 'border-red-500 dark:border-red-500' : '';

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${inputBase} ${borderClass} text-left cursor-pointer pr-10`}
        >
          <span className="block truncate text-sm">{selectedOption.label}</span>
        </button>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <i className={`bi bi-chevron-down text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute z-50 w-full ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden`}>
            <div
              ref={listRef}
              className="max-h-[192px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {CABANG_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    value === option.code
                      ? 'bg-[#0c9361]/10 dark:bg-[#0c9361]/20 text-[#0c9361] dark:text-[#0c9361] font-medium'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
