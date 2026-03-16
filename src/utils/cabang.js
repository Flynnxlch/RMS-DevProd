// Utility functions for cabang/region code handling

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
  { code: 'SPOKE Bandara Internasional Yogyakarta, Kulon Progo', label: 'JOG/YIA' },
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
  { code: 'Station Representative Bandara Internasional Kertajati, Majalengka', label: 'KJT/BDO' },
];

/**
 * Get cabang label (short code) from regionCode
 * @param {string} regionCode - The region code (can be label or code)
 * @returns {string} - The label (short code) like "CGO", "KPS", etc.
 */
export function getCabangLabel(regionCode) {
  if (!regionCode) return '';
  const cabang = CABANG_OPTIONS.find(opt => opt.label === regionCode || opt.code === regionCode);
  return cabang ? cabang.label : regionCode;
}

/**
 * Get cabang code (full name) from regionCode
 * @param {string} regionCode - The region code (can be label or code)
 * @returns {string} - The code (full name) like "SBU Cargo & Warehouse", "Kantor Pusat", etc.
 */
export function getCabangCode(regionCode) {
  if (!regionCode) return '';
  const cabang = CABANG_OPTIONS.find(opt => opt.label === regionCode || opt.code === regionCode);
  return cabang ? cabang.code : regionCode;
}
