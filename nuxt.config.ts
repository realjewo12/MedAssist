// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15', // keep the date that was generated
  ssr: false, // single-page app: pages are rendered in the browser (not offline by itself)
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss'],
  tailwindcss: { cssPath: '~/assets/css/main.css' },
  typescript: { strict: true },
  app: {
    head: {
      title: 'MedAssist',
    },
  },
})
