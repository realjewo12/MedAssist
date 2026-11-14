// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss'],
  tailwindcss: { cssPath: '~/assets/css/main.css' },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
