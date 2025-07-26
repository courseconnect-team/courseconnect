import { SvgIconComponent } from '@mui/icons-material';

export type CardType = 'research' | 'ta';

export type NavbarItem = {
  label: string;
  to: string;
  icon: SvgIconComponent;
  type?: CardType;
};

export type CardDef = {
  /** Main heading shown next to the icon */
  header: string;
  /** Small line underneath */
  subhead?: string;
  /** Route path the card opens */
  path: string;
};
