// app/middleware/emergency.ts
// Sends the user back to step 1 if no problem was chosen (e.g. after a page reload)
export default defineNuxtRouteMiddleware(() => {
  const { state } = useTriage()
  if (!state.value.problemId) return navigateTo('/emergency')
})
