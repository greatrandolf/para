import { FREE_SHEET_COLLAPSED, minimizedSheetHeight, PAID_SHEET_COLLAPSED } from './styles';

// The minimized Live Map sheet stops just under the route list, whatever the screen or text size.
describe('minimizedSheetHeight', () => {
  it('uses the fixed heights until the route list is measured', () => {
    expect(minimizedSheetHeight(true, 0, 0)).toBe(PAID_SHEET_COLLAPSED);
    expect(minimizedSheetHeight(false, 0, 0, 44)).toBe(FREE_SHEET_COLLAPSED + 44);
  });

  it('grows with the route list (larger text, narrower screen)', () => {
    const small = minimizedSheetHeight(true, 120, 0);
    expect(small).toBe(20 + 120 + 8);
    expect(minimizedSheetHeight(true, 170, 0)).toBe(small + 50);
  });

  it('keeps the route list above the floating pay button without a pass', () => {
    expect(minimizedSheetHeight(false, 120, 60)).toBe(minimizedSheetHeight(true, 120, 0) + 60 + 16);
  });
});
