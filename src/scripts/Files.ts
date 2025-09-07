import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

async function loadJSON(fileName: string, init: { [key: string]: any }) {
    return readTextFile(fileName, { baseDir: BaseDirectory.Resource })
        .then(content => {
            return JSON.parse(content)
        }).catch(() => {
            return init
        })
}

async function saveJSON(filePath: string, content: { [key: string]: any }) {
    await writeTextFile(filePath, JSON.stringify(content, null, 2), { baseDir: BaseDirectory.Resource });
}

export { loadJSON, saveJSON };