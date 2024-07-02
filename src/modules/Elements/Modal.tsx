import { styled } from '@linaria/react';
import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  onClose?: () => void;
}

export default function Modal({ children, onClose }: Props) {
  return (
    <>
      <Backdrop onClick={onClose} />
      <Container onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>{children}</div>
      </Container>
    </>
  );
}

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20001;
  overflow: auto;
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.7);
  width: 100vw;
  height: 100vh;
  z-index: 20000;
  backdrop-filter: blur(20px);
`;
