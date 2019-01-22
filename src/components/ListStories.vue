<template>
  <div align="center" style="margin-top: -23px">
    <div v-for="(dateStories, day) in storiesByDate()" :key="'d'+dateStories.date">
      <div class="columns" :class="day === 0 ? 'first' : 'next'" v-if="wideLayout || day === 0">
        <div v-if="wideLayout" :style="dateStyle(day)">{{ dateStories.dateString }}</div>
        <div class="right-time">{{ currentTime(day) }}</div>
      </div>
      <div class="story-columns">
        <table style="flex: 1" v-for="(stories, col) in colStories(dateStories.stories, day)" :key="col">
          <div class="columns next" v-if="stories.length && !wideLayout">
            <div :style="dateStyle(1)">{{ dateStories.dateString }}</div>
          </div>
          <tr v-if="stories.length">
            <th colspan="3" class="column-heading" :class="`group${day}`" @click="toggleStorySource()"
              title="Change listing of Top, New, or Ask/Show stories.">
              {{ sortTitle(day, col) }}
            </th>
          </tr>
          <tr v-if="day === 0 && stories.length">
            <td>
              <div class="sort-score" @click="toggleSort(day, col)">
                {{ sortSymbol(col) }}
              </div>
            </td>
            <td colspan="2" style="min-width: 40vw;"></td>
          </tr>
          <tr v-for="(story, row) in stories" :key="(story || {id: row}).id">
            <template v-if="story">
              <td align="right">
                <a :href="itemLink(story)" target="hn" class="score">{{ story.score }}</a>
              </td>
              <td align="center">
                <a :href="itemLink(story)" target="hn" class="comments"><span>{{ story.descendants || '·' }}</span></a>
              </td>
              <td>
                <a :href="titleLink(story)" :title="linkTitle(story)" target="hn" class="title-link">
                  <div class="title-domain"><span class="title">{{ story.deleted && '(deleted)' || titleText(story) }}</span><span class="item-domain">{{ itemDomain(story) }}</span></div>
                </a>
              </td>
            </template>
            <template v-else>
              <!-- <td colspan="3" style="max-height: 70px">
                <ins class="adsbygoogle" style="display:block"
                  data-ad-client="ca-pub-7698401419914104"
                  :data-ad-slot="adSenseTextOnlySlot(day, col)"
                  data-ad-format="auto"
                  data-full-width-responsive="true"></ins>
              </td> -->
            </template>
          </tr>
        </table>
      </div>
      <div v-for="slot in adSenseTextDisplaySlot(day)" :key="slot">
        <ins class="adsbygoogle" style="display:block"
          data-ad-client="ca-pub-7698401419914104"
          :data-ad-slot="slot"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
      </div>
    </div>
    <!-- <div class="full-width">
      <InFeedAdsense
        data-ad-layout-key="-fg+5n+6t-e7+r"
        data-ad-client="ca-pub-7698401419914104"
        data-ad-slot="4384577737">
      </InFeedAdsense>
    </div> -->
    <div v-if="renderedLoadAds()">
      <!-- ads loading -->
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { getCookie, setCookie } from '../util/cookies.js'

declare global {
  interface Window { adsbygoogle: any[] }
}

const noop = () => undefined

@Component({
  props: {
    storyType: String,
  },
})
export default class ListStories extends Vue {
  wideLayout = window.innerWidth >= 768
  time = ''
  loaded = false
  rendered = false
  newestStoryISODate = this.localeISODateString(new Date().getTime() / 1000)
  storySource = getCookie('news.hackerer.storySource', 'topstories')
  loSort = getCookie('news.hackerer.loSort', true)
  hiSort = getCookie('news.hackerer.hiSort', false)
  adSenseTextDisplaySlots = ['4384577737', '4728192669', '9214232583', '9769546608']
  adSenseTextOnlySlots = ['2441064384']
  adSenseDisplayOnlySlots = []

  mounted() {
    const minWidth768 = window.matchMedia('(min-width: 768px)')
    minWidth768.addListener(this.matchMediaWidth)

    this.tick()
    this.loadStoryIds()
  }

