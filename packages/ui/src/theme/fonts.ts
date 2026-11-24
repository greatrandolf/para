/**
 * Font family names as registered by `useFonts` (the export names of the
 * `@expo-google-fonts/*` packages). Each weight is its own family, so text
 * styles never set `fontWeight` alongside a custom family.
 *
 * Roles (DESIGN.md v2): Space Grotesk for display and headlines, Hanken
 * Grotesk for body copy, JetBrains Mono for labels and telemetry.
 */
export const fonts = {
  spaceMedium: 'SpaceGrotesk_500Medium',
  spaceSemiBold: 'SpaceGrotesk_600SemiBold',
  spaceBold: 'SpaceGrotesk_700Bold',
  hankenRegular: 'HankenGrotesk_400Regular',
  hankenMedium: 'HankenGrotesk_500Medium',
  hankenSemiBold: 'HankenGrotesk_600SemiBold',
  hankenBold: 'HankenGrotesk_700Bold',
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export type FontFamily = (typeof fonts)[keyof typeof fonts];
