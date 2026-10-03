import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  X, 
  Camera, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ImageIcon,
  Users,
  Globe
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
      setTargetAudience(initialData.targetAudience || { gender: 'semua', regionScope: 'semua' });
      setImages(initialData.images || []);
      setCurrentSlide(0);
    } else {
      setTitle('');
      setContent('');
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
      content: content.trim(),
      authorName: author.name,
      authorHandle: author.username || `@${author.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      authorAvatar: author.photoUrl || logoPonpesImg,
      authorRole: author.role || 'Pengurus & Alumni',
      targetAudience,
      images: images.length > 0 ? images : undefined,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
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
            <div className="border-t border-b border-slate-100 py-1">
              {/* Field: Jangkauan */}
              <div
                onClick={() => setIsAudienceModalOpen(true)}
                className="py-3 px-2 flex items-center justify-between cursor-pointer group hover:bg-slate-50 rounded-xl transition-colors select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Globe className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Jangkauan
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
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL PENGATUR JANGKAUAN ================= */}
      {isAudienceModalOpen && (
        <AudienceTargetModal
          isOpen={isAudienceModalOpen}
          onClose={() => setIsAudienceModalOpen(false)}
          initialTarget={targetAudience}
          onSave={(target) => {
            setTargetAudience(target);
            triggerToast('Jangkauan pengumuman diperbarui');
          }}
          title="Atur Jangkauan"
        />
      )}
    </div>
  );
};
