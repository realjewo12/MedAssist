import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

describe('home page', () => {
  it('greets the crew member', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.get('h1').text()).toBe('Hello, crew member')
  })
})
