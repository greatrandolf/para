import GorhomBottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '../theme';
import { styles } from './styles';

export type BottomSheetProps = {
  children?: ReactNode;
  /** Heights the sheet rests at, smallest first: points (300) or a share of the screen ('85%'). */
  snapPoints: (number | `${number}%`)[];
  /** The snap point it opens at (default 0, the smallest). */
  index?: number;
  /** Called with the snap point index after the sheet settles (-1 when closed). */
  onChange?: (index: number) => void;
  /** Scroll the content when it is taller than the sheet (default true). */
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Pad the content for the home indicator (default true; off when a tab bar is already below the sheet). */
  safeAreaBottom?: boolean;
  /** Accessibility label of the drag handle. */
  handleLabel?: string;
  testID?: string;
};

/**
 * Draggable bottom sheet (`@gorhom/bottom-sheet`) in the app's tier-2 style: a white sheet with rounded top
 * corners and a 36×4 grey handle. It rests at fixed snap points and is not dismissed by dragging down.
 * Needs a `GestureHandlerRootView` above it (the root layout).
 */
export function BottomSheet({
  children,
  snapPoints,
  index = 0,
  onChange,
  scrollable = true,
  contentStyle,
  safeAreaBottom = true,
  handleLabel = 'Drag to resize',
  testID,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const padded = [styles.content, { paddingBottom: (safeAreaBottom ? insets.bottom : 0) + spacing.lg }, contentStyle];
  const Content = scrollable ? BottomSheetScrollView : BottomSheetView;
  return (
    <GorhomBottomSheet
      index={index}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      onChange={onChange}
      backgroundStyle={styles.background}
      handleStyle={styles.handle}
      handleIndicatorStyle={styles.handleBar}
      accessibilityLabel={handleLabel}>
      <Content>
        <View style={padded} testID={testID}>
          {children}
        </View>
      </Content>
    </GorhomBottomSheet>
  );
}
