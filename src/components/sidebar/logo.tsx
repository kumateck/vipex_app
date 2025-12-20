import Image from 'next/image';

import large from '@/../public/oryx-logo.png';
import tiny from '@/../public/small-logo.png';
import { useSidebar } from '@/components/ui';

const SideLogo = () => {
  const { state } = useSidebar();

  return (
    <div>
      <Image
        src={state === 'collapsed' ? tiny.src : large.src}
        alt="logo"
        width={100}
        height={100}
        className="invert"
      />
    </div>
  );
};

export default SideLogo;