  sortTitle(day, col) {
    if (this.storySource === 'askshow') {
      return col === 0 ? 'Ask HN' : 'Show HN'
    } else if (this.storySource === 'newstories') {
      if (day === 0) {
        if (col === 0) {
          return 'Newest'
        } else {
          return this.hiSort ? 'Recent' : 'Recent Popular'
        }
      } else {
        return col === 0 ? 'Newish' : 'Warm'
      }
    } else {
      if (col === 0) {
        return day === 0 && this.loSort ? 'Fresh' : 'Niche'
      } else {
        return 'Popular'
      }
    }
  }
  sortSymbol(col) {
    if (col === 0 && this.storySource === 'newstories') {
      return '⏱'
    } else if (col === 0) {
      return this.loSort ? '⏱' : (this.storySource !== 'askshow' && this.wideLayout ? '△' : '▽')
    } else {
      if (this.storySource === 'topstories') {
        return this.hiSort ? '⏱ ' : '▽  '
      } else {
        return this.hiSort ? '⏱' : '▽'
      }
    }
  }
  toggleStorySource() {
    const oldStorySource = this.storySource
    if (this.storySource === 'topstories') {
      this.storySource = 'newstories'
    } else if (this.storySource === 'newstories') {
      this.storySource = 'askshow'
    } else {
      this.storySource = 'topstories'
    }
    setCookie('news.hackerer.storySource', this.storySource)
    if (this.countStories() === 0) {
      this.loadStoryIds()
    }
  }
  toggleSort(day, col) {
    if (day) {
      return
    }
    if (col === 0) {
      this.loSort = !this.loSort
      setCookie('news.hackerer.loSort', this.loSort)
    } else {
      this.hiSort = !this.hiSort
      setCookie('news.hackerer.hiSort', this.hiSort)
    }
  }
  titleText(story) {
    return story.type === 'story' ? story.title : `${story.type}: ${story.title}`
  }
  linkTitle(story) {
    return (story.url || '').replace(/^https?:\/\//, '').replace('www.', '')
      .replace(/#[^#]*$/, '').replace(/\.html?/, '').replace(/\/$/, '')
  }
  itemDomain(story) {
    return (story.url || '').replace(/^https?:\/\/(?:www\.)?([^/]*).*/, '$1').replace('.com', '')
  }
  itemLink(story) {
    return `https://news.ycombinator.com/item?id=${story.id}`
  }
  titleLink(story) {
    return story.url || `https://news.ycombinator.com/item?id=${story.id}`
  }

  colStories(stories, day) {
    if (stories.length === 0) {
      return []
    }
    const newestUnixTime = Math.max.apply(null, stories.map(s => s.time))
    const newestStoryISODate = this.localeISODateString(newestUnixTime)
    const scored = stories.sort((a, b) => a.score === b.score ? b.time - a.time : a.score - b.score)
    let lo: any[]
    let hi: any[]
    if (this.storySource === 'askshow') {
      lo = scored.filter(s => !s.url && !s.title.startsWith('Show HN'))
      hi = scored.filter(s => s.url || s.title.startsWith('Show HN'))
    } else {
      const m = Math.ceil(scored.length / 2)
      lo = scored.slice(0, m)
      hi = scored.slice(m)
    }

    if (day === 0) {
      if (this.loSort || this.storySource === 'newstories') {
        lo.sort((a, b) => b.time - a.time)
      } else if (this.storySource === 'askshow' || !this.wideLayout) {
        lo.reverse()
      }
      if (this.hiSort) {
        hi.sort((a, b) => b.time - a.time)
      } else {
        hi.reverse()
      }

      if (newestStoryISODate !== this.newestStoryISODate) {
        this.newestStoryISODate = newestStoryISODate
        this.tick()
      }
    } else {
      if (this.storySource === 'askshow' || !this.wideLayout) {
        lo.reverse()
      }
      hi.reverse()
    }

    // if (lo.length === hi.length) {
    //   zipped.push([undefined, undefined])
    // }
    return [lo, hi]
  }

  countStories() {
    if (this.storySource === 'askshow') {
      return this.$store.askStories.length + this.$store.showStories.length
    } else if (this.storySource === 'newstories') {
      return this.$store.newStories.length
    } else {
      return this.$store.topStories.length
    }
  }

  storiesByDate() {
    let stories: any[] = []
    if (this.storySource === 'askshow') {
      stories = this.$store.askStories.concat(this.$store.showStories)
    } else if (this.storySource === 'newstories') {
      stories = this.$store.newStories
    } else {
      stories = this.$store.topStories
    }
    if (!stories) {
      return []
    }
    const dates: any[] = []
    const byDate = {}
    const dateString = {}
    for (const story of stories) {
      const date = this.localeISODateString(story.time)
      const dayStories = byDate[date] || []
      if (dayStories.length === 0) {
        byDate[date] = dayStories
        dates.push(date)
        dateString[date] = this.shortDate(new Date(story.time * 1000))
      }
      dayStories.push(story)
    }
    dates.sort()
    dates.reverse()

    const storiesByDate: any[] = []
    for (const d of dates) {
      storiesByDate.push({ date: d, dateString: dateString[d], stories: byDate[d] })
    }
    return storiesByDate
  }

  addStory(story, stories) {
    switch (story.type) {
      case 'story': {
        stories.push(story)
        break
      }
      case 'comment': {
        this.$store.comments[story.id] = story
        break
      }
      case 'job':
      case 'poll': {
        stories.push(story)
        break
      }
      case 'pollopt': {
        break
      }
      default: {
        // tslint:disable-next-line:no-console
        console.log(`Unrecognized type ${story.type} of item: ${JSON.stringify(story)}`)
        break
      }
    }
  }

  loadStoryIds() {
    const urlStories: any[] = []
    if (this.storySource === 'askshow') {
      urlStories.push([`https://hacker-news.firebaseio.com/v0/askstories.json`, this.$store.askStories])
      urlStories.push([`https://hacker-news.firebaseio.com/v0/showstories.json`, this.$store.showStories])
    } else if (this.storySource === 'newstories') {
      urlStories.push([`https://hacker-news.firebaseio.com/v0/newstories.json`, this.$store.newStories])
    } else {
      urlStories.push([`https://hacker-news.firebaseio.com/v0/topstories.json`, this.$store.topStories])
    }
    for (const [url, store] of urlStories) {
      this.getUrl(url, (status, responseText) => {
        if (status === 200 && responseText) {
          const storyIds = JSON.parse(responseText)
          storyIds.sort((a, b) => b - a)
          this.loadStories(storyIds, store).then(noop)
        }
      })
    }
  }

  async loadStories(storyIds, store) {
    store.length = 0

    this.loaded = false
    this.rendered = false
    const result = {remaining: storyIds.length, stories: []}
    let i = 0
    for (const id of storyIds) {
      i++
      if (i % 10 === 0) {
        await this.sleep(200)
      }
      this.loadStory(id, result, store)
    }
  }

  loadStory(storyId, result, store) {
    this.getStoryUrl(storyId, `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`,
    (status, responseText) => {
      if (status === 200 && responseText) {
        const story = JSON.parse(responseText)
        if (story) {
          this.addStory(story, result.stories)
        }
      }
      result.remaining--
      let batchSize = 60
      const total = store.length + result.stories.length
      if (total < 140) {
        batchSize = 10
      } else if (total < 200) {
        batchSize = 20
      }
      if (result.remaining % batchSize === 0) {
        for (const story of result.stories) {
          store.push(story)
        }
        result.stories.length = 0
        if (result.remaining === 0) {
          this.loaded = true
        }
      }
    })
  }

  getStoryUrl(storyId, url, onLoad) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.onload = () => {
      onLoad(xhr.status, xhr.responseText)
    }
    xhr.send()
  }

  getUrl(url, onLoad) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.onload = () => {
      onLoad(xhr.status, xhr.responseText)
    }
    xhr.send()
  }

