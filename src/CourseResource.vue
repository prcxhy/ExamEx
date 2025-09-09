<script setup lang="ts">
import { ref, watch } from 'vue';
// import { getMarkdownContent, downloadFile } from './scripts/RepositoryAccess';
import { getMarkdownContent } from './scripts/RepositoryAccess';
import ResourceCard from './ResourceCard.vue';

const props = defineProps<{
  course: {name: string, url: string}
}>()

const resources = ref();

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
                        // console.log(url);
                        url = url.replace('/blob/', '/raw/');
                        // url = url.replace('https://github.com/', 'https://raw.githubusercontent.com/')
                        // .replace('/blob/', '/');
                    }
                    return [{ name, type, url }];
                } else {
                    return [];
                }
            })
            // console.log(resources.value);
        });
}, { immediate: true });
</script>

<template>
    <div id="course-info">
        <h1>{{ props.course.name }}</h1>
        <div id="resource-panel">
            <ResourceCard v-for="resource in resources" :name="resource.name" :type="resource.type" :url="resource.url"/>
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
</style>