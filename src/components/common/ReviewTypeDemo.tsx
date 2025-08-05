import { ReviewType } from "@/types";

interface ReviewTypeDemoProps {
  reviewType: ReviewType;
}

export const ReviewTypeDemo = ({ reviewType }: ReviewTypeDemoProps) => {
  const getDemoContent = (type: ReviewType) => {
    const demos = {
      sarcastic: {
        title: "🔥 Mode Roasting Sarkastik",    
        description:
          "Gordon Ramsay dalam review kode - blak-blakan namun tetap membantu",
        example: {
          issue:
            "Wah, 'x' adalah nama variabel yang begitu deskriptif. Pastikan kamu masih ingat fungsinya saat debugging pada pukul 3 pagi bulan depan.",
          suggestion:
            "💡 Cobalah gunakan nama variabel yang lebih deskriptif, seperti 'jumlahPengguna' atau 'totalItem'. Masa depanmu akan berterima kasih (begitu pula rekan kerjamu).",
        },
      },
      brutal: {
        title: "💀 Mode Kejujuran Brutal",
        description:
          "Tidak ada toleransi untuk praktik buruk - bersiaplah untuk keseriusan maksimal",
        example: {
          issue:
            "Kode ini merupakan bencana total. Fungsi ini melakukan lebih banyak hal daripada pisau lipat saat perkemahan.",
          suggestion:
            "💡 SEGERA pecah menjadi fungsi-fungsi dengan tanggung jawab tunggal. Ini tidak dapat diterima dalam basis kode profesional.",
        },
      },
      encouraging: {
        title: "🌟 Mode Mentor yang Mendukung",
        description:
          "Teman codingmu yang selalu mendukung dan menemukan sisi positif",
        example: {
          issue:
            "Awal yang bagus! Saya menyukai pendekatan kreatif ini. Pertimbangkan penyesuaian kecil ini agar lebih mudah dipelihara.",
          suggestion:
            "💡 Kamu sudah di jalur yang benar! Menambahkan beberapa penanganan error akan membuatnya siap produksi dan menunjukkan perhatianmu pada detail.",
        },
      },
      codeQuality: {
        title: "🔍 Mode Profesional",
        description:
          "Analisis mendalam dan serius untuk kode produksi",
        example: {
          issue:
            "Penamaan variabel bisa lebih deskriptif untuk meningkatkan keterbacaan dan kemudahan pemeliharaan kode.",
          suggestion:
            "💡 Pertimbangkan untuk menggunakan nama variabel yang deskriptif yang jelas menunjukkan tujuannya dan cakupannya.",
        },
      },
      security: {
        title: "🛡️ Mode Fokus Keamanan",
        description:
          "Fokus utama pada pencarian kerentanan keamanan",
        example: {
          issue:
            "Potensi kerentanan SQL injection terdeteksi pada penanganan input pengguna.",
          suggestion:
            "💡 Terapkan kueri terparameter dan validasi input untuk mencegah serangan SQL injection.",
        },
      },
      bestPractices: {
        title: "⭐ Mode Praktik Terbaik",
        description:
          "Rekomendasi standar industri dan pola desain terbaik",
        example: {
          issue:
            "Struktur kode tidak mengikuti Prinsip Tanggung Jawab Tunggal.",
          suggestion:
            "💡 Pertimbangkan untuk memecah kode menjadi fungsi-fungsi yang lebih kecil dengan tanggung jawab tunggal sesuai prinsip SOLID.",
        },
      },
      indonesian: {
        title: "🔥 Mode Roasting Sarkastik",
        description:
          "Gordon Ramsay dari review kode - blak-blakan namun membantu",
        example: {
          issue:
            "Nama variabel 'x' ini kurang deskriptif dan bisa membingungkan saat debugging di tengah malam.",
          suggestion:
            "💡 Coba gunakan nama variabel yang lebih jelas seperti 'jumlahPengguna' atau 'totalItem' agar lebih mudah dimengerti.",
        },
      },
    };

    return demos[type] || demos.sarcastic;
  };

  const demo = getDemoContent(reviewType);

  return (
    <div className="bg-charcoal rounded-xl p-8 border-4 border-charcoal shadow-[0px_8px_0px_0px_#27292b] transition-all duration-300 hover:shadow-[0px_4px_0px_0px_#27292b] hover:translate-y-1">
      <div className="text-center mb-6">
        <h4 className="text-sky font-bold text-2xl mb-3">{demo.title}</h4>
        <p className="text-sky/80 text-lg font-medium">{demo.description}</p>
      </div>

      <div className="space-y-6">
        <div className="bg-cream/15 rounded-lg p-6 border-2 border-cream/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-coral"></span>
            <div className="text-coral text-sm font-bold uppercase tracking-wide">
              Contoh Masalah
            </div>
          </div>
          <div className="text-sky text-base leading-relaxed font-medium">
            "{demo.example.issue}"
          </div>
        </div>

        <div className="bg-cream/15 rounded-lg p-6 border-2 border-cream/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <div className="text-green-400 text-sm font-bold uppercase tracking-wide">
              Example Suggestion
            </div>
          </div>
          <div className="text-sky text-base leading-relaxed font-medium">
            {demo.example.suggestion}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 bg-sky/10 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-sky animate-pulse"></span>
          <span className="text-sky/70 text-sm font-medium">
            Live Preview Mode
          </span>
        </div>
      </div>
    </div>
  );
};
