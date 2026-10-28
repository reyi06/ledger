const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Windows MAX_PATH workaround for the Android native build.
 *
 * AGP stages autolinked codegen under `android/app/.cxx`, and with this
 * dependency tree that path reaches 268 characters. CMake flattens the source
 * path into the object directory, Windows caps at 260, and ninja fails with
 * `mkdir(...): No such file or directory`. Moving the staging directory to
 * `C:/b` brings it down to 242.
 *
 * This has to be a config plugin rather than a hand-edit, because `android/` is
 * generated: `expo prebuild --clean` rewrites `build.gradle` from scratch and
 * silently deletes the workaround. That cost a failed build to rediscover twice.
 *
 * Note the placement. `buildStagingDirectory` is a property of the **cmake**
 * block, not of the `android` extension — setting it on the extension fails with
 * "Could not set unknown property 'buildStagingDirectory'". The generated file
 * has no `externalNativeBuild` block of its own, so the whole block is inserted.
 *
 * `C:/b` must exist as a writable directory; Gradle creates it if it does not.
 */
const STAGING_DIRECTORY = 'C:/b';

const MARKER = 'buildStagingDirectory';

const BLOCK = [
  'android {',
  '    externalNativeBuild {',
  '        cmake {',
  `            buildStagingDirectory = file("${STAGING_DIRECTORY}")`,
  '        }',
  '    }',
].join('\n');

module.exports = function withAndroidBuildStaging(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      throw new Error(
        'withAndroidBuildStaging only supports the Groovy build.gradle that prebuild generates.',
      );
    }

    const { contents } = gradleConfig.modResults;

    // Idempotent: prebuild regenerates the file each run, but a build that runs
    // the plugin twice (or against an already-patched tree) must not double up.
    if (contents.includes(MARKER)) return gradleConfig;

    if (!/^android\s*\{/m.test(contents)) {
      throw new Error(
        'withAndroidBuildStaging could not find the `android {` block to extend.',
      );
    }

    gradleConfig.modResults.contents = contents.replace(/^android\s*\{/m, BLOCK);

    return gradleConfig;
  });
};
