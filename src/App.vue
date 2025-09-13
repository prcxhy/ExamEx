<script setup lang="ts">
import { downloadDir } from '@tauri-apps/api/path'
import { computed, inject, onMounted, ref, watch } from "vue";
import { getCoursesMenu } from "./scripts/RepositoryAccess";
import CourseResource from "./CourseResource.vue";
import ConfigPage from "./ConfigPage.vue";
import IconSetting from "./assets/setting.svg?component";
import IconStar from "./assets/star.svg?component";
import { listen } from '@tauri-apps/api/event';
import { loadJSON, saveJSON } from './scripts/Files';
const props = defineProps<{
  university: string;
  school: string;
}>();

var universityName = props.university;

const UNIVERSITIES = inject<{[ key: string ]: string}[]>('universities') || [];

const universityURL = ref(UNIVERSITIES.find(
  (uni) => uni.name == props.university
)?.api || '');

const schoolName = ref(props.school);

const coursesList = ref();

const favoriteList = ref<{name: string, url: string}[]>([]);

function favoriteToggle(course: {name: string, url: string}) {
  let i = favoriteList.value.findIndex(item => item.url == course.url);
  if (i == -1) {
    favoriteList.value.push(course);
  } else {
    favoriteList.value.splice(i, 1);
  }
  saveJSON('favorites.json', favoriteList.value);
}

const coursesFilter = ref("");
const filteredCoursesList = computed(() => {
  if (!coursesFilter.value) {
    return coursesList.value;
  }
  return coursesList.value.filter((course: { [key: string]: any }) =>
    course.name.includes(coursesFilter.value)
  );
});

const courseSelected = ref();

const configing = ref(!props.university);

const tagCode = ref(props.school ? 0 : 1);

watch(tagCode, newVal => {
  if (newVal == 0) {
    getCoursesMenu(universityURL.value, schoolName.value).then((courses) => {
      coursesList.value = courses;
      courseSelected.value = null;
    });
  } else if (newVal == 1) {
    getCoursesMenu(universityURL.value, "通识课程").then((courses) => {
      coursesList.value = courses;
      courseSelected.value = null;
    });
  } else {
    coursesList.value = favoriteList.value;
    courseSelected.value = null;
  }
}, {immediate: true});

watch(schoolName, newSchool => {
  if (tagCode.value == 0) {
    getCoursesMenu(universityURL.value, newSchool).then((courses) => {
      coursesList.value = courses;
      courseSelected.value = null;
    });
  }
});

watch(universityURL, newURL => {
  if (tagCode.value == 1) {
    getCoursesMenu(newURL, "通识课程").then((courses) => {
      coursesList.value = courses;
      courseSelected.value = null;
    });
  }
});

function configured(newConfig: { [key: string]: any }) {
  configing.value = false;
  universityName = newConfig.university;
  universityURL.value = UNIVERSITIES.find(
    (uni) => uni.name == universityName
  )!.api
  schoolName.value = newConfig.school;
  tagCode.value = newConfig.school ? 0 : 1;
}

const appMsg = ref('');

async function showMessage(msg: string) {
  appMsg.value = msg;
  setTimeout(() => appMsg.value = '', 5000);
}

listen('down-start', (event) => {
  showMessage(`开始下载: ${event.payload}`);
})

listen('down-ok', async (event) => {
  let msg = `下载完成: 已将 ${event.payload} 保存至 ${await downloadDir()}`;
  showMessage(msg);
})

listen('down-err', (event) => {
  showMessage(`${event.payload} 下载失败`);
})

const needUpdateVersion = ref(false);

onMounted(() => {
  if (props.school) {
    getCoursesMenu(universityURL.value, props.school).then((courses) => {
      coursesList.value = courses;
    });
  }
  let version: {[key: string]: string} = inject('version')!;
  if (version.current != version.last) {
    showMessage(`检测到新版本: v${version.last}, 请前往设置下载`);
    needUpdateVersion.value = true;
  }
  loadJSON('favorites.json', []).then(result => favoriteList.value = result);
});
</script>

