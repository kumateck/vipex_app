import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

function trigger(type: HapticFeedbackTypes) {
  try {
    ReactNativeHapticFeedback.trigger(type, options);
  } catch (error) {
    void error;
  }
}

export async function hapticSuccess() {
  trigger(HapticFeedbackTypes.notificationSuccess);
}

export async function hapticWarning() {
  trigger(HapticFeedbackTypes.notificationWarning);
}

export async function hapticError() {
  trigger(HapticFeedbackTypes.notificationError);
}

export async function hapticTap() {
  trigger(HapticFeedbackTypes.impactLight);
}
