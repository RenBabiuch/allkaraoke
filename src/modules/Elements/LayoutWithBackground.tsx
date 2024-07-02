import { css, cx } from '@linaria/core';
import { styled } from '@linaria/react';
import { colorSets } from 'modules/GameEngine/Drawing/styles';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { GraphicSetting, useSettingValue } from 'routes/Settings/SettingsState';
import eurovisionBg from './eurovisionbg.svg';

export type backgroundTheme = 'regular' | 'christmas' | 'eurovision';

export const BackgroundContext = createContext({
  visible: true,
  theme: 'regular' as backgroundTheme,
  setVisibility: (visible: boolean): void => undefined,
  setTheme: (theme: backgroundTheme): void => undefined,
});

export const useBackground = (shouldBeVisible: boolean, theme: backgroundTheme = 'regular') => {
  const { setVisibility, setTheme } = useContext(BackgroundContext);

  useEffect(() => {
    setVisibility(shouldBeVisible);
  }, [shouldBeVisible, setVisibility]);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);
};

export default function LayoutWithBackgroundProvider({ children }: React.PropsWithChildren) {
  const [visible, setVisible] = useState(true);
  const [theme, setTheme] = useState<backgroundTheme>('regular');
  const [graphicLevel] = useSettingValue(GraphicSetting);

  return (
    <BackgroundContext.Provider value={{ visible, setVisibility: setVisible, setTheme, theme }}>
      {visible && (
        <Background
          className={cx(
            theme === 'christmas' ? christmasCss : theme === 'eurovision' ? eurovisionCss : regularCss,
            graphicLevel === 'high' && backgroundHigh,
          )}
          bgtheme={theme}>
          {theme === 'eurovision' && <EurovisionTheme />}
        </Background>
      )}
      {children}
    </BackgroundContext.Provider>
  );
}

const escBarAnimation = css`
  animation: escGradient 46s linear infinite;
  flex: 1;

  @keyframes escGradient {
    0% {
      background-position: 0% 800%;
    }
    100% {
      background-position: 0% 0%;
    }
  }
`;

const EscBar = styled.div`
  transform: scale(1, 4);

  background-image: url(${eurovisionBg});
  background-size: 100% 50%;
  height: 100%;
`;

export const EurovisionTheme = () => (
  <>
    <EscBar className={cx(global.location?.href.includes('/remote-mic') && escBarAnimation)} />
  </>
);

const christmasCss = css`
  background-image: linear-gradient(
    -45deg,
    ${colorSets.christmasGreen.text},
    ${colorSets.christmasGreen.stroke},
    ${colorSets.christmasRed.stroke},
    ${colorSets.christmasRed.stroke}
  );
  background-size: 400% 400%;
`;

const eurovisionCss = css`
  display: flex;
`;

const regularCss = css`
  background-image: linear-gradient(
    -45deg,
    ${colorSets.red.stroke},
    ${colorSets.blue.text},
    ${colorSets.blue.stroke},
    ${colorSets.red.stroke}
  );
  background-size: 400% 400%;
`;

export const BackgroundStatic = styled.div<{ bgtheme: backgroundTheme }>`
  background-color: white;

  width: 100%;
  height: 100%;
`;

const backgroundHigh = css`
  animation: gradient 15s ease infinite;
  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

const Background = styled(BackgroundStatic)`
  z-index: -1;
  top: 0;
  position: fixed;

  background-position: 100% 50%; // for low graphic level
`;
