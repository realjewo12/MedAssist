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
      // language for screen readers and the speech (Read aloud) voice
      htmlAttrs: { lang: 'en' },
      meta: [
        {
          name: 'description',
          content:
            'MedAssist: offline emergency guidance and health monitoring for astronauts. Demo, not medical advice. Built with AI assistance (Claude Code).',
        },
        // AI disclosure (Space Apps rules): code and guides generated with Claude Code, reviewed by the team
        {
          name: 'ai-assistance',
          content: 'Code and guides generated with Claude Code (Anthropic), reviewed by the team',
        },
        { name: 'theme-color', content: '#0b1020' }, // phone browser bar matches the dark theme
        { name: 'robots', content: 'noindex, nofollow' }, // demo medical content: keep out of search
      ],
      // the tab icon follows the base path (GitHub Pages serves the app under /MedAssist/)
      link: [{ rel: 'icon', href: `${process.env.NUXT_APP_BASE_URL ?? '/'}favicon.ico` }],
    },
  },
})
