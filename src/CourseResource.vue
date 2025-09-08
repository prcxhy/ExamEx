<script setup lang="ts">
import { ref, watch } from 'vue';
// import { getMarkdownContent, downloadFile } from './scripts/RepositoryAccess';
import { getMarkdownContent } from './scripts/RepositoryAccess';
import IconWeb from './assets/earth.svg?component';
import IconDownload from './assets/download.svg?component';
import IconGithub from './assets/github.svg?component';
import { openUrl } from '@tauri-apps/plugin-opener';

const props = defineProps<{
  course: {name: string, url: string}
}>()

const resources = ref();

const emit = defineEmits(['downloading', 'down-ok', 'down-err']);

watch(() => props.course, newCourse => {
    // console.log(newCourse);
    getMarkdownContent(newCourse.url)
        .then((content) => {
            resources.value = content.split('[').flatMap(slice => {
                if (slice.includes('](')) {
                    let nameAndLink = slice.split('](');
                    let name = nameAndLink[0].trim();
                    let url = nameAndLink[1].slice(0, nameAndLink[1].lastIndexOf(')'));
                    let type = url.slice(url.lastIndexOf('.') + 1);
                    if (type.length > 4 || type.includes('/')) {
                        type = url.startsWith('https://github.com/') ? "dir" : "url";
                    } else if (url.startsWith('https://github.com/')) {
                        url = url.replace('https://github.com/', 'https://raw.githubusercontent.com/')
                        .replace('/blob/', '/');
                    }
                    return [{ name, type, url }];
                } else {
                    return [];
                }
            })
            // console.log(resources.value);
        });
}, { immediate: true });

function accessResource(url: string, isFile: boolean) {
    if (isFile) {
        emit('downloading');
        let fileName = decodeURIComponent(url.slice(url.lastIndexOf('/') + 1));
        // downloadFile(url, fileName).then(result => {
        //     if (result == 'ok') {
        //         emit('down-ok', fileName);
        //     } else {
            //         emit('down-err');
            //     }
            // });
        let a = document.createElement('a');
        a.href = url;
        a.download = url.slice(url.lastIndexOf('/') + 1);
        a.click();
        emit('down-ok', fileName);
    } else {
        openUrl(url);
    }
}
</script>

<template>
    <div id="course-info">
        <h1>{{ props.course.name }}</h1>
        <div id="resource-panel">
            <div class="resource-card" v-for="resource in resources">
                <p class="resource-name">{{ resource.name }}</p>
                <p class="resource-type">{{ resource.type == 'dir' ? "可能包含多个文件" : resource.type }}</p>
                <button @click="accessResource(resource.url, !'url/dir'.includes(resource.type))"
                :title="'url/dir'.includes(resource.type) ? '访问网页' : '下载'">
                    <IconGithub v-if="resource.type == 'dir'"/>
                    <IconWeb v-if="resource.type == 'url'"/>
                    <IconDownload v-if="!'url/dir'.includes(resource.type)"/>
                </button>
            </div>
        </div>
    </div>
</template>

<style>
#course-info {
    display: flex;
    flex-direction: column;
    padding: 5mm 3mm 3mm 5mm;
    overflow: hidden;
}

#resource-panel {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6cm, 1fr));
    grid-auto-rows: 1fr;
    gap: 2mm;
    overflow: hidden auto
}

.resource-card {
    border: 1px solid var(--color-theme-4);
    border-radius: 2mm;
    padding: 2mm 2mm 2mm 4mm;
    gap: 1mm;
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: 1fr 10mm;
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
    grid-column: 2 / 3;
    height: 10mm;
    width: 100%;
    transition: 0.3s;
}

.resource-name {
    color: var(--color-font-1);
    max-width: 45mm;
    text-overflow: ellipsis;
    grid-column: 1 / 2;
    font-size: 4.2mm;
    font-weight: bold;
}

.resource-type {
    color: var(--color-font-4);
    grid-column: 1 / 2;
    font-size: 4mm;
    opacity: 0.5;
}
</style>