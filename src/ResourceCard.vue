<script setup lang="ts">
import { openUrl } from '@tauri-apps/plugin-opener';
import IconWeb from './assets/earth.svg?component';
import IconDownload from './assets/download.svg?component';
import IconGithub from './assets/github.svg?component';
import { ref } from 'vue';
import { downloadFile } from './scripts/RepositoryAccess';
import { emit } from '@tauri-apps/api/event';

const resource = defineProps<{
    name: string,
    type: string,
    url: string
}>()

const showProgressBar = ref(false);

const progress = ref(0);

function accessResource(url: string, isFile: boolean) {
    if (isFile) {
        let fileName = decodeURIComponent(url.slice(url.lastIndexOf('/') + 1));
        emit('down-start', fileName);
        showProgressBar.value = true;
        downloadFile(url, fileName, progress)
            .then(result => {
                if (result == 'ok') {
                    emit('down-ok', fileName);
                } else {
                    emit('down-err', fileName);
                }
                setTimeout(() => showProgressBar.value = false, 3000);
            });
    } else {
        openUrl(url);
    }
}
</script>

<template>
    <div class="resource-card">
        <p class="resource-name">{{ resource.name }}</p>
        <p class="resource-type">{{ resource.type == 'dir' ? "可能包含多个文件" : resource.type }}</p>
        <div v-show="!'url/dir'.includes(resource.type) && showProgressBar" class="progress-bar">
            <div class="progress" :style="{width: `${progress}%`}"></div>
        </div>
        <button @click="accessResource(resource.url, !'url/dir'.includes(resource.type))"
        :title="'url/dir'.includes(resource.type) ? '访问网页' : '下载'">
            <IconGithub v-if="resource.type == 'dir'"/>
            <IconWeb v-if="resource.type == 'url'"/>
            <IconDownload v-if="!'url/dir'.includes(resource.type)"/>
        </button>
    </div>
</template>

<style>
.resource-card {
    border: 1px solid var(--color-theme-4);
    border-radius: 2mm;
    padding: 2mm 2mm 2mm 4mm;
    gap: 1mm;
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: 1fr auto 10mm;
    justify-items: left;
    justify-content: space-around;
    align-items: center;
    transition: 0.3s;
    will-change: border;
}

.resource-card:hover {
    background-color: var(--color-theme-1);
    border: 1px solid white;
    will-change: border;
}

.resource-card > button {
    grid-row: 1 / 3;
    grid-column: -2 / -1;
    height: 10mm;
    width: 100%;
    transition: 0.3s;
}

.resource-name {
    color: var(--color-font-1);
    max-width: 45mm;
    text-overflow: ellipsis;
    grid-column: 1 / 3;
    font-size: 4.2mm;
    font-weight: bold;
}

.progress-bar {
    background-color: var(--color-shadow-1);
    display: flex;
    border-radius: 2px;
    width: 2cm;
    height: 4px;
}

.progress {
    background-color: rgb(36, 226, 80);
    border-radius: 2px;
    height: 4px;
    transition: 0.5s;
}

.resource-type {
    color: var(--color-font-4);
    font-size: 4mm;
    opacity: 0.5;
}
</style>