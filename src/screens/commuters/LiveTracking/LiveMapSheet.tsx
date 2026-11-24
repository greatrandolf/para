import type { ReactNode } from 'react';

import { BottomSheet } from '@packages/ui/BottomSheet';

import { FREE_SHEET_SNAP_POINTS, PAID_SHEET_SNAP_POINTS } from './styles';

type Props = {
  /** With a pass the sheet holds the route cards and drags up over most of the map. */
  paid: boolean;
  /** Minimized height: just under the route list (measured on the phone, see `minimizedSheetHeight`). */
  collapsed: number;
  children: ReactNode;
};

/**
 * The Live Map's route list (live-map-bottom-sheet): a draggable sheet over the map, collapsed on the first routes.
 * The tab bar is below it, so it adds no home-indicator padding.
 */
export function LiveMapSheet({ paid, collapsed, children }: Props) {
  return (
    <BottomSheet
      snapPoints={[collapsed, (paid ? PAID_SHEET_SNAP_POINTS : FREE_SHEET_SNAP_POINTS)[1]]}
      safeAreaBottom={false}
      handleLabel="Routes on your way, drag to resize"
      testID="live-map-sheet">
      {children}
    </BottomSheet>
  );
}
