import type { ReactNode } from 'react';
import { ScrollView, type StyleProp, type ViewStyle } from 'react-native';

import { styles } from './styles';

export type ScreenScrollProps = {
  children?: ReactNode;
  testID?: string;
  contentStyle?: StyleProp<ViewStyle>;
  /** Children that stay pinned at the top while the rest scrolls under them. */
  stickyHeaderIndices?: number[];
};

/** Vertical screen scroller on the `canvas` background with standard margins and section gap. */
export function ScreenScroll({ children, testID, contentStyle, stickyHeaderIndices }: ScreenScrollProps) {
  return (
    <ScrollView
      testID={testID}
      style={styles.scroll}
      contentContainerStyle={[styles.content, contentStyle]}
      stickyHeaderIndices={stickyHeaderIndices}
      keyboardShouldPersistTaps="handled"
      indicatorStyle="black"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}
