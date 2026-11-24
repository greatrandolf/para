/**
 * App-facing theme entry point. Tokens are defined once in
 * `packages/ui/src/theme/` (feature plan Q1) and re-exported here, together
 * with app-only constants (the font asset map and layout constants).
 */
import { HankenGrotesk_400Regular } from '@expo-google-fonts/hanken-grotesk/400Regular';
import { HankenGrotesk_500Medium } from '@expo-google-fonts/hanken-grotesk/500Medium';
import { HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk/600SemiBold';
import { HankenGrotesk_700Bold } from '@expo-google-fonts/hanken-grotesk/700Bold';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono/600SemiBold';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono/700Bold';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';

import { fonts } from '@packages/ui/theme';

export * from '@packages/ui/theme';

/** Map passed to `useFonts` in the root layout (11 faces). Keys match `fonts`. */
export const fontAssets = {
  [fonts.spaceMedium]: SpaceGrotesk_500Medium,
  [fonts.spaceSemiBold]: SpaceGrotesk_600SemiBold,
  [fonts.spaceBold]: SpaceGrotesk_700Bold,
  [fonts.hankenRegular]: HankenGrotesk_400Regular,
  [fonts.hankenMedium]: HankenGrotesk_500Medium,
  [fonts.hankenSemiBold]: HankenGrotesk_600SemiBold,
  [fonts.hankenBold]: HankenGrotesk_700Bold,
  [fonts.monoRegular]: JetBrainsMono_400Regular,
  [fonts.monoMedium]: JetBrainsMono_500Medium,
  [fonts.monoSemiBold]: JetBrainsMono_600SemiBold,
  [fonts.monoBold]: JetBrainsMono_700Bold,
};

export const layout = {
  /** Extra clearance below the last card, above the tab bar. */
  scrollBottomPadding: 32,
  /** Gap between top-level sections on a screen. */
  sectionGap: 16,
} as const;
