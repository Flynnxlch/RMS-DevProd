import { useEffect, useState } from 'react';
import { Card } from '../widgets';
import { apiRequest, API_ENDPOINTS } from '../../config/api';
import NotificationPopup from '../ui/NotificationPopup';

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
  return 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200';
}

export default function UpdatePeraturanTerbaru() {
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'error', title: '', message: '' });
  const [formData, setFormData] = useState({
    title: '',
    category: 'Peraturan Baru',
    type: 'text',
    content: '',
    image: null,
    link: '',
  });

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiRequest(API_ENDPOINTS.regulations.getAll);
      // Transform data from backend format to frontend format
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result, type: 'image' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Validasi Gagal',
        message: 'Judul wajib diisi',
      });
      return;
    }
    if (formData.type === 'text' && !formData.content.trim()) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Validasi Gagal',
        message: 'Konten text wajib diisi',
      });
      return;
    }
    if (formData.type === 'image' && !formData.image) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Validasi Gagal',
        message: 'Gambar wajib diupload',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        contentType: formData.type, // 'text' or 'image'
        content: formData.type === 'text' ? formData.content.trim() : formData.image,
        link: formData.link && formData.link.trim() ? formData.link.trim() : null,
      };

      await apiRequest(API_ENDPOINTS.regulations.create, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Reload updates
      await loadUpdates();

      // Reset form
      setFormData({
        title: '',
        category: 'Peraturan Baru',
        type: 'text',
        content: '',
        image: null,
        link: '',
      });
      setShowAddForm(false);

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Update peraturan berhasil ditambahkan',
      });
    } catch (err) {
      console.error('Error creating regulation update:', err);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.message || 'Gagal menambahkan update peraturan',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus update ini?')) {
      return;
    }

    try {
      await apiRequest(API_ENDPOINTS.regulations.delete(id), {
        method: 'DELETE',
      });

      // Reload updates
      await loadUpdates();

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Update peraturan berhasil dihapus',
      });
    } catch (err) {
      console.error('Error deleting regulation update:', err);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Gagal menghapus update peraturan',
      });
    }
  };

  if (isLoading) {
    return (
      <Card title="Update Peraturan terbaru">
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          Memuat update peraturan...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Update Peraturan terbaru">
        <div className="text-sm text-red-600 dark:text-red-400 text-center py-8">
          Kesalahan: {error}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Update Peraturan terbaru">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full sm:w-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0c9361] rounded-lg hover:bg-[#0a7a4f] transition-colors"
        >
          <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
          <span>{showAddForm ? 'Batal' : 'Tambah Update Baru'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="Peraturan Baru">Peraturan Baru</option>
                <option value="Pedoman">Pedoman</option>
                <option value="Update Kriteria">Update Kriteria</option>
                <option value="Pemberitahuan">Pemberitahuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipe Konten
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, image: null, content: '' })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="text">Text</option>
                <option value="image">Gambar</option>
              </select>
            </div>
          </div>

          {formData.type === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Konten Text <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Gambar <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0c9361] file:text-white hover:file:bg-[#0a7a4f] file:cursor-pointer"
                required={formData.type === 'image'}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPG, PNG atau GIF. Maksimal 5MB.</p>
              {formData.image && (
                <div className="mt-3">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Link (Opsional)
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormData({
                  title: '',
                  category: 'Peraturan Baru',
                  type: 'text',
                  content: '',
                  image: null,
                  link: '',
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0c9361] rounded-lg hover:bg-[#0a7a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {updates.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          Tidak ada update peraturan terbaru.
        </div>
      ) : (
        <div className="space-y-4">
          {updates.slice(0, 3).map((update) => (
            <div
              key={update.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${categoryBadgeClass(update.category)}`}>
                      {update.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(update.publishedAt)}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {update.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(update.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  title="Hapus"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
              {update.link && (
                <div className="mt-3">
                  <a
                    href={update.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <i className="bi bi-link-45deg"></i>
                    <span>Baca selengkapnya</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </Card>
  );
}
