import { ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button, { ButtonProps } from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import logoUniviaUrl from '../../../assets/images/logo-univia.svg';
import { BezelCard } from '../../ui/BezelCard/BezelCard';
import Icon from '../../ui/Icon';

/**
 * Shared presentation for the auth screens (sign in, sign up, forgot and reset
 * password). Visual only: no auth logic lives here.
 */

const glowSx = {
  '&::before': {
    content: '""',
    position: 'absolute',
    insetInline: 0,
    top: 0,
    height: 480,
    zIndex: -1,
    pointerEvents: 'none',
    background: 'radial-gradient(60% 40% at 50% 0%, rgba(0, 0, 0, 0.03), transparent 70%)',
    '[data-color-scheme="dark"] &': {
      background: 'radial-gradient(60% 40% at 50% 0%, rgba(255, 255, 255, 0.05), transparent 70%)',
    },
  },
} as const;

const logoSx = {
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
  '[data-color-scheme="dark"] &': {
    '> img': { filter: 'invert(1)' },
  },
} as const;

/** Wordmark; links home unless `to` is null. */
export function AuthLogo({ to = '/' }: { to?: string | null }) {
  const image = <img src={logoUniviaUrl} alt="Univia" width={120} height={40} style={{ width: 120, height: 40 }} />;
  if (to === null) {
    return <Box sx={logoSx}>{image}</Box>;
  }
  return (
    <Box component={RouterLink} to={to} sx={logoSx}>
      {image}
    </Box>
  );
}

export interface AuthSplitLayoutProps {
  /** Brand panel statement (visual h2-sized, not a heading: the form owns the h1). */
  headline: string;
  description: string;
  /** Short value lines with a check icon. */
  points: ReadonlyArray<string>;
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}

/**
 * Split auth layout. At ≥ md a quiet brand panel (surface tokens, so it follows
 * light and dark) sits beside the form; below md only the form renders.
 */
export function AuthSplitLayout({ headline, description, points, title, subtitle, children }: AuthSplitLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="aside"
        aria-label="About Univia"
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '1 1 0',
          minWidth: 0,
          position: 'relative',
          isolation: 'isolate',
          alignItems: 'center',
          justifyContent: 'center',
          p: { md: 6, lg: 10 },
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          ...glowSx,
        }}
      >
        <Box sx={{ maxWidth: 460, width: '100%' }}>
          <Typography
            component="p"
            sx={{
              fontSize: 'clamp(2rem, 3vw, 2.75rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              mb: 2.5,
              textWrap: 'balance',
            }}
          >
            {headline}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: '44ch' }}>
            {description}
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2 }}>
            {points.map((point) => (
              <Box component="li" key={point} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    fontSize: '1rem',
                    color: 'text.secondary',
                    bgcolor: 'action.hover',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    '[data-color-scheme="dark"] &': {
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <Icon name="check_circle" />
                </Box>
                <Typography variant="body1">{point}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        component="main"
        sx={{
          flex: '1 1 0',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 2, sm: 4, md: 8 },
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ maxWidth: 400, width: '100%' }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <AuthLogo />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}
            >
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export interface AuthCenterLayoutProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  /** Rendered under the card, e.g. a "Back to sign in" link. */
  footer?: ReactNode;
}

/** Single centered card for the short recovery flows. */
export function AuthCenterLayout({ title, description, children, footer }: AuthCenterLayoutProps) {
  const titleId = 'auth-card-title';
  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        isolation: 'isolate',
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.default',
        ...glowSx,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <AuthLogo />
        </Box>
        <BezelCard component="section" aria-labelledby={titleId} reveal={0}>
          <Typography
            id={titleId}
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}
          >
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {description}
          </Typography>
          {children}
        </BezelCard>
        {footer && <Box sx={{ mt: 3, textAlign: 'center' }}>{footer}</Box>}
      </Box>
    </Box>
  );
}

export interface AuthFieldProps extends Omit<TextFieldProps, 'label' | 'variant' | 'id'> {
  id: string;
  label: string;
  endAdornment?: ReactNode;
}

