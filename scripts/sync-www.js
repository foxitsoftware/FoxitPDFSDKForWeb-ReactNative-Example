const fs = require('fs');
const path = require('path');

const WWW_DIR_NAME = 'www';
const RM_OPTIONS = { recursive: true, force: true, maxRetries: 8, retryDelay: 100 };

function removeDir(target) {
  if (!fs.existsSync(target)) {
    return;
  }

  // 先改名，让目标路径立刻空出来，避免删除过程中被重新写入文件。
  const trash = `${target.replace(/[/\\]+$/, '')}.${process.pid}-${Date.now()}.trash`;
  try {
    fs.renameSync(target, trash);
  } catch {
    fs.rmSync(target, RM_OPTIONS);
    return;
  }

  try {
    fs.rmSync(trash, RM_OPTIONS);
  } catch (error) {
    if (!fs.existsSync(target)) {
      console.warn(`未能完全删除临时目录，可手动删除: ${trash}`);
      return;
    }
    throw error;
  }
}

function syncWwwTree(projectRoot, destinationWww) {
  const sourceWww = path.join(projectRoot, 'assets', WWW_DIR_NAME);
  if (!fs.existsSync(sourceWww)) {
    throw new Error(`未找到静态站点目录: ${sourceWww}`);
  }

  removeDir(destinationWww);
  fs.cpSync(sourceWww, destinationWww, {
    recursive: true,
    filter: (source) => path.basename(source) !== '.DS_Store',
  });

  return destinationWww;
}

function destinationFor(projectRoot, target) {
  if (target === 'android') {
    return path.join(projectRoot, 'android/app/src/main/assets', WWW_DIR_NAME);
  }
  if (target === 'ios') {
    return path.join(projectRoot, 'ios/rnexpodemo', WWW_DIR_NAME);
  }
  throw new Error('Usage: node scripts/sync-www.js android|ios');
}

module.exports = {
  WWW_DIR_NAME,
  syncWwwTree,
};

if (require.main === module) {
  const projectRoot = path.join(__dirname, '..');
  const destinationWww = syncWwwTree(projectRoot, destinationFor(projectRoot, process.argv[2]));
  console.log(`www synced: ${destinationWww}`);
}
