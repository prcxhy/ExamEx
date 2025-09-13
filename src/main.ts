import { createApp } from "vue";
import App from "./App.vue";
import { loadJSON } from "./scripts/Files";
import { checkUpdate } from "./scripts/RepositoryAccess";

const VERSION = "0.4.0";

async function init() {
    const CONFIG: { [key: string]: any } = await loadJSON('config.json', {
        university: '',
        school: ''
    });

    const UNIVERSITIES = (await loadJSON('universities.json', {}) as {[key: string]: string }[])
        .map(item => {
            let subStrings = item.repository.slice(8).split('/');
            subStrings[0] = 'api.github.com/repos';
            subStrings[3] = 'contents';
            subStrings.splice(4, 1);
            let api = ['https:/', ...subStrings].join('/');

            item.api = api;
            return item
        });

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