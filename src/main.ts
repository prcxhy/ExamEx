import { createApp } from "vue";
import App from "./App.vue";
import { loadJSON } from "./scripts/Files";
import { checkUpdate } from "./scripts/RepositoryAccess";

const VERSION = "0.3.0";

async function init() {
    const CONFIG: { [key: string]: any } = await loadJSON('config.json', {
        university: '',
        school: ''
    });

    const UNIVERSITIES: { [key: string]: string }[] = await loadJSON('universities.json', {});

    const LAST_VERSION = await checkUpdate();

    const app = createApp(App, {...CONFIG});
    app.provide('universities', UNIVERSITIES);
    app.provide('version', {
        current: VERSION,
        last: LAST_VERSION
    });
    app.mount("#app");
}

init();
