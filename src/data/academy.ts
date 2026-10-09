import type { Material } from '../types/academy'

export const MATERIALS: Material[] = [
  {
    id: 'forex', title: 'Apa itu Forex', level: 'BEGINNER',
    description: 'Pengenalan pasar valuta asing dan cara kerjanya.',
    content: [
      'Forex (foreign exchange) adalah pasar tempat mata uang satu negara ditukar dengan mata uang negara lain, misalnya USD terhadap JPY.',
      'Pasar ini buka 24 jam pada hari kerja karena bergantian antar sesi Sydney, Tokyo, London, dan New York.',
      'XAUUSD (emas terhadap dolar AS) sering diperdagangkan di platform yang sama meski emas adalah komoditas, bukan mata uang.'
    ],
    illustration: 'none',
    quiz: [{ question: 'Kenapa pasar forex buka 24 jam pada hari kerja?', options: ['Karena diatur satu negara saja', 'Karena sesi trading dunia bergantian', 'Karena tidak ada regulasi'], correct: 1 }]
  },
  {
    id: 'xauusd', title: 'Mengenal XAUUSD', level: 'BEGINNER',
    description: 'Karakteristik gold sebagai instrumen trading.',
    content: [
      'XAUUSD menunjukkan harga 1 troy ounce emas dalam dolar AS.',
      'Harga emas dipengaruhi suku bunga, inflasi, dan sentimen risk-on/risk-off di pasar global.',
      'Volatilitas XAUUSD cenderung lebih tinggi dibanding pasangan mata uang utama, sehingga manajemen risiko penting.'
    ],
    illustration: 'trend',
    quiz: [{ question: 'Apa yang ditunjukkan harga XAUUSD?', options: ['Harga 1 troy ounce emas dalam USD', 'Suku bunga bank sentral', 'Harga minyak dunia'], correct: 0 }]
  },
  {
    id: 'pip', title: 'Pip dan Point', level: 'BEGINNER',
    description: 'Satuan pergerakan harga yang dipakai trader.',
    content: [
      'Pip adalah satuan pergerakan harga terkecil yang umum digunakan pada pasangan mata uang, biasanya digit ke-4 di belakang koma.',
      'Point biasanya merujuk pada digit terakhir yang ditampilkan broker, yang bisa lebih kecil dari 1 pip tergantung jumlah digit.',
      'Untuk XAUUSD, satu poin umumnya sama dengan pergerakan $0.01, tetapi definisi bisa berbeda antar broker.'
    ],
    illustration: 'lot',
    quiz: [{ question: 'Apa perbedaan utama pip dan point?', options: ['Tidak ada bedanya', 'Point adalah digit terakhir yang ditampilkan broker, bisa lebih kecil dari 1 pip', 'Pip hanya berlaku untuk emas'], correct: 1 }]
  },
  {
    id: 'lot', title: 'Lot, Spread, Margin, Leverage', level: 'BEGINNER',
    description: 'Istilah dasar ukuran posisi dan biaya trading.',
    content: [
      'Lot adalah ukuran volume transaksi. Untuk XAUUSD, 1 lot standar umumnya setara 100 troy ounce.',
      'Spread adalah selisih antara harga bid dan ask, menjadi salah satu biaya transaksi.',
      'Margin adalah dana yang ditahan broker sebagai jaminan posisi terbuka. Leverage adalah rasio yang memperbesar daya beli modal, tetapi juga memperbesar risiko kerugian secara proporsional.'
    ],
    illustration: 'lot',
    quiz: [{ question: 'Apa fungsi leverage?', options: ['Menghilangkan risiko', 'Memperbesar daya beli modal sekaligus memperbesar risiko', 'Mengganti margin'], correct: 1 }]
  },
  {
    id: 'risk-management', title: 'Risk Management', level: 'BEGINNER',
    description: 'Dasar mengelola risiko sebelum belajar teknikal lanjut.',
    content: [
      'Risk management adalah cara membatasi kerugian per transaksi, biasanya dinyatakan dalam persentase dari balance, misalnya 1% per trade.',
      'Stop Loss (SL) membatasi kerugian maksimal pada satu posisi, sementara Take Profit (TP) menentukan target keluar.',
      'Konsistensi mengikuti rencana risiko lebih menentukan hasil jangka panjang dibanding mencari sinyal "pasti profit".'
    ],
    illustration: 'none',
    quiz: [{ question: 'Apa tujuan utama risk management?', options: ['Menjamin profit', 'Membatasi kerugian per transaksi secara konsisten', 'Menghindari Stop Loss'], correct: 1 }]
  },
  {
    id: 'sr', title: 'Support & Resistance', level: 'TECHNICAL',
    description: 'Area harga yang berulang kali menahan pergerakan.',
    content: [
      'Support adalah area harga yang cenderung menahan penurunan karena minat beli meningkat di sana.',
      'Resistance adalah area harga yang cenderung menahan kenaikan karena minat jual meningkat.',
      'Area ini bersifat zona, bukan garis presisi, dan kekuatannya berubah setelah ditembus berkali-kali.'
    ],
    illustration: 'structure',
    quiz: [{ question: 'Support biasanya digambarkan sebagai apa?', options: ['Garis presisi tunggal', 'Zona harga tempat minat beli meningkat', 'Indikator momentum'], correct: 1 }]
  },
  {
    id: 'supply-demand', title: 'Supply & Demand', level: 'TECHNICAL',
    description: 'Zona ketidakseimbangan order yang menggerakkan harga.',
    content: [
      'Zona demand adalah area di mana permintaan beli lebih besar dari penawaran, mendorong harga naik meninggalkan area tersebut.',
      'Zona supply adalah area di mana penawaran jual lebih besar dari permintaan, mendorong harga turun.',
      'Trader sering menandai zona ini dari titik awal pergerakan kuat, lalu menunggu harga kembali sebagai area of interest.'
    ],
    illustration: 'supply-demand',
    quiz: [{ question: 'Zona demand ditandai dari mana?', options: ['Titik tertinggi sepanjang masa', 'Titik awal pergerakan kuat naik', 'Rata-rata harga 200 hari'], correct: 1 }]
  },
  {
    id: 'trend', title: 'Trend', level: 'TECHNICAL',
    description: 'Arah pergerakan harga secara umum.',
    content: [
      'Trend naik ditandai dengan puncak dan lembah yang semakin tinggi (Higher High, Higher Low).',
      'Trend turun ditandai dengan puncak dan lembah yang semakin rendah (Lower High, Lower Low).',
      'Trend sideways terjadi ketika harga bergerak dalam rentang tanpa arah yang jelas.'
    ],
    illustration: 'trend',
    quiz: [{ question: 'Apa ciri trend naik?', options: ['Higher High dan Higher Low', 'Lower High dan Lower Low', 'Harga selalu datar'], correct: 0 }]
  },
  {
    id: 'market-structure', title: 'Market Structure', level: 'TECHNICAL',
    description: 'Kerangka membaca pola pergerakan harga.',
    content: [
      'Market structure adalah cara membaca rangkaian titik tertinggi dan terendah untuk menentukan arah dan potensi perubahan tren.',
      'Perubahan struktur biasanya diawali dengan Break of Structure (BOS) atau Change of Character (CHOCH).',
      'Memahami struktur membantu menentukan area of interest, bukan menjamin arah harga berikutnya.'
    ],
    illustration: 'structure',
    quiz: [{ question: 'Apa fungsi memahami market structure?', options: ['Menjamin arah harga', 'Membantu menentukan area of interest', 'Mengganti Stop Loss'], correct: 1 }]
  },
  {
    id: 'smc', title: 'Smart Money Concept (SMC)', level: 'TECHNICAL',
    description: 'Kerangka analisis berbasis jejak order besar.',
    content: [
      'SMC adalah kumpulan konsep (order block, liquidity, FVG, BOS, CHOCH) yang mencoba membaca jejak aktivitas pelaku pasar besar.',
      'Konsep ini bersifat interpretatif dan tetap membutuhkan konfirmasi serta manajemen risiko, bukan sinyal pasti.',
      'SMC sering dipakai bersama market structure untuk menyusun trading plan.'
    ],
    illustration: 'structure',
    quiz: [{ question: 'Apakah SMC menjamin arah harga?', options: ['Ya, selalu akurat', 'Tidak, tetap butuh konfirmasi dan manajemen risiko', 'Hanya berlaku untuk saham'], correct: 1 }]
  },
  {
    id: 'bos', title: 'Break of Structure (BOS)', level: 'TECHNICAL',
    description: 'Sinyal kelanjutan tren saat struktur ditembus.',
    content: [
      'BOS terjadi ketika harga menembus titik tertinggi/terendah sebelumnya searah tren yang sedang berlangsung.',
      'BOS umumnya dibaca sebagai konfirmasi kelanjutan tren, bukan pembalikan.',
      'Trader biasanya menunggu BOS sebelum mencari area entry di sisi yang searah tren.'
    ],
    illustration: 'structure',
    quiz: [{ question: 'BOS umumnya menandakan apa?', options: ['Pembalikan tren', 'Kelanjutan tren', 'Tidak ada arti teknikal'], correct: 1 }]
  },
  {
    id: 'choch', title: 'Change of Character (CHOCH)', level: 'TECHNICAL',
    description: 'Sinyal potensi perubahan arah tren.',
    content: [
      'CHOCH terjadi ketika struktur yang sebelumnya membentuk higher high/higher low (atau sebaliknya) mulai berubah pola.',
      'CHOCH sering dibaca sebagai peringatan awal potensi pembalikan tren, meski belum tentu terkonfirmasi penuh.',
      'Konfirmasi tambahan biasanya tetap diperlukan sebelum mengambil keputusan trading.'
    ],
    illustration: 'structure',
    quiz: [{ question: 'CHOCH sering dibaca sebagai apa?', options: ['Konfirmasi tren berlanjut', 'Peringatan awal potensi pembalikan', 'Sinyal profit pasti'], correct: 1 }]
  },
  {
    id: 'liquidity', title: 'Liquidity', level: 'TECHNICAL',
    description: 'Area terkumpulnya order yang berpotensi memicu pergerakan.',
    content: [
      'Liquidity merujuk pada area harga di mana banyak order (misalnya stop loss trader lain) diperkirakan terkumpul, umumnya di sekitar swing high/low yang jelas.',
      'Harga kadang bergerak ke area ini sebelum berbalik arah, sering disebut liquidity sweep.',
      'Konsep ini interpretatif dan tetap perlu dikombinasikan dengan konfirmasi lain.'
    ],
    illustration: 'liquidity',
    quiz: [{ question: 'Liquidity sering dikaitkan dengan area apa?', options: ['Rata-rata harga 50 hari', 'Sekitar swing high/low yang jelas', 'Jam buka bursa saham'], correct: 1 }]
  },
  {
    id: 'order-block', title: 'Order Block', level: 'TECHNICAL',
    description: 'Area candle terakhir sebelum pergerakan kuat.',
    content: [
      'Order block umumnya diidentifikasi sebagai candle berlawanan arah terakhir sebelum pergerakan impulsif yang kuat.',
      'Area ini sering dianggap sebagai jejak akumulasi order sebelum harga bergerak signifikan.',
      'Trader menandainya sebagai area of interest untuk entry ketika harga kembali ke area tersebut.'
    ],
    illustration: 'orderblock',
    quiz: [{ question: 'Order block biasanya diidentifikasi dari mana?', options: ['Candle terakhir berlawanan arah sebelum pergerakan kuat', 'Rata-rata 200 candle', 'Waktu pembukaan sesi Tokyo'], correct: 0 }]
  },
  {
    id: 'fvg', title: 'Fair Value Gap (FVG)', level: 'TECHNICAL',
    description: 'Celah harga akibat pergerakan cepat.',
    content: [
      'FVG adalah celah pada tiga candle berurutan di mana candle tengah bergerak sangat kuat sehingga meninggalkan area harga yang tidak "diisi" sepenuhnya.',
      'Area ini kadang menjadi target harga untuk kembali mengisi celah sebelum melanjutkan arah semula.',
      'Seperti konsep SMC lainnya, FVG bersifat interpretatif dan bukan sinyal pasti.'
    ],
    illustration: 'fvg',
    quiz: [{ question: 'FVG muncul akibat apa?', options: ['Pergerakan harga sangat kuat yang meninggalkan celah', 'Libur bursa', 'Perubahan leverage'], correct: 0 }]
  }
]

export const materialsByLevel = (level: 'BEGINNER' | 'TECHNICAL') => MATERIALS.filter((m) => m.level === level)
