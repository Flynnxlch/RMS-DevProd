import { useState, useEffect, useMemo } from 'react';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { apiRequest, API_ENDPOINTS } from '../config/api';

const ITEMS_PER_PAGE = 1; // 1 peraturan per halaman

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function categoryBadgeClass(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('peraturan')) return 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-900/30 dark:text-red-300';
  if (c.includes('pedoman')) return 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-900/30 dark:text-green-300';
  if (c.includes('kriteria')) return 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
  if (c.includes('pemberitahuan')) return 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
  return 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200';
}

function WhatsNewContent() {
  const [updates, setUpdates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiRequest(API_ENDPOINTS.regulations.getAll);
      // Transform data from backend format to frontend format
      // Backend already sorts by publishedAt descending
      const transformed = (data.updates || []).map(update => ({
        id: update.id,
        title: update.title,
        category: update.category,
        type: update.contentType.toLowerCase(), // TEXT -> text, IMAGE -> image
        content: update.content,
        publishedAt: update.publishedAt,
        link: update.link,
      }));
      setUpdates(transformed);
    } catch (err) {
      console.error('Error loading regulation updates:', err);
      setError(err.message || 'Gagal memuat update peraturan');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = useMemo(() => {
    return Math.ceil(updates.length / ITEMS_PER_PAGE);
  }, [updates.length]);

  const paginatedUpdates = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return updates.slice(startIndex, endIndex);
  }, [updates, currentPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            Halaman ini menampilkan update dan perubahan terbaru pada sistem Manajemen Risiko Gapura.
          </p>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Memuat update peraturan...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            Halaman ini menampilkan update dan perubahan terbaru pada sistem Manajemen Risiko Gapura.
          </p>
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              Kesalahan: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            Halaman ini menampilkan update dan perubahan terbaru pada sistem Manajemen Risiko Gapura.
          </p>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Belum ada update peraturan terbaru. Update akan ditampilkan di sini setelah ditambahkan oleh administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 text-gray-700 dark:text-gray-300">
        <p>
          Halaman ini menampilkan update dan perubahan terbaru pada sistem Manajemen Risiko Gapura.
        </p>
      </div>

      {/* Updates List - Display full content per page */}
      <div className="space-y-4">
        {paginatedUpdates.map((update) => (
          <div
            key={update.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${categoryBadgeClass(update.category)}`}>
                {update.category}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(update.publishedAt)}
              </span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {update.title}
            </h4>
            {update.type === 'text' ? (
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {update.content}
              </div>
            ) : (
              <div className="mt-2">
                <img
                  src={update.content}
                  alt={update.title}
                  className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
            {update.link && update.link.trim() && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href={update.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <i className="bi bi-link-45deg"></i>
                  <span>Baca selengkapnya</span>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="bi bi-chevron-left"></i>
            <span>Sebelumnya</span>
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Peraturan {currentPage} dari {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Selanjutnya</span>
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}

const GUIDE_SECTIONS = [
  {
    id: 'whats-new',
    title: 'Apa Yang Terbaru',
    icon: 'bi-star-fill',
    content: <WhatsNewContent />,
  },
  {
    id: 'overview',
    title: 'Gambaran Umum Sistem',
    icon: 'bi-info-circle',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          Sistem Manajemen Risiko Gapura adalah platform untuk mengelola, menganalisis, dan memitigasi risiko operasional di PT. Gapura Angkasa.
        </p>
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-white">Fitur Utama:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4">
            <li>Registrasi dan entri risiko baru</li>
            <li>Analisis risiko inheren dan residual</li>
            <li>Perencanaan dan pelaksanaan mitigasi</li>
            <li>Evaluasi keberhasilan mitigasi</li>
            <li>Dashboard dan laporan risiko</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'register-risk',
    title: 'Cara Mendaftarkan Risiko Baru',
    icon: 'bi-file-plus',
    content: (
      <div className="space-y-4">
        <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 ml-2">
          <li>
            <strong>Klik menu "Register Risiko"</strong> atau tombol "Risiko Baru" di halaman Semua Risiko
          </li>
          <li>
            <strong>Isi formulir Entri Risiko:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Peristiwa Risiko: Deskripsi risiko yang terjadi</li>
              <li>Organisasi: PT. Gapura Angkasa (otomatis)</li>
              <li>Divisi: Pilih divisi terkait</li>
              <li>Target: Tujuan yang terdampak</li>
              <li>Kategori: Pilih kategori risiko</li>
              <li>Cabang: Pilih lokasi cabang</li>
            </ul>
          </li>
          <li>
            <strong>Klik "Simpan"</strong> untuk menyimpan risiko baru
          </li>
          <li>
            Setelah disimpan, risiko akan muncul dengan status "Open Risk" dan perlu dianalisis
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: 'analyze-risk',
    title: 'Cara Menganalisis Risiko',
    icon: 'bi-clipboard-data',
    content: (
      <div className="space-y-4">
        <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 ml-2">
          <li>
            <strong>Buka detail risiko</strong> yang ingin dianalisis dari halaman "Semua Risiko"
          </li>
          <li>
            <strong>Klik tab "Analisis Risiko"</strong> atau tombol "Analisis Risiko"
          </li>
          <li>
            <strong>Isi Bagian 1 - Kontrol yang Ada:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Kontrol yang Ada: Deskripsi kontrol yang sudah ada</li>
              <li>Tipe Kontrol: Pilih tipe kontrol</li>
              <li>Tingkat Kontrol: Pilih tingkat kontrol</li>
              <li>Penilaian Efektivitas: Pilih tingkat efektivitas</li>
            </ul>
          </li>
          <li>
            <strong>Isi Bagian 2 - Key Risk Indicator (KRI):</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Indikator Kunci Risiko: Deskripsi KRI</li>
              <li>Unit KRI: Unit pengukuran</li>
              <li>Nilai Aman, Hati-hati, Bahaya: Tentukan threshold</li>
            </ul>
          </li>
          <li>
            <strong>Isi Bagian 3 - Risiko Inheren:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Tingkat Dampak: Pilih 1-5 (Sangat Rendah sampai Sangat Tinggi)</li>
              <li>Kemungkinan: Pilih 1-5 (Sangat Jarang sampai Hampir Pasti)</li>
              <li>Deskripsi Dampak dan Kemungkinan</li>
            </ul>
          </li>
          <li>
            <strong>Isi Bagian 4 - Risiko Residual:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Isi tingkat dampak dan kemungkinan residual</li>
              <li>Sistem akan menghitung skor risiko secara otomatis</li>
            </ul>
          </li>
          <li>
            <strong>Klik "Simpan Analisis"</strong> untuk menyimpan hasil analisis
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: 'mitigation',
    title: 'Cara Membuat Rencana Mitigasi',
    icon: 'bi-shield-check',
    content: (
      <div className="space-y-4">
        <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 ml-2">
          <li>
            <strong>Buka detail risiko</strong> yang sudah dianalisis
          </li>
          <li>
            <strong>Klik tab "Rencana Mitigasi"</strong> atau tombol "Buat Rencana Mitigasi"
          </li>
          <li>
            <strong>Isi informasi mitigasi:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Tipe Penanganan: Pilih tipe penanganan risiko</li>
              <li>Rencana Mitigasi: Deskripsi rencana mitigasi yang akan dilakukan</li>
              <li>Output Mitigasi: Hasil yang diharapkan</li>
              <li>Anggaran: Anggaran yang dialokasikan</li>
              <li>Realisasi: Biaya realisasi mitigasi</li>
              <li>Target Realisasi: Target yang ingin dicapai</li>
              <li>Target KPI: Indikator kinerja utama</li>
            </ul>
          </li>
          <li>
            <strong>Isi Kondisi Risiko Terkini:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Tingkat Dampak dan Kemungkinan setelah mitigasi</li>
              <li>Sistem akan menghitung skor residual secara otomatis</li>
            </ul>
          </li>
          <li>
            <strong>Klik "Simpan Rencana Mitigasi"</strong> untuk menyimpan
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: 'evaluation',
    title: 'Cara Melakukan Evaluasi Keberhasilan',
    icon: 'bi-calendar-check',
    content: (
      <div className="space-y-4">
        <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 ml-2">
          <li>
            <strong>Buka detail risiko</strong> yang sudah memiliki rencana mitigasi
          </li>
          <li>
            <strong>Klik tab "Evaluasi"</strong> atau tombol "Evaluasi Keberhasilan"
          </li>
          <li>
            <strong>Isi formulir evaluasi:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Status Evaluasi: Pilih status (Effective, Partially Effective, Ineffective, Not Started)</li>
              <li>Tanggal Evaluasi: Tanggal evaluasi dilakukan</li>
              <li>Catatan Evaluator: Catatan tambahan dari evaluator</li>
            </ul>
          </li>
          <li>
            <strong>Isi Evaluasi Keberhasilan Mitigasi:</strong>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Target Yang Tercapai: Deskripsi target yang berhasil dicapai</li>
              <li>Keterangan (opsional): Keterangan tambahan</li>
            </ul>
          </li>
          <li>
            <strong>Klik "Diterima"</strong> jika mitigasi efektif atau <strong>"Ditolak"</strong> jika tidak efektif
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: 'dashboard',
    title: 'Memahami Dashboard',
    icon: 'bi-speedometer2',
    content: (
      <div className="space-y-4">
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            Dashboard menampilkan ringkasan dan statistik risiko secara visual untuk membantu pengambilan keputusan.
          </p>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">KPI Cards:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4">
              <li><strong>Total Risiko:</strong> Jumlah total risiko yang terdaftar</li>
              <li><strong>Tinggi + Ekstrem:</strong> Jumlah risiko dengan tingkat tinggi dan ekstrem</li>
              <li><strong>Cakupan Mitigasi:</strong> Persentase risiko yang sudah memiliki rencana mitigasi</li>
              <li><strong>Evaluasi Keberhasilan:</strong> Jumlah risiko yang sudah dievaluasi</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Chart dan Grafik:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4">
              <li><strong>Rekapitulasi Risiko:</strong> Trend status risiko (Analyzed dan Planned) per periode</li>
              <li><strong>Indeks Risiko Gapura:</strong> Trend skor rata-rata dan inherent risk ratio</li>
              <li><strong>Distribusi Status:</strong> Distribusi risiko berdasarkan status</li>
              <li><strong>Matriks Risiko:</strong> Visualisasi risiko dalam matriks 5x5</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Filter Periode:</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Anda dapat memilih periode tampilan chart antara <strong>"6 Bulan Terakhir"</strong> atau <strong>"Bulan Ini"</strong> untuk melihat data yang lebih detail.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'risk-levels',
    title: 'Tingkat Risiko',
    icon: 'bi-bar-chart-line',
    content: (
      <div className="space-y-4">
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            Sistem menggunakan skala 1-25 untuk mengukur tingkat risiko berdasarkan kombinasi Dampak dan Kemungkinan.
          </p>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Kategori Tingkat Risiko:</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li><strong>Rendah (1-5):</strong> Risiko dengan dampak dan kemungkinan rendah</li>
              <li><strong>Rendah-Menengah (6-9):</strong> Risiko dengan dampak atau kemungkinan sedang</li>
              <li><strong>Menengah (10-15):</strong> Risiko dengan dampak dan kemungkinan sedang</li>
              <li><strong>Menengah-Tinggi (16-19):</strong> Risiko dengan dampak atau kemungkinan tinggi</li>
              <li><strong>Tinggi (20-25):</strong> Risiko dengan dampak dan kemungkinan tinggi, memerlukan perhatian segera</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Cara Membaca Matriks Risiko:</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Matriks risiko menampilkan posisi risiko berdasarkan kombinasi Dampak (sumbu X) dan Kemungkinan (sumbu Y). 
              Semakin ke kanan atas, semakin tinggi tingkat risikonya.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'qualitative-impact',
    title: 'Kriteria Dampak Kualitatif',
    icon: 'bi-list-check',
    content: (
      <div className="space-y-4">
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            Kriteria Dampak Kualitatif digunakan untuk mengukur dampak risiko berdasarkan kategori risiko dan sub-kriteria kualitatif dengan skala 1-5.
          </p>
          
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-xs">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold align-top w-64">Risiko Kualitatif</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold align-top min-w-32">1<br/>Sangat Rendah</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold align-top min-w-32">2<br/>Rendah</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold align-top min-w-32">3<br/>Moderat</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold align-top min-w-32">4<br/>Tinggi</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold align-top min-w-32">5<br/>Sangat Tinggi</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {/* Risiko Strategis */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Strategis</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Dampak keterlambatan pencapaian program strategis</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">&lt; 1 bulan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">1 - 3 bulan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">3 - 6 bulan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">6 - 9 bulan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">&gt; 9 bulan</td>
                  </tr>
                  
                  {/* Risiko Hukum */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Hukum</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Pelanggaran hukum</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Tidak ada somasi/tuntutan hukum</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Somasi/tuntutan hukum diterima namun dapat diselesaikan di luar pengadilan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Perusahaan diputuskan kalah di pengadilan tingkat pertama</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Perusahaan diputuskan kalah di pengadilan tingkat banding</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Perusahaan diputuskan kalah di pengadilan tingkat selanjutnya</td>
                  </tr>
                  
                  {/* Risiko Kepatuhan */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Kepatuhan</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Pelanggaran ketentuan kepatuhan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Teguran informal / verbal</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Teguran tertulis</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Regulator memberlakukan sanksi ringan (misalkan denda administratif)</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Regulator memberlakukan sanksi sedang (misalkan penangguhan izin operasional sementara)</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Regulator memberlakukan sanksi signifikan (misalkan delisting saham, tidak diperkenankan mengikuti kliring, menarik produk yang beredar, dan lain-lain)</td>
                  </tr>
                  
                  {/* Risiko Reputasi */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Reputasi</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Keluhan pelanggan / nasabah / pembeli / supplier</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Keluhan terisolasi, dapat diselesaikan dalam 1 hari oleh Unit Leader</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Keluhan terisolasi, dapat diselesaikan dalam 2-5 hari oleh Unit Leader</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Keluhan terisolasi, dapat diselesaikan dalam 6-10 hari oleh Unit Leader</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Keluhan nasional, memerlukan penyelesaian oleh Head Office dalam &gt; 10 hari</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Keluhan internasional, memerlukan penyelesaian oleh Head Office dalam &gt; 10 hari</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Pemberitaan negatif di media</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Pemberitaan negatif terisolasi di media sektoral konvensional</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Pemberitaan negatif terisolasi di media nasional konvensional</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Pemberitaan negatif terisolasi di media nasional konvensional dan digital</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Pemberitaan negatif skala nasional di media konvensional dan digital, memerlukan intervensi Head Office</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Pemberitaan negatif skala internasional di media konvensional dan digital, memerlukan intervensi Head Office</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Kehilangan daya saing</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Penurunan market share sampai dengan 5%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Penurunan market share lebih dari 5% sampai dengan 10%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Penurunan market share lebih dari 10% sampai dengan 15%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Penurunan market share lebih dari 15% sampai dengan 20%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Penurunan market share lebih dari 20%</td>
                  </tr>
                  
                  {/* Risiko Sumber Daya Manusia */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Sumber Daya Manusia</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Keluhan karyawan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Dapat diselesaikan oleh Unit Leader, tidak berdampak pada aktivitas perusahaan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Dapat diselesaikan oleh Unit Leader, berdampak minimal pada aktivitas perusahaan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Memerlukan penyelesaian oleh Head Office, berdampak pada aktivitas perusahaan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Memerlukan penyelesaian oleh Head Office, berdampak signifikan pada aktivitas perusahaan atau kesejahteraan karyawan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Memerlukan penyelesaian oleh Head Office, berdampak sangat signifikan pada aktivitas perusahaan atau kesejahteraan karyawan (misalkan demonstrasi terkoordinasi atau kematian karyawan)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Turn over karyawan bertalenta (regretted turnover)</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Kurang dari 1% per tahun</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">1% - 5% per tahun</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">5% - 10% per tahun</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">10% - 15% per tahun</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">&gt; 15% per tahun</td>
                  </tr>
                  
                  {/* Risiko Sistem Infrastruktur Teknologi dan Keamanan Siber */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Sistem Infrastruktur Teknologi dan Keamanan Siber</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Gangguan aplikasi infrastruktur pendukung</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Aplikasi kurang penting tidak berfungsi selama 1 hari</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Aplikasi kurang penting tidak berfungsi selama 2-3 hari atau aplikasi penting tidak berfungsi selama 1 hari</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Aplikasi kurang penting tidak berfungsi selama 4-5 hari atau aplikasi penting tidak berfungsi selama 2-3 hari</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Aplikasi penting tidak berfungsi selama 4-5 hari atau aplikasi vital tidak berfungsi selama 1 hari</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Aplikasi vital tidak berfungsi selama lebih dari 6 jam</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Serangan siber</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Rata-rata serangan siber di bawah 50 kali per minggu</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Rata-rata serangan siber 50-150 kali per minggu</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Rata-rata serangan siber 150-300 kali per minggu</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Rata-rata serangan siber 300-500 kali per minggu</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Rata-rata serangan siber lebih dari 500 kali per minggu</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Penurunan hasil penilaian platform security</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">X &gt; 90%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">80% &lt; X ≤ 90%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">70% &lt; X ≤ 80%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">60% &lt; X ≤ 70%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">X ≤ 60%</td>
                  </tr>
                  
                  {/* Risiko Operasional */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Operasional</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Pelampauan pemenuhan SLA (Service Level Agreement)</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Deviasi dari standar SLA &lt; 1% (downtime, service tidak tersedia, atau biaya tambahan)</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Deviasi dari standar SLA 1% - 5%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Deviasi dari standar SLA 5% - 10%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Deviasi dari standar SLA 10% - 20%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Deviasi dari standar SLA &gt; 20%</td>
                  </tr>
                  
                  {/* Risiko HSSE dan Sosial */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Health, Safety, Security and Environmental (HSSE) dan Sosial</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Fatality</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">P3K, tidak berdampak pada kinerja kerja</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">P3K, berdampak minimal pada kinerja kerja</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Luka ringan, berdampak pada kinerja kerja</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Luka berat atau 1 fatality</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Multiple fatality, termasuk wabah dan bahaya kimia berat</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Kerusakan Lingkungan</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Kerusakan lingkungan minimal, terisolasi, dapat diperbaiki dalam &lt; 1 tahun</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Kerusakan lingkungan lokal, dapat diperbaiki dalam 1-3 tahun</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Kerusakan lingkungan regional, dapat diperbaiki dalam 3-5 tahun</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Kerusakan lingkungan nasional, dapat diperbaiki dalam &gt; 5 tahun</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Kerusakan lingkungan nasional, berdampak pada fungsi ekosistem dalam jangka panjang (&gt; 5 tahun)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Penurunan ESG rating Sustainalytic</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">X &gt; 90% atau memperoleh rating '0-10 (negligible)'</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">80% &lt; X ≤ 90% atau memperoleh rating '10-20 (low)'</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">70% &lt; X ≤ 80% atau memperoleh rating '20-30 (moderate)'</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">60% &lt; X ≤ 70% atau memperoleh rating '30-40 (significant)'</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">X ≤ 60% atau memperoleh rating '40+ (severe)'</td>
                  </tr>
                  
                  {/* Risiko Penyertaan Modal Negara (PMN) */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Penyertaan Modal Negara (PMN)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Penundaan pencairan PMN</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Diterima tepat waktu</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Terlambat 1 bulan dari target RKAP</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Terlambat 2 bulan dari target RKAP</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Terlambat 3-4 bulan dari target RKAP</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Terlambat &gt; 4 bulan dari target RKAP</td>
                  </tr>
                  
                  {/* Risiko Operasional Khusus Industri Perbankan */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Operasional Khusus Industri Perbankan</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Total jumlah fraud internal dan eksternal</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">X &lt; 800</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">800 ≤ X &lt; 1,000</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">1,000 ≤ X &lt; 1,200</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">1,200 ≤ X ≤ 1,400</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">X &gt; 1,400</td>
                  </tr>
                  
                  {/* Risiko Investasi Khusus Industri Asuransi */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Investasi Khusus Industri Asuransi</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Penurunan aset investasi berdasarkan rating surat utang atau Peringkat bank penerbit deposito</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Investment grade 100% atau Peringkat AAA</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Investment grade ≥ 90% atau Peringkat AA</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Investment grade ≥ 80% atau Peringkat A</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Investment grade ≥ 70% atau Peringkat BBB</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">Investment grade &lt; 70% atau Peringkat di bawah BBB / tidak diperingkat</td>
                  </tr>
                  
                  {/* Risiko Aktuarial */}
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold">Risiko Aktuarial</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Rasio Klaim</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">≤ 75%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">75% &lt; X ≤ 85%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">85% &lt; X ≤ 95%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">95% &lt; X ≤ 100%</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">X &gt; 100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'probability-criteria',
    title: 'Kriteria Probabilitas',
    icon: 'bi-percent',
    content: (
      <div className="space-y-4">
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            Kriteria Probabilitas digunakan untuk mengukur kemungkinan terjadinya risiko berdasarkan tiga parameter: kemungkinan terjadi, frekuensi kejadian, dan persentase.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold w-48">Parameter</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-semibold min-w-48">1<br/>Sangat Jarang Terjadi</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-semibold min-w-48">2<br/>Jarang Terjadi</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-semibold min-w-48">3<br/>Bisa Terjadi</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-semibold min-w-48">4<br/>Sangat Mungkin Terjadi</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-semibold min-w-48">5<br/>Hampir Pasti Terjadi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-semibold bg-gray-50 dark:bg-gray-700/50">Kemungkinan terjadi</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Risiko mungkin terjadi sangat jarang, paling banyak satu kali dalam setahun</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Risiko mungkin terjadi hanya sekali dalam 6 bulan</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Risiko pernah terjadi namun tidak sering, sekali dalam 4 bulan</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Risiko pernah terjadi sekali dalam 2 bulan</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Risiko pernah terjadi sekali dalam 1 bulan</td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-semibold bg-gray-50 dark:bg-gray-700/50">Frekuensi kejadian</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">&lt; 1 permil dari frekuensi kejadian / jumlah transaksi</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Dari 1 permil s/d 1% dari frekuensi kejadian / jumlah transaksi</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Diatas 1% s/d 5% dari frekuensi kejadian / jumlah transaksi</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Diatas 5 s/d 10% dari frekuensi kejadian / jumlah transaksi</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">&gt; 10% dari frekuensi kejadian / jumlah transaksi</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-semibold bg-gray-50 dark:bg-gray-700/50">Persentase</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Probabilitas kejadian Risiko di bawah 20%</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Probabilitas kejadian Risiko dari 20% sampai dengan 40%</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Probabilitas kejadian Risiko antara 40% sampai dengan 60%</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Probabilitas kejadian Risiko antara 60% sampai dengan 80%</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-3">Probabilitas kejadian Risiko antara 80% sampai dengan 100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'quantitative-impact',
    title: 'Kriteria Dampak Kuantitatif',
    icon: 'bi-table',
    content: (
      <div className="space-y-4">
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            Kriteria Dampak Kuantitatif digunakan untuk mengukur dampak finansial risiko berdasarkan persentase dari Batasan Risiko (Risk Limit).
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">Skala</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">Kriteria Dampak</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-semibold">Range Dampak Finansial</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">Deskripsi Dampak</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-medium">1</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Sangat Rendah</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center">X ≤ 20% dari Batasan Risiko</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                    Dampak sangat rendah yang dapat mengakibatkan kerusakan/ kerugian/ penurunan kurang dari 20% dari nilai Batasan Risiko
                  </td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-medium">2</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Rendah</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center">20% &lt; X ≤ 40% dari Batasan Risiko</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                    Dampak rendah yang dapat mengakibatkan kerusakan/kerugian/penurunan 20%-40% dari nilai Batasan Risiko
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-medium">3</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Moderat</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center">40% &lt; X ≤ 60% dari Batasan Risiko</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                    Dampak kritis yang dapat mengakibatkan kerusakan/kerugian/penurunan 40%-60% dari nilai Batasan Risiko
                  </td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-medium">4</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Tinggi</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center">60% &lt; X ≤ 80% dari Batasan Risiko</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                    Dampak disruptif yang dapat mengakibatkan kerusakan/ kerugian/ penurunan 60%-80% dari nilai Batasan Risiko
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center font-medium">5</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Sangat Tinggi</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center">X &gt; 80% dari Batasan Risiko</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                    Dampak katastrofe yang dapat mengakibatkan kerusakan/ kerugian/ penurunan &gt; 80% dari nilai Batasan Risiko
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Keterangan:</strong> Nilai Batasan Risiko merupakan nilai Risk Limit di level enterprise sebagaimana yang telah ditetapkan dalam Strategi Risiko BUMN.
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function Guide() {
  const [activeSection, setActiveSection] = useState(GUIDE_SECTIONS[0].id);

  const activeContent = GUIDE_SECTIONS.find((section) => section.id === activeSection);

  return (
    <>
      <ContentHeader
        title="Panduan Penggunaan"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Panduan' },
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {/* Left: Tab Navigation (Vertical) */}
        <div className="w-full lg:w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <nav className="p-2 space-y-1">
            {GUIDE_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-2.5 rounded-md transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border-l-4 border-blue-600 dark:border-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i className={`bi ${section.icon} text-base`} />
                  <span className="text-sm">{section.title}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-800">
          <div className="p-6">
            {/* Content Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className={`p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400`}>
                <i className={`bi ${activeContent?.icon || 'bi-info-circle'} text-xl`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {activeContent?.title || 'Panduan'}
                </h2>
              </div>
            </div>

            {/* Content Body */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {activeContent?.content}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
