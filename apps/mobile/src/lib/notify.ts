import { Alert, Platform, ToastAndroid } from 'react-native';

export function notifySuccess(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert('Success', message);
}

export function notifyError(title: string, message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(`${title}: ${message}`, ToastAndroid.SHORT);
    return;
  }
  Alert.alert(title, message);
}
