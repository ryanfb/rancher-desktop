<script lang="ts">
import Vue from 'vue';

import PreferencesAlert from '@/components/Preferences/Alert.vue';
import PreferencesBodyApplication from '@/components/Preferences/BodyApplication.vue';
import PreferencesBodyContainerEngine from '@/components/Preferences/BodyContainerEngine.vue';
import PreferencesBodyKubernetes from '@/components/Preferences/BodyKubernetes.vue';
import PreferencesBodyVirtualMachine from '@/components/Preferences/BodyVirtualMachine.vue';
import PreferencesBodyWsl from '@/components/Preferences/BodyWsl.vue';
import { Settings } from '@/config/settings';

import type { PropType } from 'vue';

export default Vue.extend({
  name:       'preferences-body',
  components: {
    PreferencesBodyApplication,
    PreferencesBodyVirtualMachine,
    PreferencesBodyWsl,
    PreferencesBodyContainerEngine,
    PreferencesBodyKubernetes,
    PreferencesAlert,
  },
  props:      {
    currentNavItem: {
      type:     String,
      required: true,
    },
    preferences: {
      type:     Object as PropType<Settings>,
      required: true,
    },
  },
  computed: {
    normalizeNavItem(): string {
      return this.currentNavItem.toLowerCase().replaceAll(' ', '-');
    },
    componentFromNavItem(): string {
      return `preferences-body-${ this.normalizeNavItem }`;
    },
  },
});
</script>

<template>
  <div class="preferences-body">
    <slot>
      <component
        :is="componentFromNavItem"
        :preferences="preferences"
        v-on="$listeners"
      />
    </slot>
    <div class="preferences-alert">
      <preferences-alert />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .preferences-body {
    display: flex;
    flex-direction: column;

    .preferences-alert {
      margin-top: auto;
      padding: var(--preferences-content-padding);
    }
  }
</style>
