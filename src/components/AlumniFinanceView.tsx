import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  X, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  HeartHandshake,
  ArrowRight
} from 'lucide-react';

export interface BillRecord {
  id: string;
  name: string;
  amount: number;
  category: string;
  isPaid: boolean;
  dueDate?: string;
  paidAt?: string;
}

const INITIAL_BILLS: BillRecord[] = [
  {
    id: 'bill-1',
    name: 'Syahriyah Terakhir',
    amount: 150000,
    category: 'Pondok',
    isPaid: false,
    dueDate: '10 Okt 2026',
  },
  {
    id: 'bill-2',
    name: 'Iuran Reuni Akbar Ke-42',
    amount: 100000,
    category: 'Alumni',
    isPaid: false,
    dueDate: '12 Okt 2026',
  },
  {
    id: 'bill-3',
    name: 'Wakaf Asrama Santri Baru',
    amount: 250000,
    category: 'Wakaf',
    isPaid: true,
    paidAt: '28 Sep 2026',
  },
];

const PRESET_INFAQ = [25000, 50000, 100000, 200000];

export const AlumniFinanceView: React.FC<{
  onToast: (msg: string) => void;
}> = ({ onToast }) => {
  const [bills, setBills] = useState<BillRecord[]>(INITIAL_BILLS);
  const [customInfaq, setCustomInfaq] = useState<string>('');
  const [selectedInfaq, setSelectedInfaq] = useState<number | null>(50000);

  // Active payment state for paying a bill or giving infaq
  const [payingItem, setPayingItem] = useState<{
    type: 'bill' | 'infaq';
    title: string;
    amount: number;
    billId?: string;
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'transfer'>('qris');
  const [copiedRekening, setCopiedRekening] = useState(false);

  const unpaidBills = bills.filter((b) => !b.isPaid);
  const paidBills = bills.filter((b) => b.isPaid);
  const totalUnpaid = unpaidBills.reduce((acc, b) => acc + b.amount, 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopyRekening = () => {
    navigator.clipboard.writeText('7123456789');
    setCopiedRekening(true);
    onToast('Nomor rekening disalin');
    setTimeout(() => setCopiedRekening(false), 2000);
  };

  const handleOpenPayBill = (bill: BillRecord) => {
    setPayingItem({
      type: 'bill',
      title: bill.name,
      amount: bill.amount,
      billId: bill.id,
    });
  };

  const handleOpenInfaq = () => {
    const amount = customInfaq ? parseInt(customInfaq.replace(/[^0-9]/g, ''), 10) : selectedInfaq;
    if (!amount || amount < 10000) {
      onToast('Nominal infaq minimal Rp 10.000');
      return;
    }
    setPayingItem({
      type: 'infaq',
      title: 'Infaq Pesantren',
      amount,
    });
  };

  const handleConfirmPayment = () => {
    if (!payingItem) return;

    if (payingItem.type === 'bill' && payingItem.billId) {
      const bId = payingItem.billId;
      setBills((prev) =>
        prev.map((b) =>
          b.id === bId ? { ...b, isPaid: true, paidAt: 'Hari ini' } : b
        )
      );
      onToast(`Pembayaran ${payingItem.title} berhasil`);
    } else {
      onToast(`Infaq ${formatRupiah(payingItem.amount)} berhasil disalurkan`);
    }

    setPayingItem(null);
    setCustomInfaq('');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 max-w-lg mx-auto w-full space-y-5 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-display text-slate-900 leading-tight">
          Keuangan
        </h1>
      </div>

      {/* Ringkasan Tanggungan Belum Lunas */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">
            Tanggungan Belum Lunas
          </span>
          <p className="text-2xl font-bold font-display text-slate-900 mt-0.5">
            {formatRupiah(totalUnpaid)}
          </p>
        </div>

        {totalUnpaid === 0 ? (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Lunas
          </span>
        ) : (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            {unpaidBills.length} Tagihan
          </span>
        )}
      </div>

      {/* DAFTAR TANGGUNGAN PEMBAYARAN */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Tanggungan Pembayaran
        </h2>

        {unpaidBills.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-center py-6 text-slate-500 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            Tidak ada tanggungan pembayaran yang belum lunas.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            {unpaidBills.map((bill) => (
              <div key={bill.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                    {bill.name}
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {formatRupiah(bill.amount)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPayBill(bill)}
                  className="py-1.5 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs active:scale-95"
                >
                  Bayar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Riwayat yang sudah lunas (jika ada) */}
        {paidBills.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Sudah Lunas
            </span>
            <div className="divide-y divide-slate-100 bg-slate-50/80 rounded-2xl border border-slate-200/60 overflow-hidden">
              {paidBills.map((bill) => (
                <div key={bill.id} className="p-3 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 truncate mr-2">{bill.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-slate-500">{formatRupiah(bill.amount)}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Lunas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SEKSI INFAQ / SEDEKAH */}
      <div className="space-y-2.5 pt-1">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
          <span>Infaq & Sedekah</span>
        </h2>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          {/* Preset Nominal */}
          <div className="grid grid-cols-4 gap-2">
            {PRESET_INFAQ.map((nominal) => {
              const isSelected = selectedInfaq === nominal && !customInfaq;
              return (
                <button
                  key={nominal}
                  type="button"
                  onClick={() => {
                    setSelectedInfaq(nominal);
                    setCustomInfaq('');
                  }}
                  className={`py-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  {(nominal / 1000)}rb
                </button>
              );
            })}
          </div>

          {/* Input Nominal Bebas */}
          <input
            type="number"
            placeholder="Nominal lainnya (Rp)"
            value={customInfaq}
            onChange={(e) => {
              setCustomInfaq(e.target.value);
              setSelectedInfaq(null);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <button
            type="button"
            onClick={handleOpenInfaq}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <span>Salurkan Infaq</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MODAL PEMBAYARAN LANGSUNG (BAYAR TANGGUNGAN / INFAQ) */}
      {payingItem && (
        <div 
          className="fixed inset-0 z-[100005] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPayingItem(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  {payingItem.title}
                </h3>
                <p className="text-base font-bold font-display text-sky-600 mt-0.5">
                  {formatRupiah(payingItem.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pilihan Metode: QRIS vs Transfer */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'qris'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QRIS</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'transfer'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Transfer</span>
              </button>
            </div>

            {/* Konten Metode */}
            {paymentMethod === 'qris' ? (
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-inner inline-block">
                  <div className="w-36 h-36 bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center relative">
                    <QrCode className="w-28 h-28 text-slate-900" />
                    <span className="text-[9px] font-bold text-slate-600 font-mono mt-0.5">QRIS STANDAR</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">Pindai dengan aplikasi m-banking atau e-wallet</span>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Bank Syariah Indonesia (BSI)</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-mono font-bold text-slate-900 text-sm">7123456789</span>
                  <button
                    type="button"
                    onClick={handleCopyRekening}
                    className="flex items-center gap-1 text-sky-600 font-semibold text-xs hover:text-sky-700 cursor-pointer"
                  >
                    {copiedRekening ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRekening ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 block">a.n. Pondok Pesantren Attaroqqy</span>
              </div>
            )}

            {/* Tombol Konfirmasi Selesai */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
              >
                Saya Sudah Bayar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
