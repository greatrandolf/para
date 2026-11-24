import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Linking, Modal } from 'react-native';

import { paraAdStore, type ParaAdRequest } from '@/services/paraAdPresenter';
import { ParaAdViewer } from '@packages/ui/ParaAdViewer';

/**
 * Draws the Para Ad the ad flow asked for (para-ads) as a full-screen photo viewer (black backdrop, status bar
 * hidden). For the first seconds there is no way out; then the close button appears, and closing (or Continue, or
 * Android's back button) gives the live view. Mounted once in the commuter tabs.
 */
export function ParaAdHost() {
  const request = useSyncExternalStore(paraAdStore.subscribe, paraAdStore.get, paraAdStore.get);
  return request ? <ParaAdShowing key={request.id} request={request} /> : null;
}

function ParaAdShowing({ request }: { request: ParaAdRequest }) {
  const { ad, minutes, finish } = request;
  const [secondsLeft, setSecondsLeft] = useState(ad.minSeconds);
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);
  const ready = secondsLeft <= 0;
  const done = () => finish('continue');
  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      // Android back: nothing during the countdown, then the same as closing.
      onRequestClose={() => {
        if (ready) done();
      }}>
      {/* A photo viewer: no status bar over the black backdrop (the app's status bar is dark-on-light only). */}
      <StatusBar hidden />
      <ParaAdViewer
        businessName={ad.businessName}
        headline={ad.headline}
        imageUrl={ad.imageUrl}
        ctaLabel={ad.ctaUrl ? (ad.ctaLabel ?? 'Learn more') : null}
        onCta={ad.ctaUrl ? () => void Linking.openURL(ad.ctaUrl as string).catch(() => undefined) : undefined}
        secondsLeft={secondsLeft}
        minutes={minutes}
        onContinue={done}
        onClose={done}
        testID="para-ad"
      />
    </Modal>
  );
}
