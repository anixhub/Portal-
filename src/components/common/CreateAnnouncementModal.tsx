import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  X, 
  Camera, 
  Plus, 
  Pin, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ImageIcon,
  Users
} from 'lucide-react';
import { AnnouncementItem, AudienceTarget } from '../../types';
import logoPonpesImg from '../../assets/images/logo_ponpes_attaroqqy_1790648746461.jpg';
import { AudienceTargetModal, formatAudienceSummary } from './AudienceTargetModal';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newAnnouncement: AnnouncementItem) => void;
  onUpdate?: (id: string, updated: Partial<AnnouncementItem>) => void;
  initialData?: AnnouncementItem | null;
  triggerToast: (msg: string) => void;
  author: {
    name: string;
    username?: string;
    photoUrl?: string;
    role?: string;
    isFemale?: boolean;
  };
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  initialData,
  triggerToast,
  author,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'maklumat' | 'umum' | 'kegiatan'>('maklumat');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [targetAudience, setTargetAudience] = useState<AudienceTarget>({ gender: 'semua', regionScope: 'semua' });
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Sync initialData when opening for edit or create
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      const validCat = (initialData.category === 'beasiswa' ? 'umum' : initialData.category) as 'maklumat' | 'umum' | 'kegiatan';
      setCategory(validCat || 'maklumat');
      setIsImportant(Boolean(initialData.isImportant));
      setTargetAudience(initialData.targetAudience || { gender: 'semua', regionScope: 'semua' });
      setImages(initialData.images || []);
      setCurrentSlide(0);
    } else {
      setTitle('');
      setContent('');
      setCategory('maklumat');
      setIsImportant(false);
      setTargetAudience({ gender: 'semua', regionScope: 'semua' });
      setImages([]);
      setCurrentSlide(0);
    }
  }, [initialData, isOpen]);

  // Sync current slide on scroll
  const handleSliderScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth } = sliderRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / clientWidth);
      setCurrentSlide(index);
    }
  };

  const scrollToSlide = (index: number) => {
    if (!sliderRef.current) return;
    const clampedIndex = Math.max(0, Math.min(images.length - 1, index));
    sliderRef.current.scrollTo({
      left: clampedIndex * sliderRef.current.clientWidth,
      behavior: 'smooth',
    });
    setCurrentSlide(clampedIndex);
  };

  if (!isOpen) return null;

  const handleMultiplePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let loadedCount = 0;
    const newImages: string[] = [];

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          setImages((prev) => {
            const updated = [...prev, ...newImages];
            return updated;
          });
          triggerToast(`${newImages.length} foto berhasil ditambahkan`);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveCurrentPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length === 0) return;
    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== currentSlide);
      const nextSlide = Math.min(currentSlide, Math.max(0, next.length - 1));
      setTimeout(() => scrollToSlide(nextSlide), 50);
      return next;
    });
  };

  const handlePublish = () => {
    if (!title.trim()) {
      triggerToast('Masukkan nama judul pengumuman');
      return;
    }
    if (!content.trim()) {
      triggerToast('Tulis keterangan pengumuman terlebih dahulu');
      return;
    }

    if (initialData && onUpdate) {
      onUpdate(initialData.id, {
        title: title.trim(),
        content: content.trim(),
        category,
        isImportant,
        targetAudience,
        images: images.length > 0 ? images : undefined,
      });
      triggerToast('Pengumuman berhasil diperbarui');
      onClose();
      return;
    }

    const now = new Date();
    const indonesianMonths = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const formattedDate = `${now.getDate()} ${indonesianMonths[now.getMonth()]} ${now.getFullYear()}`;

    const newAnnouncement: AnnouncementItem = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      date: formattedDate,
      category,
      content: content.trim(),
      authorName: author.name,
      authorHandle: author.username ? (author.username.startsWith('@') ? author.username : `@${author.username}`) : '@admin_pusat',
      authorAvatar: author.photoUrl || logoPonpesImg,
      authorRole: author.role || 'Pengurus & Alumni',
      isImportant,
      targetAudience,
      images: images.length > 0 ? images : undefined,
    };

    onSubmit(newAnnouncement);
    triggerToast('Pengumuman berhasil dibagikan');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100060] bg-white flex flex-col w-full h-full overflow-hidden select-none animate-in fade-in duration-200">
      {/* ================= 1. HEADER BUAT/EDIT PENGUMUMAN (TANPA KOTAK PADA IKON KEMBALI & BAGIKAN) ================= */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 z-30">
        <button
          type="button"
          onClick={onClose}
          className="p-1 -ml-1 text-slate-800 hover:text-slate-900 cursor-pointer transition-transform active:scale-90"
          title="Kembali"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h3 className="font-bold text-base text-slate-900">
          {initialData ? 'Edit Pengumuman' : 'Buat Pengumuman'}
        </h3>

        <button
          type="button"
          onClick={handlePublish}
          className="text-sky-600 hover:text-sky-700 font-bold text-sm px-2 py-1 cursor-pointer active:scale-95 transition-all"
        >
          {initialData ? 'Simpan' : 'Bagikan'}
        </button>
      </div>

      {/* ================= 2. FORM BODY (SAMA PERSIS SAAT MEMBUAT AGENDA DENGAN CAROUSEL MULTI-FOTO) ================= */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full pb-16">
          {/* Media Preview: Aspect 4:3 / 16:9 yang bisa geser multi-foto */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-900 overflow-hidden select-none">
            {images.length > 0 ? (
              <>
                {/* Horizontal Scrollable Slider yang Bisa Digeser */}
                <div
                  ref={sliderRef}
                  onScroll={handleSliderScroll}
                  className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                >
                  {images.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      className="min-w-full w-full h-full flex-shrink-0 snap-center relative bg-slate-950 flex items-center justify-center"
                    >
                      <img
                        src={imgSrc}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Dot indicators hanya lingkaran-lingkaran kecil di bawah saja */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                          i === currentSlide
                            ? 'w-2 h-2 bg-white ring-2 ring-white/40'
                            : 'w-1.5 h-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Tombol Hapus Foto Aktif */}
                <button
                  type="button"
                  onClick={handleRemoveCurrentPhoto}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer shadow-md"
                  title="Hapus foto ini"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Placeholder jika belum ada foto */
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-sky-400 bg-slate-900 cursor-pointer transition-colors p-6 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                  <Camera className="w-6 h-6 text-sky-400" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Ketuk untuk memilih foto pengumuman
                </p>
                <p className="text-[11px] text-slate-500">
                  Bisa memilih lebih dari satu foto dan digeser
                </p>
              </div>
            )}

            {/* Tombol Tambah / Ganti Gambar di Pojok Kanan Bawah Foto */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <span>{images.length > 0 ? '+ Tambah Foto' : 'Pilih Foto'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleMultiplePhotoSelect}
              className="hidden"
            />
          </div>

          {/* Field Form Detail: Judul di atas Keterangan, Kategori Satu Baris dengan Modal */}
          <div className="p-4 space-y-3.5">
            {/* 1. Kotak Nama Judul Pengumuman (DI ATAS KOTAK KETERANGAN) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Judul Pengumuman <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tulis nama judul pengumuman..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* 2. Kotak Keterangan / Isi Pengumuman (DI BAWAH KOTAK JUDUL) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Isi Keterangan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan keterangan lengkap pengumuman..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white resize-none leading-relaxed transition-all shadow-2xs"
              />
            </div>

            {/* Clean Divider & Field Rows */}
            <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-1">
              {/* Field 3: Baris Kategori Satu Baris (Klik baris akan muncul modal pilih kategori) */}
              <div 
                onClick={() => setIsCategoryModalOpen(true)}
                className="py-3 flex items-center justify-between cursor-pointer group hover:bg-slate-50 px-2 rounded-xl transition-colors select-none"
              >
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">
                    Kategori
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize border ${
                    category === 'maklumat'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : category === 'kegiatan'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}>
                    {category}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Field 4: Target Pemirsa (Gender & Wilayah) */}
              <div
                onClick={() => setIsAudienceModalOpen(true)}
                className="py-3 px-2 flex items-center justify-between cursor-pointer group hover:bg-slate-50 rounded-xl transition-colors select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Users className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Target Pemirsa
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Atur jangkauan gender & wilayah alumni
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                    {formatAudienceSummary(targetAudience)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Field 5: Toggle Tandai Penting */}
              <div className="py-3 px-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Pin className={`w-4 h-4 shrink-0 ${isImportant ? 'text-rose-600 fill-rose-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Tandai Penting
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Sematkan tanda prioritas pada pengumuman ini
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL PILIH KATEGORI (MUNCUL SAAT KLIK BARIS KATEGORI) ================= */}
      {isCategoryModalOpen && (
        <div 
          className="fixed inset-0 z-[100080] bg-black/60 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in select-none"
          onClick={() => setIsCategoryModalOpen(false)}
        >
          <div 
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">
                  Pilih Kategori Pengumuman
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tentukan jenis informasi yang akan dibagikan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { 
                  id: 'maklumat', 
                  label: 'Maklumat', 
                  desc: 'Pemberitahuan resmi, instruksi penting, atau edaran pondok',
                  badgeBg: 'bg-amber-50 text-amber-800 border-amber-200' 
                },
                { 
                  id: 'umum', 
                  label: 'Umum', 
                  desc: 'Informasi umum, kabar santri, atau warta alumni sehari-hari',
                  badgeBg: 'bg-sky-50 text-sky-800 border-sky-200' 
                },
                { 
                  id: 'kegiatan', 
                  label: 'Kegiatan', 
                  desc: 'Agenda silaturahmi, reuni, pengajian, dan kegiatan pondok',
                  badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                },
              ].map((opt) => {
                const isSelected = category === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setCategory(opt.id as any);
                      setIsCategoryModalOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-sky-50/70 border-sky-400 ring-1 ring-sky-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${opt.badgeBg}`}>
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {opt.desc}
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL PENGATURAN TARGET PEMIRSA (AUDIENS) ================= */}
      {isAudienceModalOpen && (
        <AudienceTargetModal
          isOpen={isAudienceModalOpen}
          onClose={() => setIsAudienceModalOpen(false)}
          initialTarget={targetAudience}
          onSave={(target) => {
            setTargetAudience(target);
            triggerToast('Target pemirsa diperbarui');
          }}
          title="Target Pemirsa Pengumuman"
        />
      )}
    </div>
  );
};
