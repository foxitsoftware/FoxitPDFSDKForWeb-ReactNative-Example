const { withDangerousMod, withProjectBuildGradle } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const GRADLE_MIRROR =
  'https\\://mirrors.cloud.tencent.com/gradle/gradle-9.3.1-bin.zip';

const MAVEN_MIRRORS = `    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
    google()
    mavenCentral()`;

const SETTINGS_PLUGIN_REPOS = `  repositories {
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
    google()
    mavenCentral()
    gradlePluginPortal()
  }
`;

const SETTINGS_BEFORE_PROJECT = `
gradle.beforeProject { project ->
  project.buildscript.repositories {
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
  }
}
`;

function withGradleWrapperMirror(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const wrapperPath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'gradle/wrapper/gradle-wrapper.properties'
      );
      let contents = await fs.promises.readFile(wrapperPath, 'utf8');
      contents = contents.replace(/distributionUrl=.*/, `distributionUrl=${GRADLE_MIRROR}`);
      contents = contents.replace(/networkTimeout=.*/, 'networkTimeout=120000');
      await fs.promises.writeFile(wrapperPath, contents);
      return modConfig;
    },
  ]);
}

function withAndroidMavenMirrors(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      return modConfig;
    }

    if (modConfig.modResults.contents.includes('maven.aliyun.com/repository/google')) {
      return modConfig;
    }

    modConfig.modResults.contents = modConfig.modResults.contents.replaceAll(
      `    google()\n    mavenCentral()`,
      MAVEN_MIRRORS
    );
    return modConfig;
  });
}

function withSubprojectBuildscriptMirrors(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const settingsPath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'settings.gradle'
      );
      let contents = await fs.promises.readFile(settingsPath, 'utf8');

      if (!contents.includes("maven.aliyun.com/repository/google")) {
        contents = contents.replace(
          'pluginManagement {',
          `pluginManagement {\n${SETTINGS_PLUGIN_REPOS}`
        );
      }

      if (!contents.includes('gradle.beforeProject { project ->')) {
        contents += SETTINGS_BEFORE_PROJECT;
      }

      await fs.promises.writeFile(settingsPath, contents);
      return modConfig;
    },
  ]);
}

function withLibraryBuildscriptMirrors(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const webviewGradle = path.join(
        modConfig.modRequest.projectRoot,
        'node_modules/react-native-webview/android/build.gradle'
      );

      if (!fs.existsSync(webviewGradle)) {
        return modConfig;
      }

      let contents = await fs.promises.readFile(webviewGradle, 'utf8');
      if (contents.includes('maven.aliyun.com/repository/google')) {
        return modConfig;
      }

      contents = contents.replace(
        `    repositories {
        google()
        gradlePluginPortal()
    }`,
        `    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        google()
        gradlePluginPortal()
    }`
      );
      await fs.promises.writeFile(webviewGradle, contents);
      return modConfig;
    },
  ]);
}

function withAndroidMirrors(config) {
  config = withGradleWrapperMirror(config);
  config = withAndroidMavenMirrors(config);
  config = withSubprojectBuildscriptMirrors(config);
  config = withLibraryBuildscriptMirrors(config);
  return config;
}

module.exports = withAndroidMirrors;
