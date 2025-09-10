<script setup lang="ts">
import { openUrl } from '@tauri-apps/plugin-opener';
import IconWeb from './assets/earth.svg?component';
import IconDownload from './assets/download.svg?component';
import IconGithub from './assets/github.svg?component';
import IconArrow from './assets/right.svg?component';
import { ref } from 'vue';
import { downloadFile, getDirList } from './scripts/RepositoryAccess';
import { emit } from '@tauri-apps/api/event';

const resource = defineProps<{
    name: string,
    type: string,
    url: string
    subCard?: boolean
}>()

const showProgressBar = ref(false);

const progress = ref(0);

const showDir = ref(false);

const subCardList = ref();

function dirFoldToggle(url: string) {
    showDir.value = !showDir.value;
    let subStrings = url.slice(8).split('/');
    subStrings[0] = 'api.github.com/repos';
    subStrings[3] = 'contents';
    subStrings.splice(4, 1);
    let api = ['https:/', ...subStrings].join('/');
    getDirList(api).then(result => {
        subCardList.value = result.map((item: {[key: string]: any}) => {
            let i = (item.name as string).lastIndexOf('.');
            let name = (item.name as string).slice(0, i == -1 ? undefined : i);
            let type = item.type == 'dir' ? 'dir' : (item.name as string).slice(i + 1);
            let url = item.html_url;
            return { name, type, url }
        })
    })
}

function accessResource(url: string) {
    let fileName = decodeURIComponent(url.slice(url.lastIndexOf('/') + 1));
    emit('down-start', fileName);
    showProgressBar.value = true;
    downloadFile(url.replace('/blob/', '/raw/'), fileName, progress)
        .then(result => {
            if (result == 'ok') {
                emit('down-ok', fileName);
            } else {
                emit('down-err', fileName);
            }
            setTimeout(() => showProgressBar.value = false, 3000);
        });
}
</script>

<template>
    <div :class="['resource-card', showDir ? 'card-group' : 'card-single']">
        <p class="resource-name">{{ resource.name }}</p>
        <button v-if="!'url/dir'.includes(resource.type)" @click="accessResource(resource.url)" title="下载">
            <IconDownload/>&ensp;
            <p class="resource-type">{{ resource.type }}</p>
        </button>
        <button v-if="resource.type == 'dir' && !resource.subCard" @click="dirFoldToggle(resource.url)"
        :title="showDir ? '收起目录' : '展开目录'">
            <IconArrow :style="{transform: showDir ? 'rotate(90deg)' : 'rotate(0deg)'}"/>
            <p v-if="!showDir" class="resource-type">{{ "可能包含多个文件" }}</p>    
        </button>
        <div v-show="!'url/dir'.includes(resource.type) && showProgressBar" class="progress-bar">
            <div class="progress" :style="{width: `${progress}%`}"></div>
        </div>
        <button @click="openUrl(resource.url)" title="访问网页" style="grid-column: -2 / -1;">
            <IconGithub v-if="resource.type != 'url'"/>
            <IconWeb v-if="resource.type == 'url'"/>
        </button>
        <div v-if="showDir" class="sub-resource-panel">
            <ResourceCard v-for="card in subCardList" :name="card.name" :type="card.type" :url="card.url" :sub-card="true"/>
        </div>
    </div>
</template>

<style>
.resource-card {
    display: grid;
    border: 1px solid var(--color-theme-4);
    border-radius: 2mm;
    padding: 2mm;
    gap: 1mm;
    justify-content: space-between;
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
    width: 100%;
    transition: 0.3s;
}

.card-single {
    grid-template-rows: 1fr auto;
    grid-template-columns: auto 1fr auto;
    justify-items: left;
}

.card-single > .resource-name {
    grid-column: 1 / -1;
}

.card-group {
    grid-template-rows: auto 1fr;
    grid-template-columns: 1fr auto auto;
    grid-row: span 3;
    grid-column: span 2;
    overflow: hidden;
}

.card-group > .resource-name {
    grid-column: 1 / 2;
}

.resource-name {
    color: var(--color-font-1);
    padding: 0px 2mm;
    max-width: 45mm;
    text-overflow: ellipsis;
    font-size: 4.2mm;
    font-weight: bold;
}

.resource-name + button {
    justify-content: left;
}

.progress-bar {
    background-color: var(--color-shadow-1);
    display: flex;
    border-radius: 2px;
    margin-left: 2mm;
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

.sub-resource-panel {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-auto-rows: 1fr;
    height: 5cm;
    padding: 2mm;
    gap: 2mm;
    border-radius: 1mm;
    background-color: var(--color-shadow-1);
    grid-column: 1 / -1;
    overflow: hidden scroll;
}
</style>