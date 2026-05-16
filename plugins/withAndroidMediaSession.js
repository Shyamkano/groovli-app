/**
 * withAndroidMediaSession.js
 * 
 * Expo Config Plugin for Android MediaSession Integration
 * Enables hardware media button control, lock screen player, and earbuds integration
 * 
 * Usage in app.json:
 * [
 *   './plugins/withAndroidMediaSession',
 *   {
 *     appName: 'Groovli'
 *   }
 * ]
 */

const {
  withAndroidManifest,
  withStringsXml,
  AndroidConfig,
} = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const withMediaSessionService = (config, props = {}) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Ensure application element exists
    if (!androidManifest.manifest.application) {
      androidManifest.manifest.application = [{}];
    }

    const application = androidManifest.manifest.application[0];

    // Add MediaSession service
    if (!application.service) {
      application.service = [];
    }

    const mediaSessionServiceExists = application.service.some(
      (service) =>
        service.$['android:name'] === 'com.groovli.services.MediaSessionService'
    );

    if (!mediaSessionServiceExists) {
      application.service.push({
        $: {
          'android:name': 'com.groovli.services.MediaSessionService',
          'android:enabled': 'true',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.media.browse.MediaBrowseService' } }],
          },
        ],
      });
    }

    // Add receiver for media button events
    if (!application.receiver) {
      application.receiver = [];
    }

    const mediaReceiverExists = application.receiver.some(
      (receiver) =>
        receiver.$['android:name'] === 'com.groovli.receivers.MediaButtonReceiver'
    );

    if (!mediaReceiverExists) {
      application.receiver.push({
        $: {
          'android:name': 'com.groovli.receivers.MediaButtonReceiver',
          'android:enabled': 'true',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.MEDIA_BUTTON' } },
              { $: { 'android:name': 'android.media.action.MEDIA_BUTTON' } },
            ],
          },
        ],
      });
    }

    return config;
  });
};

module.exports = withMediaSessionService;
