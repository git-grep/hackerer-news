/**
 * Declarations to add vue-stash's 'store' property in @Component options
 */
declare module "vue-stash" {
  import Vue from 'vue'

  /**
   * @module augmentation to ComponentOptions defined by Vuejs
   */
  module "vue/types/options" {
    interface ComponentOptions<V extends Vue> {
      store?: any[] | {}
    }
  }

  module "vue/types/vue" {
    interface Vue {
      $store: any
    }
  }  
}
