export type AndroidMobileUpdate = {
  version: string;
  versionCode: number;
  fileName: 'vipex-mobile-android.apk';
  releaseNotes: string;
  publishedAt: string;
  sha256: string;
  downloadUrl: string;
};

export type InstalledMobileVersion = {
  version: string;
  versionCode: number;
};
