import { TonePill } from '../../ui/TonePill/TonePill';
import type { Tone } from '../../ui/tone';
import { USER_TIERS } from '../../../config/tierConfig';
import { normalizeTier } from '../../../utils/billing';

const STATUS_TONE: Record<string, Tone> = {
  active: 'success',
  inactive: 'warning',
  churned: 'error',
};

/** Account status as a tinted pill with a leading dot. */
export function StatusPill({ status }: { status: string }) {
  return (
    <TonePill tone={STATUS_TONE[status] ?? 'neutral'} dot>
      {status}
    </TonePill>
  );
}

/**
 * Plan tier by visual weight, so the palette stays monochrome:
 * basic is an outline, pro is a tint, enterprise is inverse.
 */
export function TierPill({ tier }: { tier: string }) {
  const label = USER_TIERS[normalizeTier(tier)].name;
  if (tier === 'enterprise') return <TonePill variant="solid">{label}</TonePill>;
  if (tier === 'pro') return <TonePill>{label}</TonePill>;
  return <TonePill variant="outline">{label}</TonePill>;
}
