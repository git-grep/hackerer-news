<template>
  <div class="hello">
    <table>
      <template v-for="dateStories in storiesByDate(this.$store.topStories)">
        <tr>
          <th colspan="6">{{ dateStories.dateString }}</th>
        </tr>
        <tr>
          <th colspan="3">Niche / Fresh</th>
          <th colspan="3">More Popular</th>
        </tr>
        <tr v-for="loHi in zippedStories(dateStories.stories)" :key="(loHi[0] || loHi[1]).id">
          <template v-for="i in [0, 1]">
            <template v-if="loHi[i]">
              <td :key="`a${loHi[i].id}`" align="right">{{ loHi[i].score }}</td>
              <td :key="`b${loHi[i].id}`" align="center"><small><a :href="itemLink(loHi[i])">({{ loHi[i].descendants }})</a></small></td>
              <td :key="`c${loHi[i].id}`"><a :href="titleLink(loHi[i])">{{ loHi[i].deleted && '(deleted)' || loHi[i].title }}</a></td>
            </template>
            <template v-else>
              <td :key="`_${i}`" colspan="3"></td>
            </template>
          </template>
        </tr>
      </template>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  props: {
    storyType: String,
  },
})
export default class ListStories extends Vue {
  @Prop() private msg!: string

  mounted() {
    this.loadStories()
  }

  itemLink(story) {
    return `https://news.ycombinator.com/item?id=${story.id}`
  }

  titleLink(story) {
    return story.url || `https://news.ycombinator.com/item?id=${story.id}`
  }

  zippedStories(stories) {
    if (!stories) {
      return []
    }
    const scores = stories.map(s => s.score).sort((a, b) => a - b)
    const medScore = scores[Math.ceil(scores.length / 2)]
    const lo: any[] = []
    const hi: any[] = []
    for (const s of stories) {
      if (s.score < medScore) {
        lo.push(s)
      } else {
        hi.push(s)
      }
    }
    lo.sort((a, b) => b.score - a.score)
    hi.sort((a, b) => a.score - b.score)
    const m = Math.max(lo.length, hi.length)
    const zipped: any[] = []
    for (let i = 0; i < m; i++) {
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
          .toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
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
            case 'poll':
            case 'pollopt': {
              console.log(`Unsupported type ${story.type} of item: ${JSON.stringify(story)}`)
              break
            }
            default: {
              console.log(`Unrecognized type ${story.type} of item: ${JSON.stringify(story)}`)
              break
            }
          }
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
h1 {
  margin: 0;
}
h3 {
  margin: 40px 0 0;
}
td {
  font-size: 13px;
  font-family: sans-serif;
}
a {
  text-decoration: none;
  color: #333;
}
</style>
