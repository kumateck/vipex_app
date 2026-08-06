declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    COMMUNICATION_WS_URL?: string;
    DISCORD_ERROR_WEBHOOK_URL?: string;
    LIVEKIT_URL?: string;
    LIVEKIT_WS_URL?: string;
    MINIO_URL?: string;
    S3_ENDPOINT?: string;
    APP_VERSION?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
