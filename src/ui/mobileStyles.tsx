import { styled } from '@linaria/react';
import { Button } from './styles';

export const MenuButton = styled(Button)`
  position: fixed;
  left: max(4px, env(safe-area-inset-left));
  top: max(4px, env(safe-area-inset-top));
  z-index: 5;
  width: 44px;
  height: 44px;
  padding: 0;
  display: grid;
  place-items: center;
  background: #121b25d9;
`;

export const CornerButton = styled(MenuButton)`
  left: auto;
  top: auto;
  right: max(4px, env(safe-area-inset-right));
  bottom: max(4px, env(safe-area-inset-bottom));
`;
