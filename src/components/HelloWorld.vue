<template>
  <h1><img src="/favicon.png" class="H"/>ackerer.news</h1>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class HelloWorld extends Vue {
  @Prop() private msg!: string
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.H {
  margin-left: 2px;
  margin-right: 1.25px;
}
h1 {
  margin: 3px 5px;
  color: #777;
}
@media(max-width: 767px) {
  h1 {
    font-size: 22px;
  }
  .H {
    width: 23px;
    height: 24px;
  }
}
@media(min-width: 768px) {
  h1 {
    font-size: 24px;
  }
  .H {
    width: 26px;
    height: 27px;
  }
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  text-decoration: none;
  color: #777;
}
</style>
