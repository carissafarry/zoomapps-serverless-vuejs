<template>
  <h2 class='text-center' v-if='isMainClient'>Start a Meeting to Use this App</h2>
  <div v-else-if='isZoom'> Haloo! </div>
  <a v-else href="/api/install">Install the app</a>
</template>

<script setup>
import { computed } from 'vue';
import zoomSdk from '@zoom/appssdk';

let context;
const isMainClient = computed(() =>
    context === 'inMainClient',
);

let isZoom = false

try {
    const configResponse = await zoomSdk.config({
        size: { width: 480, height: 360 },
        capabilities: [
            'getMeetingUUID',
        ],
    });

    isZoom = true;

    context = configResponse.runningContext;
    console.debug('Zoom JS SDK Configuration', configResponse);
} catch (e) {
    console.error(e);
}
</script>