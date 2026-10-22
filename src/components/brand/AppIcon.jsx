import appIcon from '../../assets/brand/app-icon.webp';

/**
 * The iOS app's icon (shield, trail and mug), used as the site's brand mark.
 * Rounded like a home-screen icon. Decorative by default because it always
 * sits next to the "Trail Brew" wordmark.
 */
export default function AppIcon({ size = 28, className = '', alt = '' }) {
  return (
    <img
      src={appIcon}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={size}
      height={size}
      className={`shrink-0 rounded-[22.5%] ${className}`}
    />
  );
}
