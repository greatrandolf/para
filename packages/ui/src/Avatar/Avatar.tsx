import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { colors, type TypographyVariant } from '../theme';
import { styles, toneStyles, toneText } from './styles';

export type AvatarTone = keyof typeof toneStyles;

export type AvatarProps = {
  initials: string;
  size?: number;
  tone?: AvatarTone;
  verified?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const initialsVariant = (size: number): TypographyVariant =>
  size >= 56 ? 'headlineMd' : size >= 32 ? 'headlineSm' : 'bodySm';

/** Initials avatar on a token-coloured circle (no network images, plan D6; circle per Q11). */
export function Avatar({ initials, size = 36, tone = 'brand', verified, accessibilityLabel, testID, style }: AvatarProps) {
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `Avatar ${initials}`}
      style={[styles.wrap, style]}>
      <View style={[styles.circle, toneStyles[tone], { width: size, height: size }]}>
        <AppText variant={initialsVariant(size)} weight="bold" color={toneText[tone]}>
          {initials}
        </AppText>
      </View>
      {verified ? (
        <View style={styles.verified}>
          <Icon name="check" size={11} color={colors.onDark} />
        </View>
      ) : null}
    </View>
  );
}
