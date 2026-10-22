import hardtailPhoto from '../../assets/bikes/hardtail.webp';
import fullSuspensionPhoto from '../../assets/bikes/full-suspension.webp';

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
}

// Both studio photos (from the iOS app's garage) share one framing, so one set of anchor points
// serves either bike. Coordinates are in the photos' 1200 x 800 pixel space.
const W = 1200;
const H = 800;
const ANCHOR = {
  fork: { x: 850, y: 316 },
  shock: { x: 592, y: 376 },
  tyreFront: { x: 1002, y: 610 },
  tyreRear: { x: 196, y: 640 },
};

/**
 * Studio photo of the rider's bike type with live callouts for fork, shock and tyre settings. A hardtail
 * swaps in the hardtail photo and drops the shock callout. A staged change turns its marker and value orange.
 */
export function BikeDiagram({ hardtail, fork, shock, tyreFront, tyreRear }: Props) {
  const v = (c: Callout) => (c.changed ? 'fill-brew-accent' : 'fill-brew-text');
  // A dark halo keeps text legible over the photo's lit floor.
  const halo = { paintOrder: 'stroke', stroke: '#0D0C0A', strokeWidth: 8, strokeLinejoin: 'round' } as const;
  const label = 'fill-brew-text-dim font-mono text-[29px] tracking-[0.16em]';
  const value = 'text-[42px] font-semibold';
  const sub = 'fill-brew-text-dim text-[30px]';

  const Marker = ({ at, c }: { at: { x: number; y: number }; c: Callout }) => (
    <g>
      <circle cx={at.x} cy={at.y} r="20" className={c.changed ? 'fill-brew-accent/25' : 'fill-white/10'} />
      <circle cx={at.x} cy={at.y} r="9" className={c.changed ? 'fill-brew-accent' : 'fill-brew-text'} />
    </g>
  );

  return (
    <figure className="relative mt-4 overflow-hidden rounded-2xl border border-brew-border bg-brew-bg">
      <img
        src={hardtail ? hardtailPhoto : fullSuspensionPhoto}
        alt=""
        width={W}
        height={H}
        className="block w-full h-auto"
      />
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="mtb-bike-title" className="absolute inset-0 w-full h-full">
        <title id="mtb-bike-title">
          {hardtail ? 'Hardtail mountain bike' : 'Full suspension mountain bike'} with live callouts for fork{hardtail ? '' : ', shock'} and tyre settings
        </title>

        {/* Fork: right, above the front wheel */}
        <path d={`M${ANCHOR.fork.x} ${ANCHOR.fork.y} L960 262`} className="stroke-white/30" strokeWidth="2" />
        <Marker at={ANCHOR.fork} c={fork} />
        <text x="1176" y="220" textAnchor="end" className={label} style={halo}>FORK</text>
        <text x="1176" y="266" textAnchor="end" className={`${v(fork)} ${value}`} style={halo}>{fork.value}</text>
        {fork.sub && <text x="1176" y="304" textAnchor="end" className={sub} style={halo}>{fork.sub}</text>}

        {shock && (
          <>
            <path d={`M${ANCHOR.shock.x} ${ANCHOR.shock.y} L300 236`} className="stroke-white/30" strokeWidth="2" />
            <Marker at={ANCHOR.shock} c={shock} />
            <text x="24" y="150" className={label} style={halo}>SHOCK</text>
            <text x="24" y="192" className={`${v(shock)} ${value}`} style={halo}>{shock.value}</text>
            {shock.sub && <text x="24" y="230" className={sub} style={halo}>{shock.sub}</text>}
          </>
        )}

        {/* Tyres: bottom corners, anchored to the edges so long values ("change staged") are not clipped. */}
        <path d={`M${ANCHOR.tyreFront.x} ${ANCHOR.tyreFront.y} L1080 702`} className="stroke-white/30" strokeWidth="2" />
        <Marker at={ANCHOR.tyreFront} c={tyreFront} />
        <text x="1176" y="730" textAnchor="end" className={label} style={halo}>FRONT TYRE</text>
        <text x="1176" y="778" textAnchor="end" className={`${v(tyreFront)} ${value}`} style={halo}>{tyreFront.value}</text>

        <path d={`M${ANCHOR.tyreRear.x} ${ANCHOR.tyreRear.y} L110 702`} className="stroke-white/30" strokeWidth="2" />
        <Marker at={ANCHOR.tyreRear} c={tyreRear} />
        <text x="24" y="730" className={label} style={halo}>REAR TYRE</text>
        <text x="24" y="778" className={`${v(tyreRear)} ${value}`} style={halo}>{tyreRear.value}</text>
      </svg>
    </figure>
  );
}
