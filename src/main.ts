import Vue from 'vue'
import VueStash from 'vue-stash'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

// @ts-ignore
Vue.use(VueStash)

new Vue({
    el: '#app',
    data: {
      store: {
        newStories: [],
        topStories: [],
        bestStories: [],
        showStories: [],
        askStories: [],
        jobStories: [],
        comments: {},
        items: {},
        users: {},
      },
    },
    router,
    render: (h) => h(App),
  }).$mount('#app')
