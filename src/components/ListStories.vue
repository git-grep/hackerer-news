<template>
  <table align="center" style="margin-top: -23px">
    <template v-for="(dateStories, index) in storiesByDate(this.$store.topStories)">
      <tr :key="dateStories.date+'d'">
        <th colspan="6"><div :style="dateStyle(index)">{{ dateStories.dateString }}</div><div class="left-time">{{ currentTime(index) }}</div><div class="right-time">{{ currentTime(index) }}</div></th>
      </tr>
      <tr :key="dateStories.date+'h'">
        <th colspan="3" class="column-heading">{{ index ? 'Niche' : 'Fresh' }}</th>
        <th colspan="3" class="column-heading">Popular</th>
      </tr>
      <tr v-for="loHi in zippedStories(dateStories.stories, index)" :key="(loHi[0] || loHi[1]).id">
        <template v-for="i in [0, 1]">
          <template v-if="loHi[i]">
            <td :key="`a${loHi[i].id}`" align="right"><a :href="itemLink(loHi[i])" class="score">{{ loHi[i].score }}</a></td>
            <td :key="`b${loHi[i].id}`" align="center"><a :href="itemLink(loHi[i])" class="comments">{{ loHi[i].descendants || '⁺' }}</a></td>
            <td :key="`c${loHi[i].id}`"><a :href="titleLink(loHi[i])" :title="linkTitle(loHi[i])"><div class="title-domain"><span class="title">{{ loHi[i].deleted && '(deleted)' || titleText(loHi[i]) }}</span><span class="item-domain">{{ itemDomain(loHi[i]) }}</span></div></a></td>
          </template>
          <template v-else>
            <td :key="`_${i}`" colspan="3"></td>
          </template>
        </template>
      </tr>
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

  mounted() {
    this.tick()
    this.loadStories()
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
    const scored = stories.sort((a, b) => a.score === b.score ? a.time - b.time : a.score - b.score)
    const m = Math.ceil(scored.length / 2)
    const lo = scored.slice(0, m)
    const hi = scored.slice(m)
    hi.reverse()
    if (index === 0) {
      lo.sort((a, b) => b.time - a.time)
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
        dateString[date] = new Date(story.time * 1000)
          .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
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
        const stories: any[] = []
        for (const id of storyIds) {
          this.loadStory(id, stories)
        }
        this.$store.topStories = stories
      }
    })
  }

  loadStory(storyId, stories) {
    this.getUrl(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`, (status, responseText) => {
      if (status === 200 && responseText) {
        const story = JSON.parse(responseText)
        if (story) {
          this.addStory(story, stories)
        }
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
      return {position: 'absolute', 'margin-top': '8px', width: '100%'}
    } else {
      return {display: 'inline-block'}
    }
  }

  tick() {
    this.time = new Date().toLocaleTimeString().replace(/:[0-5][0-9] /, ' ').toLowerCase()
    setInterval(this.tick, 10000)
  }

  currentTime(index) {
    return index ? '' : this.time
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
.score {
  font-size: 11px;
}
.comments {
  color: #aaaaaa;
  font-size: 10px;
}
.title-domain {
  width: 44vw;
  overflow: hidden;
  text-overflow: ellipsis;
}
.title {
  font-size: 10pt;
}
.item-domain {
  margin-left: 5px;
  font-size: 11px;
  color: #aaaaaa;
}
.left-time {
  float: left;
  visibility: hidden;
}
.right-time {
  float: right;
  color: #808080;
}
.column-heading {
  padding-top: 5px;
  padding-bottom: 5px;
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
a {
  text-decoration: none;
  color: #333;
}
</style>
