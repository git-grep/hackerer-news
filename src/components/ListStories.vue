<template>
  <div class="hello">
    <table>
      <tr>
        <th colspan="3">Fresh and Niche</th>
        <th colspan="3">Popular</th>
      </tr>
      <tr v-for="loHi in zippedStories()" :key="(loHi[0] || loHi[1]).id">
        <template v-for="i in [0, 1]">
          <template v-if="loHi[i]">
            <td :key="`a${loHi[i].id}`">{{ loHi[i].score }}</td>
            <td :key="`b${loHi[i].id}`"><small><a :href="itemLink(loHi[i])">({{ loHi[i].descendants }})</a></small></td>
            <td :key="`c${loHi[i].id}`"><a :href="titleLink(loHi[i])">{{ loHi[i].deleted && '(deleted)' || loHi[i].title }}</a></td>
          </template>
          <template v-else>
            <td :key="`x${i}`"></td>
            <td :key="`y${i}`"></td>
            <td :key="`z${i}`"></td>
          </template>
        </template>
      </tr>
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

  mounted () {
    this.loadStories()
  }

  itemLink(story) {
    return `https://news.ycombinator.com/item?id=${story.id}`
  }

  titleLink(story) {
    return story.url || `https://news.ycombinator.com/item?id=${story.id}`
  }

  zippedStories() {
    if (!this.$store.topStories) {
      return []
    }
    let scores = this.$store.topStories.map(s => s.score).sort((a, b) => a - b)
    let medScore = scores[Math.ceil(scores.length / 2)]
    let lo = []
    let hi = []
    for (let s of this.$store.topStories) {
      if (s.score < medScore) {
        lo.push(s)
      } else {
        hi.push(s)
      }
    }
    lo.sort((a, b) => a.score - b.score)
    hi.sort((a, b) => b.score - a.score)
    let m = Math.max(lo.length, hi.length)
    let zipped = []
    for (let i = 0; i < m; i++) {
      let l = (i < lo.length) && lo[i]
      let h = (i < hi.length) && hi[i]
      zipped.push([l, h])
    }
    return zipped
  }

  loadStories() {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', 'https://hacker-news.firebaseio.com/v0/topstories.json')
    xhr.onload = () => {
      if (xhr.status === 200 && xhr.responseText) {
        let storyIds = JSON.parse(xhr.responseText)
        let stories = []
        for (let id of storyIds) {
          let xhr = new XMLHttpRequest()
          xhr.open('GET', `https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          xhr.onload = () => {
            if (xhr.status === 200 && xhr.responseText) {
              let story = JSON.parse(xhr.responseText)
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
                  case 'job': {
                    console.log(`Unsupported type ${story.type} of item: ${JSON.stringify(story)}`)
                    break
                  }
                  case 'poll': {
                    console.log(`Unsupported type ${story.type} of item: ${JSON.stringify(story)}`)
                    break
                  }
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
          }
          xhr.send()
        }
        this.$store.topStories = stories
      }
    }
    xhr.send()
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
