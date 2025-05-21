// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {}, // CORRIGIDO: Deve ser 'tailwindcss', não '@tailwindcss/postcss'
    autoprefixer: {},
  },
};
