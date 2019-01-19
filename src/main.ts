import Vue from 'vue'
import VueStash from 'vue-stash'
import VueScript2 from 'vue-script2'
import Ads from 'vue-google-adsense'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

// @ts-ignore
Vue.use(VueStash)
Vue.use(VueScript2)
Vue.use(Ads.InFeedAdsense)

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
    render: h => h(App),
  }).$mount('#app')
