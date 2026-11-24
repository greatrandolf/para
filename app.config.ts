import fs from 'node:fs';
import path from 'node:path';

import plist from '@expo/plist';
import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json with the Firebase files for the build's environment:
 *   configuration/google-services/<APP_ENV>/ios/GoogleService-Info.plist
 *   configuration/google-services/<APP_ENV>/android/google-services.json
 * APP_ENV defaults to "staging". Google sign-in reads its client IDs from these files, so they must be downloaded
 * again after turning on the Google provider (and adding the Android SHA-1 fingerprints) in Firebase.
 * See para-backend/docs/deployment.md, "Google sign-in for commuters".
 */

const APP_ENV = process.env.APP_ENV ?? 'staging';

type GoogleFiles = {
  iosFile?: string;
  androidFile?: string;
  /** OAuth client of the iOS app (plist CLIENT_ID); present once Google sign-in is enabled. */
  iosClientId?: string;
  /** The project's web OAuth client (client_type 3); Google returns ID tokens for it. */
  webClientId?: string;
  /** The Android app's API key (auto-created by Firebase); also serves Google Maps once that API is allowed. */
  androidApiKey?: string;
};

function readGoogleFiles(env: string): GoogleFiles {
  const dir = path.join(__dirname, 'configuration', 'google-services', env);
  const iosFile = path.join(dir, 'ios', 'GoogleService-Info.plist');
  const androidFile = path.join(dir, 'android', 'google-services.json');
  const out: GoogleFiles = {};

  if (fs.existsSync(iosFile)) {
    out.iosFile = `./${path.relative(__dirname, iosFile)}`;
    const info = plist.parse(fs.readFileSync(iosFile, 'utf8')) as { CLIENT_ID?: string };
    out.iosClientId = info.CLIENT_ID;
  }
  if (fs.existsSync(androidFile)) {
    out.androidFile = `./${path.relative(__dirname, androidFile)}`;
    type OAuthClient = { client_id: string; client_type: number };
    const json = JSON.parse(fs.readFileSync(androidFile, 'utf8')) as {
      client: {
        client_info?: { android_client_info?: { package_name?: string } };
        api_key?: { current_key: string }[];
        oauth_client?: OAuthClient[];
        services?: { appinvite_service?: { other_platform_oauth_client?: OAuthClient[] } };
      }[];
    };
    const clients = json.client.flatMap((c) => [
      ...(c.oauth_client ?? []),
      ...(c.services?.appinvite_service?.other_platform_oauth_client ?? []),
    ]);
    out.webClientId = clients.find((c) => c.client_type === 3)?.client_id;
    const app = json.client.find((c) => c.client_info?.android_client_info?.package_name === 'ph.para.app');
    out.androidApiKey = app?.api_key?.[0]?.current_key;
  }
  return out;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const google = readGoogleFiles(APP_ENV);
  // Google Maps SDK for Android key (the Live Map): GOOGLE_MAPS_ANDROID_API_KEY, else the Android app's key from
  // google-services.json (Maps SDK for Android must be enabled and allowed on it). Without any key the app shows a
  // notice instead of the map. iOS uses Apple Maps and needs no key. See para-backend/docs/deployment.md.
  const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? google.androidApiKey;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? google.iosClientId;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? google.webClientId;

  const plugins = [...(config.plugins ?? [])];
  if (google.iosClientId) {
    // Firebase mode: the plugin takes the iOS URL scheme (REVERSED_CLIENT_ID) from GoogleService-Info.plist.
    plugins.push('@react-native-google-signin/google-signin');
  } else if (iosClientId) {
    // No complete plist: build the URL scheme from the client ID given in the environment.
    const iosUrlScheme = `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  return {
    ...config,
    name: config.name ?? 'para',
    slug: config.slug ?? 'para',
    plugins,
    ios: { ...config.ios, ...(google.iosFile ? { googleServicesFile: google.iosFile } : {}) },
    android: {
      ...config.android,
      ...(google.androidFile ? { googleServicesFile: google.androidFile } : {}),
      ...(androidMapsKey ? { config: { ...config.android?.config, googleMaps: { apiKey: androidMapsKey } } } : {}),
    },
    extra: {
      ...config.extra,
      appEnv: APP_ENV,
      // Read by src/services/maps.ts; the key itself goes only into the Android manifest.
      androidMapsKey: !!androidMapsKey,
      // Read by src/services/googleSignIn.ts. Client IDs are public identifiers, not secrets.
      google: { ...(webClientId ? { webClientId } : {}), ...(iosClientId ? { iosClientId } : {}) },
    },
  };
};
