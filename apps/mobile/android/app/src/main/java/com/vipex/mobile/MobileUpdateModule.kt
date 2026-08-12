package com.vipex.mobile

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import android.widget.Toast
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import java.io.File
import java.security.MessageDigest

class MobileUpdateModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
  private var pendingDownloadId: Long? = null
  private var pendingApk: File? = null
  private var pendingSha256: String? = null
  private var receiverRegistered = false

  private val downloadReceiver = object : BroadcastReceiver() {
    override fun onReceive(receiverContext: Context, intent: Intent) {
      val completedId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
      if (completedId != pendingDownloadId) return

      val manager = receiverContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
      val query = DownloadManager.Query().setFilterById(completedId)
      manager.query(query).use { cursor ->
        if (!cursor.moveToFirst()) return
        val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
        if (status == DownloadManager.STATUS_SUCCESSFUL) {
          val apk = pendingApk
          if (apk != null && sha256(apk).equals(pendingSha256, ignoreCase = true)) {
            launchInstaller(apk)
          } else {
            apk?.delete()
            Toast.makeText(receiverContext, "Vipex update verification failed.", Toast.LENGTH_LONG)
                .show()
          }
        } else {
          Toast.makeText(receiverContext, "Vipex update download failed.", Toast.LENGTH_LONG).show()
        }
      }

      pendingDownloadId = null
      pendingApk = null
      pendingSha256 = null
    }
  }

  override fun getName() = NAME

  @ReactMethod
  fun getInstalledInfo(promise: Promise) {
    val info = context.packageManager.getPackageInfo(context.packageName, 0)
    val result = WritableNativeMap().apply {
      putString("version", info.versionName ?: "0.0.0")
      putDouble(
          "versionCode",
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) info.longVersionCode.toDouble()
          else @Suppress("DEPRECATION") info.versionCode.toDouble(),
      )
    }
    promise.resolve(result)
  }

  @ReactMethod
  fun canInstallPackages(promise: Promise) {
    val allowed =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
            context.packageManager.canRequestPackageInstalls()
    promise.resolve(allowed)
  }

  @ReactMethod
  fun openInstallPermission(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(null)
      return
    }

    try {
      val intent = Intent(
          Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
          Uri.parse("package:${context.packageName}"),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("UPDATE_SETTINGS_FAILED", error)
    }
  }

  @ReactMethod
  fun downloadAndInstall(
      downloadUrl: String,
      fileName: String,
      expectedSha256: String,
      promise: Promise,
  ) {
    if (!downloadUrl.startsWith("https://")) {
      promise.reject("UPDATE_URL_INVALID", "The update URL must use HTTPS.")
      return
    }
    if (fileName != APK_FILE_NAME) {
      promise.reject("UPDATE_FILE_INVALID", "Unexpected Android update file name.")
      return
    }
    if (!expectedSha256.matches(Regex("^[a-fA-F0-9]{64}$"))) {
      promise.reject("UPDATE_HASH_INVALID", "The update checksum is invalid.")
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
        !context.packageManager.canRequestPackageInstalls()) {
      promise.reject("UPDATE_INSTALL_PERMISSION_REQUIRED", "Allow Vipex to install app updates.")
      return
    }
    if (pendingDownloadId != null) {
      promise.resolve(pendingDownloadId!!.toDouble())
      return
    }

    try {
      val updateDirectory = File(
          context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
          "updates",
      ).apply { mkdirs() }
      val apk = File(updateDirectory, fileName)
      if (apk.exists()) apk.delete()

      registerDownloadReceiver()
      val request = DownloadManager.Request(Uri.parse(downloadUrl))
          .setTitle("Vipex Mobile update")
          .setDescription("Downloading the latest Vipex Mobile release")
          .setMimeType(APK_MIME_TYPE)
          .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
          .setAllowedOverMetered(true)
          .setAllowedOverRoaming(false)
          .setDestinationInExternalFilesDir(
              context,
              Environment.DIRECTORY_DOWNLOADS,
              "updates/$fileName",
          )

      val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
      pendingApk = apk
      pendingSha256 = expectedSha256
      pendingDownloadId = manager.enqueue(request)
      promise.resolve(pendingDownloadId!!.toDouble())
    } catch (error: Exception) {
      pendingDownloadId = null
      pendingApk = null
      pendingSha256 = null
      promise.reject("UPDATE_DOWNLOAD_FAILED", error)
    }
  }

  private fun registerDownloadReceiver() {
    if (receiverRegistered) return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(
          downloadReceiver,
          IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
          Context.RECEIVER_NOT_EXPORTED,
      )
    } else {
      @Suppress("DEPRECATION")
      context.registerReceiver(
          downloadReceiver,
          IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
      )
    }
    receiverRegistered = true
  }

  private fun launchInstaller(apk: File) {
    val apkUri = FileProvider.getUriForFile(context, "${context.packageName}.updates", apk)
    val intent = Intent(Intent.ACTION_VIEW).apply {
      setDataAndType(apkUri, APK_MIME_TYPE)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    context.startActivity(intent)
  }

  private fun sha256(file: File): String {
    val digest = MessageDigest.getInstance("SHA-256")
    file.inputStream().use { input ->
      val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
      while (true) {
        val count = input.read(buffer)
        if (count <= 0) break
        digest.update(buffer, 0, count)
      }
    }
    return digest.digest().joinToString("") { byte -> "%02x".format(byte) }
  }

  override fun invalidate() {
    if (receiverRegistered) context.unregisterReceiver(downloadReceiver)
    receiverRegistered = false
    super.invalidate()
  }

  companion object {
    const val NAME = "MobileUpdate"
    private const val APK_FILE_NAME = "vipex-mobile-android.apk"
    private const val APK_MIME_TYPE = "application/vnd.android.package-archive"
  }
}
