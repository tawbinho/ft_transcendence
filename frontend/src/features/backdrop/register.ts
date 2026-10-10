// The one line that switches this feature on is `import '@/features/backdrop/register'` in src/main.tsx.
// To remove the feature, delete this folder and that line. Lines about "backdrop" in index.html can stay (they
// only set an attribute that nothing reads any more).
import { addAppearanceControl } from '@/app/extensions';
import { applyBackdrop } from './backdrops';
import { BackdropPicker } from './BackdropPicker';
import './backdrop.css';

applyBackdrop();
addAppearanceControl(BackdropPicker);
