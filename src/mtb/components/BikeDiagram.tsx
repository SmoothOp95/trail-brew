export interface Callout {
  value: string;
  sub?: string;
  changed?: boolean;
}

interface Props {
  hardtail: boolean;
  fork: Callout;
  shock: Callout | null;
  tyreFront: Callout;
  tyreRear: Callout;
  /** Proposed fork pressure change in psi, animates the stanchion like the prototype. */
  forkPsiDelta: number;
}

/**
 * Side view with live callouts, ported from the prototype's SVG. Callouts are repositioned so the fork and
 * shock labels no longer overlap (a prototype rendering bug); a hardtail drops the shock entirely.
 */
export function BikeDiagram({ hardtail, fork, shock, tyreFront, tyreRear, forkPsiDelta }: Props) {
  const line = 'fill-none stroke-brew-text-dim';
  const stanchionEnd = 174 + Math.max(-14, Math.min(14, -forkPsiDelta * 0.6));
  const v = (c: Callout) => (c.changed ? 'fill-brew-accent' : 'fill-brew-text');
  return (
    <svg viewBox="0 0 500 330" role="img" aria-labelledby="mtb-bike-title" className="w-full h-auto block">
      <title id="mtb-bike-title">
        {hardtail ? 'Side view of a hardtail mountain bike' : 'Side view of a full suspension mountain bike'} with live callouts for fork{hardtail ? '' : ', shock'} and tyre settings
      </title>
      <circle cx="126" cy="228" r="66" className={line} strokeWidth="6" />
      <circle cx="126" cy="228" r="52" className="fill-none stroke-white/10" strokeWidth="2" />
      <circle cx="378" cy="228" r="66" className={line} strokeWidth="6" />
      <circle cx="378" cy="228" r="52" className="fill-none stroke-white/10" strokeWidth="2" />
      <circle cx="126" cy="228" r="4" className="fill-brew-text-dim" />
      <circle cx="378" cy="228" r="4" className="fill-brew-text-dim" />

      <g className={line} strokeWidth="3.4" strokeLinecap="round">
        <path d="M126 228 L203 228" />
        <path d="M126 228 L176 158" />
        <path d="M203 228 L170 128" />
        <path d="M203 228 L344 143" />
        <path d="M172 132 L342 126" />
        <path d="M344 143 L352 118" strokeWidth="7" />
      </g>
      <g className={line} strokeWidth="2.2" strokeLinecap="round">
        <path d="M176 158 L206 152" />
        <path d="M170 128 L156 122 L188 118" />
        <path d="M348 112 L330 106 M348 112 L372 108" />
        <circle cx="203" cy="228" r="9" />
        <path d="M350 128 L378 228" strokeWidth="5" />
        {!hardtail && <path d="M203 172 L253 152" strokeWidth="5" />}
      </g>
      {!hardtail && <path d="M250 153 L268 146" className="fill-none stroke-brew-accent" strokeWidth="6" strokeLinecap="round" />}
      <path d={`M352 132 L364 ${stanchionEnd.toFixed(0)}`} className="fill-none stroke-brew-accent" strokeWidth="6" strokeLinecap="round" />

      {/* Fork callout: top right, clear of the shock callout */}
      <path d="M352 116 L420 70" className="stroke-white/15" strokeWidth="1" />
      <text x="488" y="36" textAnchor="end" className="fill-brew-text-muted text-[9.5px] tracking-wider">FORK</text>
      <text x="488" y="53" textAnchor="end" className={`${v(fork)} text-[13px] font-semibold`}>{fork.value}</text>
      {fork.sub && <text x="488" y="67" textAnchor="end" className="fill-brew-text-dim text-[9.5px]">{fork.sub}</text>}

      {shock && (
        <>
          <path d="M252 150 L128 92" className="stroke-white/15" strokeWidth="1" />
          <text x="14" y="64" className="fill-brew-text-muted text-[9.5px] tracking-wider">SHOCK</text>
          <text x="14" y="81" className={`${v(shock)} text-[13px] font-semibold`}>{shock.value}</text>
          {shock.sub && <text x="14" y="95" className="fill-brew-text-dim text-[9.5px]">{shock.sub}</text>}
        </>
      )}

      {/* Anchored to the right edge so long values ("change staged") are not clipped. */}
      <path d="M404 290 L440 298" className="stroke-white/15" strokeWidth="1" />
      <text x="492" y="306" textAnchor="end" className="fill-brew-text-muted text-[9.5px] tracking-wider">FRONT TYRE</text>
      <text x="492" y="322" textAnchor="end" className={`${v(tyreFront)} text-[13px] font-semibold`}>{tyreFront.value}</text>
      <path d="M100 290 L60 298" className="stroke-white/15" strokeWidth="1" />
      <text x="8" y="306" className="fill-brew-text-muted text-[9.5px] tracking-wider">REAR TYRE</text>
      <text x="8" y="322" className={`${v(tyreRear)} text-[13px] font-semibold`}>{tyreRear.value}</text>
    </svg>
  );
}
