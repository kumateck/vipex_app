import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { mobileSpacing } from '@mobile/theme/layout';
import { useLogin, useLoginEntranceMotion } from '../../hooks';
import { LoginBackground } from './login-background';
import { LoginFooter } from './login-footer';
import { LoginForm } from './login-form';
import { LoginHero } from './login-hero';

export function LoginScreen() {
  const login = useLogin();
  const { Animated, footerStyle, formStyle, heroStyle } = useLoginEntranceMotion();

  return (
    <AppScreen style={styles.screen}>
      <LoginBackground />
      <View style={styles.content}>
        <Animated.View style={heroStyle}>
          <LoginHero />
        </Animated.View>

        <Animated.View style={formStyle}>
          <LoginForm
            email={login.email}
            password={login.password}
            error={login.error}
            loading={login.loading}
            onEmailChange={login.handleEmailChange}
            onPasswordChange={login.handlePasswordChange}
            onSubmit={() => void login.handleLogin()}
          />
        </Animated.View>

        <Animated.View style={footerStyle}>
          <LoginFooter />
        </Animated.View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: mobileSpacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: mobileSpacing.xl,
    paddingVertical: mobileSpacing.lg,
  },
});