  dateStyle(day) {
    let style: object = {position: 'absolute', width: '25%'}
    if (day === 0) {
      style = {...style, 'margin-top': '-4px', 'margin-left': '37.5%'}
    } else if (this.wideLayout) {
      style = {...style, 'margin-top': '8px', 'margin-left': '37.5%'}
    } else {
      style = {...style, 'margin-top': '8px', 'margin-left': '12.5%', 'font-size': '15px'}
    }
    return style
  }

  tick() {
    const d = new Date()
    let time = d.toLocaleTimeString().replace(/:[0-5][0-9] /, ' ').toLowerCase()
    const date = this.localeISODateString(d.getTime() / 1000)
    if (date !== this.newestStoryISODate) {
      time = this.shortDate(d) + ' ' + time
    }
    this.time = time
    setTimeout(this.tick, 1 + (60 - d.getSeconds()) * 1000)
  }

  currentTime(day) {
    return day === 0 ? this.time : ''
  }
  shortDate(d) {
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  }

  localeISODateString(unixTime) {
    const d = new Date(unixTime * 1000)
    const mm = 1 + d.getMonth() < 10 ? `0${1 + d.getMonth()}` : `${1 + d.getMonth()}`
    const dd = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`
    const s = `${d.getFullYear()}-${mm}-${dd}`
    return s
  }

  async sleep(millis) {
    return new Promise( resolve => setTimeout(resolve, millis) )
  }

  matchMediaWidth(minWidth768) {
    this.wideLayout = minWidth768.matches
  }

  adSenseTextDisplaySlot(day) {
    return []
    // return this.adSenseTextDisplaySlots[day]
  }

  renderedLoadAds() {
    if (!this.loaded) {
      return false
    }
    // window.infolinks_pid = 3158805
    // window.infolinks_wsid = 0
    // console.log('Loading ads')
    // setTimeout(() => {
    //   const script = document.createElement('script')
    //   document.body.appendChild(script)
    //   script.src = "https://resources.infolinks.com/js/infolinks_main.js"
    //   console.log('Loaded script for ads')
    // }, 100)
    setTimeout(() => {
      if (document.querySelectorAll('ins').length === document.querySelectorAll('ins > *').length) {
        return
      }
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    }, 100)
    this.loaded = false
    return true
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.sort-score {
  margin-top: -6px;
  line-height: 0 !important;;
  width: 100%;
  text-align: right;
  font-size: 9px;
  cursor: pointer;
}
.score {
  font-size: 11px;
}
.comments {
  color: #505050;
  font-size: 10px;
  font-weight: 300;
}
@media (max-width: 767px) {
  .title-domain {
    width: 89vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
@media (min-width: 768px) {
  .title-domain {
    width: 44vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.title {
  font-size: 14px;
}
.item-domain {
  margin-left: 5px;
  font-size: 11px;
  font-weight: 300;
  color: #606060;
}
.right-time {
  padding-right: 5px;
  position: relative;
  width: 100%;
  text-align: right;
  color: #808080;
}
@media(max-width: 767px) {
  .right-time {
    margin-top: 1px;
    font-size: 15px
  }
}
@media(min-width: 768px) {
  .right-time {
    margin-top: -4px;
  }
}
.column-heading {
  padding-top: 5px;
  padding-bottom: 5px;
}
.column-heading.group0 {
  cursor: pointer;
}
.story-columns {
  margin: 0 5px;
}
@media (max-width: 767px) {
  .story-columns {
    display: flex;
    flex-direction: column-reverse;
  }
}
@media (min-width: 768px) {
  .story-columns {
    display: flex;
    flex-direction: row;
  }
  .columns.first {
    margin-top: 7px;
  }
}
.columns.next {
  margin-top: 4px;
}
.columns {
  display: flex;
  flex-direction: row;
}
.rows {
  display: flex;
  flex-direction: column;
}
.full-width {
  width: 100%;
}
h1 {
  margin: 0;
}
h3 {
  margin: 40px 0 0;
}
td:first-child {
  min-width: 1.5em;
}
td {
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  font-family: sans-serif;
}
a:visited {
  color: #888888;
}
a {
  text-decoration: none;
  color: #333;
}
</style>
