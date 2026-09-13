import {useEffect, useRef, type ReactNode} from 'react';
import OriginalMobileSidebar from '@theme-original/Navbar/MobileSidebar';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';

export default function MobileSidebar(): ReactNode {
  const {shown, toggle} = useNavbarMobileSidebar();
  const returnFocus = useRef(false);

  useEffect(() => {
    const restoreFocus = () => document.querySelector<HTMLButtonElement>('.navbar__toggle')?.focus();
    if (!shown) {
      if (returnFocus.current) restoreFocus();
      returnFocus.current = false;
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      returnFocus.current = true;
      toggle();
    };
    const onClose = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('.navbar-sidebar__close')) returnFocus.current = true;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClose, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClose, true);
    };
  }, [shown, toggle]);

  return <OriginalMobileSidebar />;
}
