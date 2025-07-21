// promptManager.js

const behaviorPrompt =
  `Perankan dirimu sebagai mentor AI pada platform belajar berbasis diskusi dan proyek. ` +
  `Fokus pada pemikiran reflektif dan pemahaman mendalam. ` +
  `Jangan langsung menjelaskan konsep atau memberi jawaban. ` +
  `Gunakan pendekatan Socratic, bantu user berpikir lewat pertanyaan dilematis dan klarifikasi.`;

/**
 * Menghasilkan instruksi otomatis berdasarkan mode
 * @param {string} mode
 * @param {string} topic
 * @param {string[]} chatHistory
 * @param {string} problem
 * @returns {string}
 */
function getAutoPrompt(mode, topic, chatHistory = [], problem = '') {
  switch (mode) {
    case 'JELASKAN_KONSEP':
      return `User memerlukan penjelasan konsep. Berikan penjelasan dari nama notasi (bentuk) contoh penggunaan, relevan dengan topik "${topic}", dan tandai dengan <MATERI_JENIS=...>. Penjelasan harus mendalam tapi menarik.`;

    case 'MINTA_SOLUSI':
      return `Minta user untuk menyusun solusi akhir berdasarkan diskusi dan pemahaman yang sudah terjadi. Jangan bantu dulu, biarkan user mencoba mandiri.`;

    case 'MASUK_REALISASI':
      return `User telah memberikan solusi akhir yang relevan. Lihat solusi user:\n${chatHistory.join('\n')}\nyang berdampak untuk masalah "${problem}". Buat versi kode atau realisasi dari solusi user dalam bentuk kode yang bisa dijalankan namun sisakan bagian kosong yang harus dilengkapi user di bagian yang terkait dengan topik "${topic}". Tambahkan tag <REALISASI_MULAI> dan <EXP_TAMBAH=...> jika berhasil.`;

    default:
      return '';
  }
}

/**
 * Membangun prompt lengkap untuk dikirim ke OpenAI
 * @param {string} userMessage
 * @param {object} context
 * @param {string} context.mode
 * @param {string} context.topic
 * @param {string[]} context.chatHistory
 * @param {string} context.problem
 * @returns {string}
 */
function buildPrompt(userMessage, context = {}) {
  const {
    mode = 'DEFAULT',
    topic = '',
    chatHistory = [],
    problem = ''
  } = context;

  const autoPrompt = getAutoPrompt(mode, topic, chatHistory, problem);

  return `
${behaviorPrompt}

${autoPrompt ? '\nInstruksi tambahan:\n' + autoPrompt : ''}

Topik diskusi: ${topic || 'Tidak disebutkan'}

User: ${userMessage}
AI:
`.trim();
}

module.exports = { buildPrompt };