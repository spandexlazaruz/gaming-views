import 'expo-router/entry';
import { Platform } from 'react-native';
import { registerAndroidWidgetTaskHandler } from './widgets/android/taskHandler';

// react-native-android-widget requires its task handler to be registered
// at the app's actual entry point, not inside any component tree - this is
// what the OS invokes directly on its own update timer, with no app UI
// running at all. Expo Router's own entry (expo-router/entry, this app's
// previous `main`) still has to run first; this file just wraps it. See
// https://saleksovski.github.io/react-native-android-widget/docs/tutorial/register-widget-expo
if (Platform.OS === 'android') {
  registerAndroidWidgetTaskHandler();
}
