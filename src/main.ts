import { createApp } from "vue";
import App from "./App.vue";
import { loadJSON } from "./scripts/Files";


async function init() {
    const CONFIG: { [key: string]: any } = await loadJSON('config.json', {
        university: '',
        school: ''
    });

    const UNIVERSITIES: { [key: string]: string }[] = await loadJSON('universities.json', {});

    const app = createApp(App, {...CONFIG});
    app.provide('universities', UNIVERSITIES);
    app.mount("#app");
}

init();