/**
 * Pill input with a static label above it. A floating notched label does not
 * sit well on a fully rounded outline, and the static label stays associated
 * with the input through `htmlFor`.
 */
export function AuthField({ id, label, required, endAdornment, sx, slotProps, ...rest }: AuthFieldProps) {
  return (
    <Box>
      <Typography
        component="label"
        htmlFor={id}
        variant="body2"
        sx={{ display: 'block', fontWeight: 600, mb: 0.75 }}
      >
        {label}
        {required && (
          <Box component="span" aria-hidden="true" sx={{ color: 'text.secondary', ml: 0.5 }}>
            *
          </Box>
        )}
      </Typography>
      <TextField
        id={id}
        fullWidth
        required={required}
        slotProps={{
          ...slotProps,
          input: {
            endAdornment: endAdornment ? <InputAdornment position="end">{endAdornment}</InputAdornment> : undefined,
            ...(slotProps?.input as object | undefined),
          },
        }}
        sx={[
          {
            // The theme paints the field root with a square background; round it to match the pill outline.
            borderRadius: 999,
            '& .MuiOutlinedInput-root': { borderRadius: 999, minHeight: 48, px: 2.5 },
            '& .MuiOutlinedInput-root.MuiInputBase-adornedEnd': { pr: 0.75 },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...rest}
      />
    </Box>
  );
}

const EYE =
  'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z';
const EYE_OFF =
  'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z';

export interface PasswordFieldProps extends Omit<AuthFieldProps, 'type' | 'endAdornment'> {
  visible: boolean;
  onToggleVisible: () => void;
}

/** Password pill with a 40px visibility toggle exposing `aria-pressed`. */
export function PasswordField({ visible, onToggleVisible, ...rest }: PasswordFieldProps) {
  return (
    <AuthField
      {...rest}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <IconButton
          onClick={onToggleVisible}
          aria-label="Show password"
          aria-pressed={visible}
          size="small"
          sx={{ width: 40, height: 40, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={visible ? EYE_OFF : EYE} />
          </svg>
        </IconButton>
      }
    />
  );
}

/** Pill outlined provider button (GitHub, Google). */
export function OAuthButton({ sx, ...props }: ButtonProps) {
  return (
    <Button
      fullWidth
      variant="outlined"
      sx={[
        {
          borderRadius: 999,
          minHeight: 48,
          borderWidth: 1,
          borderColor: 'divider',
          color: 'text.primary',
          transition: (theme) =>
            `border-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}, background-color ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeOut}`,
          '&:hover': { borderWidth: 1, borderColor: 'text.secondary', bgcolor: 'action.hover' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}

/** Inline status message. MUI Alert already carries `role="alert"`. */
export function AuthAlert({ severity, children }: { severity: 'error' | 'success'; children: ReactNode }) {
  return (
    <Alert
      severity={severity}
      variant="outlined"
      role={severity === 'error' ? 'alert' : 'status'}
      sx={{ mb: 3, borderRadius: 3 }}
    >
      {children}
    </Alert>
  );
}

/** "OR" divider with hairlines. */
export function AuthDivider() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }} role="separator" aria-label="or">
      <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
      <Typography variant="eyebrow" component="span" aria-hidden="true">
        or
      </Typography>
      <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
    </Box>
  );
}

export interface AuthLinkProps {
  to: string;
  children: ReactNode;
  variant?: 'body2' | 'caption';
  /** Pads the link to a 44px touch target when it stands alone on its own line. */
  block?: boolean;
}

/** Quiet underlined router link shared by the auth screens. */
export function AuthLink({ to, children, variant, block = false }: AuthLinkProps) {
  return (
    <Link
      component={RouterLink}
      to={to}
      variant={variant}
      sx={{
        fontWeight: 600,
        color: 'text.primary',
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
        textDecorationColor: 'currentColor',
        '&:hover': { textDecorationThickness: '2px' },
        ...(block && { display: 'inline-flex', alignItems: 'center', gap: 1, minHeight: 44 }),
      }}
    >
      {children}
    </Link>
  );
}