<template>
  <Teleport to="body">
    <Transition>
      <div id="app-message" v-if="appMsg">
        <p>{{ appMsg }}</p>
      </div>
    </Transition>
  </Teleport>
  <nav>
    <div id="tags-container">
      <p v-if="schoolName" :class="[tagCode == 0 ? 'course-type-tag' : 'course-type-tag-idle']" @click="tagCode = 0">
        {{ schoolName }}
      </p>
      <p :class="[tagCode == 1 ? 'course-type-tag' : 'course-type-tag-idle']" @click="tagCode = 1">
        通识课程</p>
      <p :class="[tagCode == 2 ? 'course-type-tag' : 'course-type-tag-idle']" @click="tagCode = 2">
        收藏夹</p>
      <div id="tag-active-mark" :style="{ gridColumnStart: schoolName ? tagCode + 1 : tagCode }"></div>
    </div>
    <button @click="configing = true" :title="needUpdateVersion ? '有新版本' : '设置'"
    :class="needUpdateVersion ? 'new-version' : ''">
      <IconSetting/>
    </button>
  </nav>
  <ConfigPage v-if="configing" :config="{ university: universityName, school: schoolName }" @configured="configured" />
  <div id="sidebar">
    <input v-model="coursesFilter" placeholder="搜索课程名称"></input>
    <div id="courses-list">
      <div v-for="course in filteredCoursesList" @click="courseSelected = course"
      :class="['course-banner', courseSelected == course ? 'seleced-course-banner' : '']">
        <p>{{ course.name }}</p>
        <button class="favorite-toggle" @click.stop="favoriteToggle(course)">
          <IconStar :style="{fill: favoriteList.some(item => item.url == course.url) ? '#ffd500' : 'var(--color-shadow-2)'}"/>
        </button>
      </div>
      <p v-show="coursesFilter && filteredCoursesList.length == 0" class="hint-text">如果没输错那就是该课程资料还没被收录哦～</p>
    </div>
  </div>
  <CourseResource v-if="courseSelected" :course="courseSelected" />
</template>

<style>
#app-message {
  position: relative;
  background-color: var(--color-theme-1);
  border-radius: 1mm;
  border: 1px solid white;
  font-size: 3.6mm;
  padding: 2mm 3mm;
  top: 3mm;
  margin: 0px auto;
  justify-self: center;
  justify-items: center;
  width: auto;
  max-width: 10cm;
  filter: drop-shadow(0px, 0px, 4px, var(--color-shadow-2));
  z-index: 3;
}

.v-enter-active,
.v-leave-active {
  transition: all 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

nav>button {
  grid-column: -1 / -2;
}

.new-version::after {
  position: absolute;
  top: 1.5mm;
  right: 2.5mm;
  content: '●';
  color: rgb(255, 88, 88);
  font-size: 9px;
}

#tags-container {
  display: grid;
  grid-template-columns: auto auto auto;
  grid-template-rows: auto 1mm;
  gap: 1mm 5mm;
  padding-top: 1mm;
  justify-items: center;
}

#tags-container>p {
  cursor: pointer;
  user-select: none;
}

#tag-active-mark {
  border-radius: 0.5mm;
  height: 1mm;
  width: 70%;
  background-color: var(--color-theme-5);
}

.course-type-tag {
  color: var(--color-font-1);
  font-weight: bold;
  transition: opacity 0.3s;
}

.course-type-tag-idle {
  color: var(--color-font-4);
  font-weight: normal;
  opacity: 0.6;
}

.course-type-tag-idle:hover {
  opacity: 1;
}

#sidebar {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  border-right: 1px solid var(--color-theme-4);
  padding-bottom: 3mm;
  overflow: hidden;
}

#sidebar>input {
  margin: 2mm 3mm 0mm 3mm;
}

#courses-list {
  overflow: hidden auto;
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: 1.5cm;
  gap: 2mm;
  padding: 2mm 2mm 5mm 3mm;
  border-radius: 1mm;
}

.course-banner {
  display: grid;
  grid-template-columns: 1fr auto;
  background-color: var(--color-theme-2);
  border: 1px solid transparent;
  color: var(--color-font-4);
  border-radius: 1mm;
  padding: 2mm;
  cursor: pointer;
  transition: 0.3s;
  will-change: filter;
}

.course-banner:hover {
  filter: drop-shadow(0px 0px 4px var(--color-shadow-2));
}

.seleced-course-banner,
.course-banner:active {
  background-color: var(--color-theme-1);
  border: 1px solid white;
  color: var(--color-font-1);
  font-weight: bold;
}

.favorite-toggle {
  align-self: center;
}

.favorite-toggle:hover {
  background-color: transparent;
}

.favorite-toggle:hover > svg {
  opacity: 1;
}

.favorite-toggle > svg {
  stroke-opacity: 0;
  opacity: 0.5;
}
</style>