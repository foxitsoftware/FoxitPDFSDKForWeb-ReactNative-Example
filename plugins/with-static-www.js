const {
  IOSConfig,
  withAppBuildGradle,
  withDangerousMod,
  withXcodeProject,
} = require('expo/config-plugins');
const path = require('path');

const { WWW_DIR_NAME, syncWwwTree } = require('../scripts/sync-www');

function unquote(value) {
  return String(value ?? '').replace(/^"|"$/g, '');
}

function markWwwAsFolderReference(project) {
  const section = project.pbxFileReferenceSection();
  for (const key of Object.keys(section)) {
    const entry = section[key];
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const filePath = unquote(entry.path);
    if (path.basename(filePath) !== WWW_DIR_NAME) {
      continue;
    }

    entry.lastKnownFileType = 'folder';
    delete entry.fileEncoding;
    delete entry.explicitFileType;
  }
}

function withAndroidWww(config) {
  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const destination = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app/src/main/assets',
        WWW_DIR_NAME,
      );
      syncWwwTree(modConfig.modRequest.projectRoot, destination);
      return modConfig;
    },
  ]);

  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      return modConfig;
    }

    let contents = modConfig.modResults.contents;

    if (!contents.includes("noCompress += ['wasm'")) {
      contents = contents.replace(
        'androidResources {',
        `androidResources {
        noCompress += ['wasm', 'js', 'mjs', 'css', 'html', 'pdf', 'data', 'bin', 'brotli']`,
      );
    }

    if (!contents.includes('syncStaticWww')) {
      contents += `
tasks.register("syncStaticWww", Exec) {
    workingDir file(projectDir).parentFile.parentFile
    commandLine "node", "scripts/sync-www.js", "android"
}
preBuild.dependsOn syncStaticWww
`;
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });
}

function withIosWww(config) {
  return withXcodeProject(config, async (modConfig) => {
    const projectRoot = modConfig.modRequest.projectRoot;
    const sourceRoot = IOSConfig.Paths.getSourceRoot(projectRoot);
    const destination = path.join(sourceRoot, WWW_DIR_NAME);
    syncWwwTree(projectRoot, destination);

    const project = modConfig.modResults;
    const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
    const filepath = path.relative(modConfig.modRequest.platformProjectRoot, destination);

    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath,
      groupName: projectName,
      project,
      isBuildFile: true,
      verbose: true,
    });
    markWwwAsFolderReference(project);

    return modConfig;
  });
}

function withStaticWww(config) {
  config = withAndroidWww(config);
  config = withIosWww(config);
  return config;
}

module.exports = withStaticWww;
