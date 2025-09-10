<script setup lang="ts">
import { openUrl } from '@tauri-apps/plugin-opener';
import { computed, inject, ref, watch } from 'vue';
import { getMajorsMenu } from './scripts/RepositoryAccess';
import { saveJSON } from './scripts/Files';
import IconGithub from './assets/github.svg?component';
const props = defineProps<{
    config: {university: string, school: string}
}>();

const UNIVERSITIES = inject<{[ key: string ]: string}[]>('universities') || [];

const VERSION = inject<{[ key: string ]: string}>('version')!;

const needUpdate = computed(() => VERSION.last != VERSION.current);

const emit = defineEmits(['configured']);

const schoolList = ref();
const universityFilter = ref(props.config.university);
const schoolFilter = ref(props.config.school);

const filteredUniversitiesList = computed(() => {
  if (!universityFilter.value) {
    return [];
  }
  return UNIVERSITIES.filter((university: { [key: string]: any }) =>
    university.name.includes(universityFilter.value)
  );
});
const filteredSchoolList = computed(() => {
  if (!schoolFilter.value || !schoolList.value) {
    return [];
  }
  return schoolList.value.filter((school: { [key: string]: any }) =>
    school.name.includes(schoolFilter.value)
  );
});

const repoURL = computed(() => {
  if (filteredUniversitiesList.value.length == 1 && filteredUniversitiesList.value[0].name == universityFilter.value) {
    return filteredUniversitiesList.value[0].api;
  } else {
    return '';
  }
})
const selected = computed(() => {
  return filteredSchoolList.value.length == 1 && filteredSchoolList.value[0].name == schoolFilter.value;
})

watch(repoURL, newVal => {
  if (newVal) {
    getMajorsMenu(newVal).then((schools) => {
      schoolList.value = schools;
    });
  } else {
    schoolList.value = [];
  }
}, { immediate: true });

function confirm() {
  if (filteredUniversitiesList.value.length == 1) {
    let newConfig = {
        university: universityFilter.value,
        school: selected.value ? schoolFilter.value : ""
    };
    emit('configured', newConfig);
    saveJSON('config.json', newConfig);
  }
}
</script>

<template>
    <div id="config-page">
        <div id="config-title">
          <button :disabled="!needUpdate" @click="openUrl('https://github.com/prcxhy/ExamEx/releases');">
            {{ needUpdate ? "有新版本" : 'v' + VERSION.current }}
          </button>
          <h1>设 置 学 递</h1>
        </div>
        <button @click="openUrl('https://github.com/prcxhy/ExamEx');">
          <IconGithub/>&ensp;学递ExamEx
        </button>
        <input id="university-input" v-model="universityFilter" placeholder="输入大学全称"></input>
        <button :disabled="!repoURL" title="查看仓库" @click="openUrl(filteredUniversitiesList[0].repository)">
          <IconGithub/>
        </button>
        <div class="search-list" v-if="universityFilter && !repoURL">
          <p @click="universityFilter = university.name" v-for="university in filteredUniversitiesList"
          class="search-item">
            {{ university.name }}
        </p>
          <p v-show="universityFilter && filteredUniversitiesList.length == 0" class="hint-text">
            如果没输错那就是该大学的仓库还没被收录哦～
          </p>
        </div>
        <input id="school-input" v-model="schoolFilter" @keyup.enter="confirm" placeholder="输入学院全称"></input>
        <div class="search-list" v-if="schoolFilter && !selected">
          <p @click="schoolFilter = school.name" v-for="school in filteredSchoolList" class="search-item">
            {{ school.name }}
          </p>
          <p v-show="schoolFilter && filteredSchoolList.length == 0" class="hint-text">
            如果没输错那就是该学院的课程还没被收录哦～
          </p>
        </div>
        <button :disabled="!repoURL" @click="confirm" id="confirm-button">
          {{ selected ? "确认" : "先看看通识课程" }}
        </button>
    </div>
</template>

<style>
#config-page {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: var(--color-theme-3);
  display: grid;
  grid-template-columns: 6cm 8mm;
  gap: 3mm 0px;
  align-items: center;
  align-content: center;
  justify-content: center;
  transition: 0.5s;
  z-index: 2;
}

#config-title {
  grid-column: 1 / -1;
  justify-self: center;
}

#config-title>button {
  color: white;
  position: relative;
  font-size: 3mm;
  height: 5mm;
  padding: 0px 1mm;
  top: 1mm;
  left: 3.6cm;
  transition: 0.3s;
}

#config-title>button:enabled {
  background-color: rgb(255, 88, 88);
}

#config-title>button:enabled:hover {
  opacity: 0.75;
}

#config-title>button:disabled {
  background-color: rgb(128, 128, 128);
}

#config-title > h1 {
    justify-self: center;
    margin: 0px;
}

#config-title + button {
  height: 5mm;
  background-color: transparent;
  width: auto;
  font-size: 3.6mm;
  grid-column: 1 / -1;
}

#config-title + button:hover {
  opacity: 0.75;
}

#university-input {
  grid-column: 1 / 2;
  border-radius: 1mm 0px 0px 1mm;
}

#university-input + button {
  background-color: var(--color-theme-2);
  border-radius: 0px 1mm 1mm 0px;
  transition: 0.3s;
}

#university-input + button:enabled:hover {
  background-color: var(--color-theme-4);
}

#school-input {
  grid-column: 1 / -1;
}

#confirm-button {
  grid-column: 1 / -1;
  justify-self: right;
  margin-bottom: 2cm;
  background-color: rgb(146, 201, 115);
  color: green;
  transition: 0.3s
}

#confirm-button:enabled:hover {
  background-color: rgb(182, 222, 158);
}

#confirm-button:enabled:active {
  background-color: rgb(231, 254, 214);
}

.search-list {
  grid-column: 1 / -1;
  max-height: 3cm;
  overflow-y: auto;
  background-color: var(--color-theme-4);
  border-radius: 2mm;
  padding: 1mm;
  display: flex;
  flex-direction: column;
  transition: 0.5s;
  gap: 1mm;
}

.search-item {
  color: var(--color-font-3);
  border-radius: 1mm;
  padding: 1mm 2mm;
  cursor: pointer;
  transition: 0.3s;
}

.search-item:hover {
  background-color: var(--color-theme-3);
}

.search-item:active {
  background-color: var(--color-theme-2);
}
</style>