<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style>
body {
  margin: 0
}
#app {
  font-family: sans-serif;
}
@media (min-resolution: 192dpi) {
  #app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
@media (max-resolution: 191dpi) {
  #app {
    -webkit-font-smoothing: subpixel-antialiased;
  }
}
</style>
