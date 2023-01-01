import styled from '@emotion/styled';
import { MenuButton, MenuContainer } from 'Elements/Menu';
import useKeyboardNav from 'hooks/useKeyboardNav';
import { useEffect, useRef } from 'react';

interface Props {
    onResume: () => void;
    onExit: () => void;
    onRestart: () => void;
}

export default function PauseMenu({ onResume, onExit, onRestart }: Props) {
    const menuRef = useRef<null | HTMLButtonElement>(null);

    useEffect(() => {
        menuRef.current?.focus();
    }, [menuRef]);

    const { register } = useKeyboardNav();

    return (
        <Container>
            <MenuContainer>
                <MenuButton {...register('resume', onResume)} ref={menuRef} data-test="button-resume-song">
                    Resume song
                </MenuButton>
                <MenuButton {...register('restart', onRestart)} data-test="button-restart-song">
                    Restart song
                </MenuButton>
                <MenuButton {...register('exit', onExit)} data-test="button-exit-song">
                    Exit song
                </MenuButton>
            </MenuContainer>
        </Container>
    );
}

const Container = styled.div`
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    display: flex;

    align-items: center;
    justify-content: center;
`;
