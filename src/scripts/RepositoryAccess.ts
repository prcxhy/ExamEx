import { BaseDirectory, writeFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { Ref } from 'vue';

async function getDirList(url: string) {
  const response = await fetch(url, {
    method: 'GET',
  });
  console.log(`仓库文件目录 ${url}, 获取状态: ${response.statusText}`);
  let result = await response.json();
  if (Array.isArray(result)) {
    return result;
  } else {
    return [];
  }
}

async function getMajorsMenu(universityURL: string) {
  if (!universityURL) {
    return [];
  }
  let result = await getDirList(universityURL);
  return result.filter(item => {
    return item.type == 'dir' && item.name !== '通识课程' && item.name !== 'images';
  });
}

function decodeBase64(base64Str: string): string {
  // 1. 将Base64字符串解码为二进制数据
  const binaryStr = atob(base64Str);

  // 2. 将二进制字符串转换为UTF-8编码的字符串
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

async function getMarkdownContent(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  let result = await response.json();
  console.log(`获取课程资源md内容 ${url}, 获取状态: ${response.statusText}`);
  return decodeBase64(result.content);
}

async function getCoursesMenu(universityURL: string, schoolName: string) {
  if (!universityURL || !schoolName) {
    return [];
  }

  let repoURL = universityURL.endsWith('/') ? universityURL : universityURL + '/';
  let content = await getMarkdownContent(`${repoURL + schoolName}/index.md`);

  let coursesMenu = content.split('* [').flatMap(slice => {
    if (slice.includes('](')) {
      let nameAndLink = slice.split('](./');
      let name = nameAndLink[0].trim();
      let fileName = nameAndLink[1].split('.md')[0];
      return [{
        name,
        url: `${repoURL + schoolName}/${fileName}.md`
      }];
    } else {
      return [];
    }
  })

  return coursesMenu;
}

async function downloadFile(url: string, fileName: string, progress: Ref<number, number>) {
  const response = await fetch(url, {
    method: 'GET',
  });
  const totalSize = parseInt(response.headers.get('Content-Length') || '0');
  let loadedBytes = 0;
  
  let reader = response.body?.getReader();
  let chunks = [];

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      };
      chunks.push(value);
      loadedBytes += value.length;
      progress.value = (loadedBytes / totalSize) * 100;
    }
    if (loadedBytes == totalSize) {
      const blob = new Blob(chunks); // 最终生成 Blob
      const arrayBuffer = await blob.arrayBuffer(); // 如果需要 ArrayBuffer
    
      await writeFile(fileName, new Uint8Array(arrayBuffer), { baseDir: BaseDirectory.Download });

      return 'ok';
    }
  }
  
  return 'err';
}

async function checkUpdate() {
  const response = await fetch('https://api.github.com/repos/prcxhy/ExamEx/releases', {
    method: 'GET',
  });

  let lastRelease = (await response.json())[0];
  let lastVersion = lastRelease.tag_name.split('v')[1];

  return lastVersion;
}

export { getDirList, getMajorsMenu, getCoursesMenu, getMarkdownContent, downloadFile, checkUpdate };