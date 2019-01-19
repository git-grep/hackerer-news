<template>
  <table align="center" style="margin-top: -23px">
    <template v-for="(dateStories, index) in storiesByDate(this.$store.topStories)">
      <tr :key="dateStories.date+'d'">
        <th colspan="6"><div :style="dateStyle(index)">{{ dateStories.dateString }}</div><div class="left-time">{{ currentTime(index) }}</div><div class="right-time">{{ currentTime(index) }}</div></th>
      </tr>
      <tr :key="dateStories.date+'h'">
        <th colspan="3" class="column-heading" :class="`group${index}`" @click="toggleLoSort(index)">{{ index || !loSort ? 'Niche' : 'Fresh' }}</th>
        <th colspan="3" class="column-heading" :class="`group${index}`" @click="toggleHiSort(index)">{{ index || !hiSort ? 'Popular' : 'Pop Fresh' }}</th>
      </tr>
      <template v-for="(loHi, row) in zippedStories(dateStories.stories, index)">
        <tr v-if="row === 0 && index === 0" :key="`v${row}`">
          <td><div class="sort-score" @click="toggleLoSort(index)">{{ loSortSymbol() }}</div></td><td colspan="2"></td>
          <td><div class="sort-score" @click="toggleHiSort(index)">{{ hiSortSymbol() }}</div></td><td colspan="2"></td>
        </tr>
        <tr :key="(loHi[0] || loHi[1]).id">
          <template v-for="i in [0, 1]">
            <template v-if="loHi[i]">
              <td :key="`a${loHi[i].id}`" align="right"><a :href="itemLink(loHi[i])" target="hn" class="score">{{ loHi[i].score }}</a></td>
              <td :key="`b${loHi[i].id}`" align="center"><a :href="itemLink(loHi[i])" target="hn" class="comments"><span>{{ loHi[i].descendants || '·' }}</span></a></td>
              <td :key="`c${loHi[i].id}`"><a :href="titleLink(loHi[i])" :title="linkTitle(loHi[i])" target="hn" class="title-link"><div class="title-domain"><span class="title">{{ loHi[i].deleted && '(deleted)' || titleText(loHi[i]) }}</span><span class="item-domain">{{ itemDomain(loHi[i]) }}</span></div></a></td>
            </template>
            <template v-else>
              <td :key="`_${i}`" colspan="3"></td>
            </template>
          </template>
        </tr>
      </template>
    </template>
  </table>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  props: {
    storyType: String,
  },
})
export default class ListStories extends Vue {
  time = ''
  newestStoryISODate = this.localeISODateString(new Date().getTime() / 1000)
  loSort = true
  hiSort = false

  mounted() {
    this.tick()
    this.loadStories()
  }

  loSortSymbol() {
    return this.loSort ? '⏱' : '△ '
  }
  hiSortSymbol() {
    return this.hiSort ? '⏱' : '▽ '
  }
  toggleLoSort(index) {
    if (index) {
      return
    }
    this.loSort = !this.loSort
  }
  toggleHiSort(index) {
    if (index) {
      return
    }
    this.hiSort = !this.hiSort
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

  zippedStories(stories, index) {
    if (!stories) {
      return []
    }
    const scored = stories.sort((a, b) => a.score === b.score ? b.time - a.time : a.score - b.score)
    const m = Math.ceil(scored.length / 2)
    const lo = scored.slice(0, m)
    const hi = scored.slice(m)
    if (index === 0) {
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

    const n = Math.max(lo.length, hi.length)
    const zipped: any[] = []
    for (let i = 0; i < n; i++) {
      const l = (i < lo.length) && lo[i]
      const h = (i < hi.length) && hi[i]
      zipped.push([l, h])
    }
    return zipped
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

  dateStyle(index) {
    if (index) {
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

  currentTime(index) {
    return index ? '' : this.time
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
.title-domain {
  width: 44vw;
  overflow: hidden;
  text-overflow: ellipsis;
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
.left-time {
  float: left;
  margin-top: -4px;
  visibility: hidden;
}
.right-time {
  float: right;
  margin-top: -4px;
  color: #808080;
}
.column-heading {
  padding-top: 5px;
  padding-bottom: 5px;
}
.column-heading.group0 {
  cursor: pointer;
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
