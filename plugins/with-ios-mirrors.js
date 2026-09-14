const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ENTERPRISE_REPOSITORY = 'https://maven.aliyun.com/repository/public';
const PODFILE_MIRROR_LINE = `ENV['ENTERPRISE_REPOSITORY'] ||= '${ENTERPRISE_REPOSITORY}'`;

function withIosMavenMirror(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
      let contents = await fs.promises.readFile(podfilePath, 'utf8');

      if (!contents.includes("ENV['ENTERPRISE_REPOSITORY']")) {
        contents = `${PODFILE_MIRROR_LINE}\n${contents}`;
        await fs.promises.writeFile(podfilePath, contents);
      }

      return modConfig;
    },
  ]);
}

module.exports = withIosMavenMirror;
