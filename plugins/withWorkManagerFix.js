const { withProjectBuildGradle } = require('expo/config-plugins');

// FIXED (Android dev build failure, home-screen widgets): react-native-
// android-widget's own android/build.gradle pins androidx.work:work-
// runtime:2.8.1 directly, but something else in the dependency graph
// transitively resolves androidx.work:work-runtime-ktx:2.7.1 (a real
// build log confirmed this - no build.gradle in node_modules names
// work-runtime-ktx directly, so it's coming from a third dependency's own
// POM, not something this project declares itself). Two different
// versions of the same AndroidX library on the classpath means two
// copies of the same generated Kotlin extension classes
// (OneTimeWorkRequestKt, PeriodicWorkRequestKt), which Android's
// :app:checkDebugDuplicateClasses task correctly refuses to package -
// confirmed via the real EAS build log, not guessed from the generic
// "Gradle build failed with unknown error" summary alone.
// Forcing both artifacts to the same version (2.8.1, already what
// react-native-android-widget itself wants) across every module is the
// standard fix for this well-known AndroidX version-conflict class of
// error, applied here via a config plugin since this project has no
// checked-in android/ folder to edit directly - CNG regenerates it on
// every prebuild/EAS build.
module.exports = function withWorkManagerFix(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const forceBlock = `    configurations.all {
        resolutionStrategy {
            force 'androidx.work:work-runtime:2.8.1'
            force 'androidx.work:work-runtime-ktx:2.8.1'
        }
    }
`;
      if (!config.modResults.contents.includes("force 'androidx.work:work-runtime")) {
        config.modResults.contents = config.modResults.contents.replace(
          /allprojects\s*\{/,
          `allprojects {\n${forceBlock}`
        );
      }
    }
    return config;
  });
};
