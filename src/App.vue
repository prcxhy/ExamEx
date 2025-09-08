<script setup lang="ts">
import { downloadDir } from '@tauri-apps/api/path'
import { computed, inject, onMounted, ref, watch } from "vue";
import { getCoursesMenu } from "./scripts/RepositoryAccess";
import CourseResource from "./CourseResource.vue";
import ConfigPage from "./ConfigPage.vue";
import IconSetting from "./assets/setting.svg?component";
const props = defineProps<{
  university: string;
  school: string;
}>();

var universityName = props.university;

const UNIVERSITIES = inject<{[ key: string ]: string}[]>('universities') || [];

const universityURL = ref(UNIVERSITIES.find(
  (uni) => uni.name == props.university
)?.repository || '');

const schoolName = ref(props.school);

const coursesList = ref();

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

const configing = ref(!props.school && !props.university);

const tagCode = ref(0);

watch(tagCode, newVal => {
  if (newVal == 0) {
    getCoursesMenu(universityURL.value, schoolName.value).then((courses) => {
      coursesList.value = courses;
      courseSelected.value = null;
    });
  } else {
    getCoursesMenu(universityURL.value, "通识课程").then((courses) => {
      coursesList.value = courses;
      courseSelected.value = null;
    });
  }
});

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
  )!.repository
  schoolName.value = newConfig.school;
  tagCode.value = 0;
}

const appMsg = ref('');

async function showMessage(msg: string) {
  appMsg.value = msg;
  setTimeout(() => appMsg.value = '', 5000);
}

onMounted(() => {
  if (props.school) {
    getCoursesMenu(universityURL.value, props.school).then((courses) => {
      coursesList.value = courses;
    });
  }
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
      <p :class="[tagCode == 0 ? 'course-type-tag' : 'course-type-tag-idle']" @click="tagCode = 0">{{
        schoolName }}</p>
      <p :class="[tagCode == 1 ? 'course-type-tag' : 'course-type-tag-idle']" @click="tagCode = 1">
        通识课程</p>
      <div id="tag-active-mark" :style="{ gridColumnStart: tagCode + 1 }"></div>
    </div>
    <button @click="configing = true" title="设置">
      <IconSetting />
    </button>
  </nav>
  <ConfigPage v-if="configing" :config="{ university: universityName, school: schoolName }" @configured="configured" />
  <div id="sidebar">
    <input v-model="coursesFilter" placeholder="搜索课程名称"></input>
    <div id="courses-list">
      <p v-for="course in filteredCoursesList"
        :class="['course-banner', courseSelected == course ? 'seleced-course-banner' : '']"
        @click="courseSelected = course">{{ course.name }}</p>
      <p v-show="coursesFilter && filteredCoursesList.length == 0" class="hint-text">如果没输错那就是该课程资料还没被收录哦～</p>
    </div>
  </div>
  <CourseResource v-if="courseSelected" :course="courseSelected" @downloading="showMessage('下载开始，请稍等')"
  @down-ok="async fileName => {
    let msg = `下载完成: 已将 ${fileName} 下载至 ${await downloadDir()}`;
    showMessage(msg);
  }" @down-err="showMessage('下载失败，请重试')"/>
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

#tags-container {
  display: grid;
  grid-template-columns: auto auto;
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

#confirm-button {
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

#confirm-button:disabled {
  opacity: 0.25;
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
</style>