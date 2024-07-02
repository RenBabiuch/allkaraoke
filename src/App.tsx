import { ErrorBoundary, withProfiler } from '@sentry/react';
import { KeyboardHelpProvider } from 'routes/KeyboardHelp/Context';
import RemoteMic from 'routes/RemoteMic/RemoteMic';
import Settings from 'routes/Settings/Settings';
import { Route, Router, Switch } from 'wouter';
import Convert from './routes/Convert/Convert';
import Edit from './routes/Edit/Edit';
import Jukebox from './routes/Jukebox/Jukebox';
import SelectInput from './routes/SelectInput/SelectInput';

import { Theme, ThemeProvider, createTheme } from '@mui/material/styles';
import { ErrorFallback } from 'modules/Elements/ErrorFallback';
import LayoutWithBackgroundProvider from 'modules/Elements/LayoutWithBackground';
import PageLoader from 'modules/Elements/PageLoader';
import { Suspense, lazy, useMemo } from 'react';
import GetSongsBPMs from 'routes/Edit/GetSongsBPMs';
import ExcludeLanguages from 'routes/ExcludeLanguages/ExcludeLanguages';
import Game from 'routes/Game/Game';
import LandingPage from 'routes/LandingPage/LandingPage';
import ManageSongs from 'routes/ManageSongs/ManageSongs';
import QuickSetup from 'routes/QuickSetup/QuickSetup';
import RemoteMicSettings from 'routes/Settings/RemoteMicSettings';
import { GraphicSetting, MobilePhoneModeSetting, useSettingValue } from 'routes/Settings/SettingsState';
import SocialMediaElements from 'routes/SocialMediaElements/SocialMediaElements';
import Welcome from 'routes/Welcome/Welcome';
import routePaths from 'routes/routePaths';

const LazySongList = lazy(() =>
  import('routes/ManageSongs/SongManagement').then((modules) => ({ default: modules.SongList })),
);

// Commenting this out as there are many failed to fetch errors coming from Googlebot
// // This is a hack to preload the game scene so that it's ready when the user clicks on the game button
// // without increasing initial load time. Vite doesn't support prefetch yet
// // https://github.com/vitejs/vite/issues/10600
// const prefetchGame = import('./routes/Game/Game');
// const LazyGame = lazy(() => prefetchGame);

function App() {
  const [mobilePhoneMode] = useSettingValue(MobilePhoneModeSetting);
  const [graphicSetting] = useSettingValue(GraphicSetting);

  const theme = useMemo<Theme>(
    () =>
      createTheme({
        graphicSetting,
      }),
    [graphicSetting],
  );

  return (
    <ThemeProvider theme={theme}>
      <style>
        {`
          :root {
             ${graphicSetting === 'low' ? '--graphic-setting-high: initial' : ''};
            ${graphicSetting === 'high' ? '--graphic-setting-low: initial' : ''};
            --zoom-multipler: ${mobilePhoneMode ? 1.4 : 1};
          }
        `}
      </style>
      <ErrorBoundary fallback={ErrorFallback}>
        <LayoutWithBackgroundProvider>
          <KeyboardHelpProvider>
            <Router base={import.meta.env.BASE_URL}>
              <Switch>
                <Route path={routePaths.QUICK_SETUP} component={QuickSetup} />
                <Route path={routePaths.MENU} component={Welcome} />
                <Route path={routePaths.EXCLUDE_LANGUAGES} component={ExcludeLanguages} />
                <Route path={routePaths.JUKEBOX} component={Jukebox} />
                <Route path={routePaths.GAME}>
                  {/*<Suspense fallback={<PageLoader />}><LazyGame /></Suspense>*/}
                  <Game />
                </Route>
                <Route path={routePaths.SELECT_INPUT} component={SelectInput} />
                <Route path={routePaths.SETTINGS} component={Settings} />
                <Route path={routePaths.SETTINGS_REMOTE_MICS} component={RemoteMicSettings} />
                <Route path={routePaths.REMOTE_MIC} component={RemoteMic} />
                <Route path={routePaths.MANAGE_SONGS} component={ManageSongs} />
                <Route path="social-media-elements" component={SocialMediaElements} />
                <Route path={routePaths.CONVERT} component={() => <Convert />} />
                <Route
                  path={routePaths.EDIT_SONGS_LIST}
                  component={() => (
                    <Suspense fallback={<PageLoader />}>
                      <LazySongList />
                    </Suspense>
                  )}
                />
                <Route path="edit/get-songs-bpms" component={GetSongsBPMs} />
                <Route path={routePaths.EDIT_SONG}>
                  <Edit />
                </Route>
                <Route path={routePaths.INDEX} component={LandingPage} />
              </Switch>
            </Router>
          </KeyboardHelpProvider>
        </LayoutWithBackgroundProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default withProfiler(App);
