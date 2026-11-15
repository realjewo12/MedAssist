// app/middleware/emergency.ts
// Keeps the steps in order: who needs help (1) → what is the problem (2) → questions → steps.
// Sends the user back to the first missing step (e.g. after a page reload).
export default defineNuxtRouteMiddleware((to) => {
  const { state } = useTriage()
  if (!state.value.target) return navigateTo('/emergency')
  if (to.path !== '/emergency/problem' && !state.value.problemId)
    return navigateTo('/emergency/problem')
})
