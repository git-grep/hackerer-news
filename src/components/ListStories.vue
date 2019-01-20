<template>
  <div align="center" style="margin-top: -23px">
    <div v-for="(dateStories, day) in storiesByDate(this.$store.topStories)" :key="'d'+dateStories.date">
      <div class="columns">
        <div :style="dateStyle(day)">{{ dateStories.dateString }}</div>
        <div class="right-time">{{ currentTime(day) }}</div>
      </div>
      <div class="story-columns" style="margin: 0 5px">
        <table style="flex: 1" v-for="(stories, col) in colStories(dateStories.stories, day)" :key="col">
          <tr>
            <th colspan="3" class="column-heading" :class="`group${day}`" @click="toggleSort(day, col)">{{ sortTitle(day, col) }}</th>
          </tr>
          <tr v-if="day === 0">
            <td style="min-width: 15px;"><div class="sort-score" @click="toggleSort(day, col)">{{ sortSymbol(col) }}</div></td>
            <td colspan="2"></td>
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
              <td colspan="3"></td>
              <!-- <td :key="`as${i}`" class="full-width">
                <InFeedAdsense
                  data-ad-layout-key="-fg+5n+6t-e7+r"
                  data-ad-client="ca-pub-7698401419914104"
                  :data-ad-slot="`1${day}${row}${i}`">
                </InFeedAdsense>
              </td> -->
            </template>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { getCookie, setCookie } from '../util/cookies.js'

@Component({
  props: {
    storyType: String,
  },
})
export default class ListStories extends Vue {
  time = ''
  newestStoryISODate = this.localeISODateString(new Date().getTime() / 1000)
  loSort = getCookie('news.hackerer.loSort', true)
  hiSort = getCookie('news.hackerer.hiSort', false)

  mounted() {
    this.tick()
    this.loadStories()
  }

  sortTitle(day, col) {
    if (col === 0) {
      return day === 0 && this.loSort ? 'Fresh' : 'Niche'
    } else {
      return day === 0 && this.hiSort ? 'Pop Fresh' : 'Popular'
    }
  }
  sortSymbol(col) {
    if (col === 0) {
      return this.loSort ? '⏱' : '△'
    } else {
      return this.hiSort ? '⏱ ' : '▽  '
    }
  }
  toggleSort(day, col) {
    if (day) {
      return
    }
    console.log(`toggleSort(${col})`)
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
    if (!stories) {
      return []
    }
    const scored = stories.sort((a, b) => a.score === b.score ? b.time - a.time : a.score - b.score)
    const m = Math.ceil(scored.length / 2)
    const lo = scored.slice(0, m)
    const hi = scored.slice(m)
    if (day === 0) {
      if (this.loSort) {
        lo.sort((a, b) => b.time - a.time)
      }
      if (this.hiSort) {
        hi.sort((a, b) => b.time - a.time)
      } else {
        hi.reverse()
      }

      const newestStoryISODate = this.localeISODateString(lo[0].time)
      if (newestStoryISODate !== this.newestStoryISODate) {
        this.newestStoryISODate = newestStoryISODate
        this.tick()
      }
    } else {
      hi.reverse()
    }

    // if (lo.length === hi.length) {
    //   zipped.push([undefined, undefined])
    // }
    return [lo, hi]
  }

  storiesByDate(stories) {
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

  loadStories() {
    this.getUrl('https://hacker-news.firebaseio.com/v0/topstories.json', (status, responseText) => {
      if (status === 200 && responseText) {
        const storyIds = JSON.parse(responseText)
        storyIds.sort((a, b) => b - a)
        this.$store.topStories.length = 0

        const result = {remaining: storyIds.length, stories: []}
        for (const id of storyIds) {
          this.loadStory(id, result)
        }
      }
    })
  }

  loadStory(storyId, result) {
    this.getUrl(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`, (status, responseText) => {
      if (status === 200 && responseText) {
        const story = JSON.parse(responseText)
        if (story) {
          this.addStory(story, result.stories)
        }
      }
      result.remaining--
      let batchSize = 60
      const total = this.$store.topStories.length + result.stories.length
      if (total < 140) {
        batchSize = 10
      } else if (total < 200) {
        batchSize = 20
      }
      if (result.remaining % batchSize === 0) {
        for (const story of result.stories) {
          this.$store.topStories.push(story)
        }
        result.stories.length = 0
      }
    })
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
    if (day) {
      return {position: 'absolute', 'margin-top': '8px', 'margin-left': '37.5%', width: '25%'}
    } else {
      return {position: 'absolute', 'margin-top': '-4px', 'margin-left': '37.5%', width: '25%'}
    }
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
    max-width: 90vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
@media (min-width: 768px) {
  .title-domain {
    max-width: 44vw;
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
  margin-top: -4px;
  padding-right: 5px;
  position: relative;
  width: 100%;
  text-align: right;
  color: #808080;
}
.column-heading {
  padding-top: 5px;
  padding-bottom: 5px;
}
.column-heading.group0 {
  cursor: pointer;
}
@media (max-width: 767px) {
  .story-columns {
    display: flex;
    flex-direction: column;
  }
}
@media (min-width: 768px) {
  .story-columns {
    display: flex;
    flex-direction: row;
  }
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
