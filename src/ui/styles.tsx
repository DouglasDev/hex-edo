import { styled } from '@linaria/react';

export const Shell = styled.main`
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: max(14px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right))
    max(10px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
  @media (max-height: 480px) {
    padding-top: max(6px, env(safe-area-inset-top));
    padding-bottom: max(4px, env(safe-area-inset-bottom));
  }
  &[data-mobile='true'] {
    padding: 0;
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 62px;
  border-bottom: 1px solid #252c37;
  flex-shrink: 0;
  @media (max-height: 480px) {
    min-height: 48px;
  }
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  font-weight: 600;
  font-size: 19px;
  letter-spacing: -0.6px;
  white-space: nowrap;
`;

export const Mark = styled.span`
  display: grid;
  place-items: center;
  width: 28px;
  height: 30px;
  color: #bef1d0;
  font-size: 30px;
`;

export const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const TuningLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a0aabb;
  font-size: 12px;
  @media (max-width: 620px) {
    gap: 4px;
  }
`;

export const Select = styled.select`
  border: 1px solid #343e4d;
  border-radius: 7px;
  background: #171e29;
  color: #eef3f9;
  padding: 9px 12px;
  min-height: 38px;
`;

export const Button = styled.button`
  min-height: 38px;
  padding: 8px 13px;
  border: 1px solid #354151;
  border-radius: 7px;
  background: #19222f;
  color: #e9f0f8;
  white-space: nowrap;
  &:hover {
    background: #253246;
  }
  &:disabled {
    opacity: 0.5;
  }
  &[aria-pressed='true'] {
    border-color: #9fdab4;
    color: #cbf5d9;
    background: #20382c;
  }
`;

export const EnableButton = styled(Button)`
  border-color: #b8efca;
  background: #b8efca;
  color: #15291e;
  font-weight: 600;
  &:hover {
    background: #d0f9dd;
  }
`;

export const Workspace = styled.section`
  position: relative;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const BoardTopline = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 49px;
  gap: 12px;
  color: #9aa7b8;
  font:
    11px 'DM Mono',
    monospace;
  @media (max-height: 480px) {
    min-height: 28px;
    font-size: 10px;
  }
`;

export const Status = styled.span`
  display: flex;
  align-items: center;
  gap: 7px;
  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #a0b1c7;
  }
  &[data-ready='true']::before {
    background: #b8efca;
  }
`;

export const BoardFrame = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  border: 1px solid #252c37;
  border-radius: 14px;
  &[data-mobile='true'] {
    border: 0;
    border-radius: 0;
  }
  overflow: hidden;
  background: #0d1119;
`;

export const Activation = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d11199c;
  backdrop-filter: blur(3px);
`;

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  color: #8290a4;
  font-size: 11px;
  @media (max-height: 480px) {
    min-height: 25px;
    font-size: 10px;
  }
`;

export const RootLegend = styled.span`
  display: flex;
  align-items: center;
  gap: 7px;
  &::before {
    content: '';
    width: 5px;
    height: 5px;
    background: #b8efca;
    border-radius: 50%;
  }
`;

export const Panel = styled.aside`
  position: absolute;
  right: 0;
  top: 8px;
  bottom: 2px;
  width: min(360px, 100%);
  z-index: 2;
  background: #151d29;
  border: 1px solid #3a4758;
  border-radius: 12px;
  box-shadow: 0 18px 60px #0008;
  padding: 18px;
  overflow-y: auto;
  &[data-mobile='true'] {
    left: max(0px, env(safe-area-inset-left));
    right: auto;
    top: max(52px, calc(env(safe-area-inset-top) + 48px));
    bottom: 0;
    border-radius: 0;
  }
`;

export const PanelTitle = styled.h2`
  font-size: 15px;
  margin: 0 0 18px;
  font-weight: 600;
`;

export const Field = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  color: #c5cfdd;
  font-size: 13px;
`;

export const NumberInput = styled.input`
  width: 76px;
  background: #0e1520;
  border: 1px solid #3a4758;
  border-radius: 6px;
  padding: 8px;
  color: #eef3f9;
`;

export const Range = styled.input`
  width: 145px;
  accent-color: #b8efca;
`;

export const ErrorText = styled.p`
  color: #ffc7ab;
  font-size: 12px;
  line-height: 1.5;
  margin: 0 0 14px;
`;

export const Detail = styled.p`
  font:
    11px 'DM Mono',
    monospace;
  color: #99a8bd;
  line-height: 1.6;
  margin: 18px 0 0;
`;

export const Rotate = styled.main`
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 22px;
  color: #dce6f3;
  font-size: 18px;
`;

export const RotateIcon = styled.span`
  width: 72px;
  height: 43px;
  border: 2px solid #b8efca;
  border-radius: 9px;
  &::after {
    content: '↻';
    display: block;
    text-align: center;
    line-height: 38px;
    font-size: 26px;
    color: #b8efca;
  }
`;
