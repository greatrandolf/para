import { Alert } from 'react-native';
import { act, fireEvent, renderRouter, screen, testRouter } from 'expo-router/testing-library';

import { commuterTabs, driverTabs } from '@/constants/navigation';

/** Renders the real route tree in `src/app`. */
const renderApp = (initialUrl = '/') => renderRouter('./src/app', { initialUrl });

const tabOrder = () => screen.getAllByTestId(/^tab-(?!indicator-dot)/).map((node) => node.props.testID as string);

const COMMUTER_SCREENS: Record<string, string> = {
  commute: 'screen-commute-hub',
  'live-map': 'screen-live-tracking',
  activity: 'screen-activity',
  wallet: 'screen-wallet',
  account: 'screen-account',
};

const DRIVER_SCREENS: Record<string, string> = {
  duty: 'screen-duty-hub',
  earnings: 'screen-earnings',
  radar: 'screen-radar',
  trips: 'screen-trips',
  profile: 'screen-driver-profile',
};

const session = jest.requireMock('@/hooks/useSession').mockSession as {
  status: string;
  pin: string;
  signIn: jest.Mock;
  signOutPhone: jest.Mock;
  lock: jest.Mock;
};

describe('navigation', () => {
  it('opens the commuter sign-in at /', async () => {
    session.status = 'signedOut';
    await renderApp();
    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('screen-sign-in')).toBeOnTheScreen();
    expect(screen.getByText('Para Live')).toBeOnTheScreen();
    expect(screen.getByTestId('sign-in-email')).toBeOnTheScreen();
    expect(screen.getByText('Activate driver account')).toBeOnTheScreen();
  });

  it('signs a commuter in and lands on /commute with the commuter tabs in order', async () => {
    session.status = 'signedOut';
    await renderApp();
    await act(async () => fireEvent.changeText(screen.getByTestId('sign-in-email'), 'juan@example.com'));
    await act(async () => fireEvent.changeText(screen.getByTestId('sign-in-password'), 'secret123'));
    session.signIn.mockImplementationOnce(async () => {
      session.status = 'commuter';
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('sign-in-submit'));
    });

    expect(session.signIn).toHaveBeenCalledWith('juan@example.com', 'secret123');
    expect(screen).toHavePathname('/commute');
    expect(screen.getByTestId('screen-commute-hub')).toBeOnTheScreen();
    expect(tabOrder()).toEqual(commuterTabs.map((tab) => `tab-${tab.name}`));
    for (const tab of commuterTabs) expect(screen.getByText(tab.title)).toBeOnTheScreen();
    expect(screen.getByTestId('tab-commute')).toBeSelected();
    expect(testRouter.canGoBack()).toBe(false);
  });

  it('opens driver activation from the sign-in link', async () => {
    session.status = 'signedOut';
    await renderApp();
    await fireEvent.press(screen.getByTestId('activate-driver-link'));
    expect(screen).toHavePathname('/activate');
    expect(screen.getByTestId('screen-activate')).toBeOnTheScreen();
  });

  it('opens the PIN screen for an activated driver instead of sign-in', async () => {
    session.pin = 'locked';
    await renderApp();
    expect(screen).toHavePathname('/pin');
    expect(screen.getByTestId('screen-pin')).toBeOnTheScreen();
  });

  it('keeps signed-out users out of the commuter and driver tabs', async () => {
    session.status = 'signedOut';
    await renderApp('/wallet');
    expect(screen).toHavePathname('/');
    await renderApp('/duty');
    expect(screen).toHavePathname('/activate');
  });

  it('lands an unlocked driver on /duty with the five driver tabs in order', async () => {
    await renderApp('/duty');
    expect(screen.getByTestId('screen-duty-hub')).toBeOnTheScreen();
    expect(tabOrder()).toEqual(driverTabs.map((tab) => `tab-${tab.name}`));
    for (const tab of driverTabs) expect(screen.getByText(tab.title)).toBeOnTheScreen();
    expect(screen.getByTestId('tab-duty')).toBeSelected();
  });

  it('switches every commuter tab', async () => {
    session.status = 'commuter';
    await renderApp('/commute');
    for (const tab of commuterTabs) {
      await fireEvent.press(screen.getByTestId(`tab-${tab.name}`));
      expect(screen).toHavePathname(`/${tab.name}`);
      expect(screen.getByTestId(COMMUTER_SCREENS[tab.name])).toBeOnTheScreen();
      expect(screen.getByTestId(`tab-${tab.name}`)).toBeSelected();
    }
  });

  it('switches every driver tab', async () => {
    await renderApp('/duty');
    for (const tab of driverTabs) {
      await fireEvent.press(screen.getByTestId(`tab-${tab.name}`));
      expect(screen).toHavePathname(`/${tab.name}`);
      expect(screen.getByTestId(DRIVER_SCREENS[tab.name])).toBeOnTheScreen();
    }
  });

  it('confirms a live view from the hub and lands on the Live Map tab', async () => {
    session.status = 'commuter';
    await renderApp('/commute');
    await fireEvent.press(screen.getByTestId('view-live-17B'));
    await fireEvent.press(screen.getByTestId('confirm-track'));
    expect(screen).toHavePathname('/live-map');

    await fireEvent.press(screen.getByTestId('back-to-hub'));
    expect(screen).toHavePathname('/commute');
  });

  it('opens Earnings from View Pot on the radar', async () => {
    await renderApp('/radar');
    await fireEvent.press(screen.getByTestId('view-pot'));
    expect(screen).toHavePathname('/earnings');
  });

  it('signs a commuter out from Account', async () => {
    session.status = 'commuter';
    session.signOutPhone.mockImplementationOnce(async () => {
      session.status = 'signedOut';
    });
    await renderApp('/account');
    await act(async () => {
      fireEvent.press(screen.getByTestId('sign-out'));
    });

    expect(session.signOutPhone).toHaveBeenCalled();
    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('screen-sign-in')).toBeOnTheScreen();
  });

  it('locks the driver app at End Shift', async () => {
    session.lock.mockImplementationOnce(() => {
      session.pin = 'locked';
    });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await renderApp('/profile');
    await act(async () => {
      fireEvent.press(screen.getByTestId('end-shift'));
    });
    await act(async () => {
      alert.mock.calls[0][2]?.find((b) => b.text === 'End Shift')?.onPress?.();
    });
    alert.mockRestore();

    expect(jest.requireMock('@/hooks/useDuty').mockDuty.endShift).toHaveBeenCalled();
    expect(session.lock).toHaveBeenCalled();
    expect(screen).toHavePathname('/pin');
  });
});
