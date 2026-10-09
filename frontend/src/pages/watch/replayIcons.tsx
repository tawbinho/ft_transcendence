import type { SVGProps } from 'react';
import { Icon } from '@/components/icons';

// The icons of the replay buttons. They always point left to right, because the
// controls are drawn left to right in every language, like a video player.

export const SkipStartIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M6 5v14M19 5l-9 7 9 7V5z" />
  </Icon>
);

export const StepBackIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M15 5l-8 7 8 7" />
  </Icon>
);

export const StepForwardIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M9 5l8 7-8 7" />
  </Icon>
);

export const SkipEndIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M18 5v14M5 5l9 7-9 7V5z" />
  </Icon>
);

export const PauseIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M8 5v14M16 5v14" />
  </Icon>
);
