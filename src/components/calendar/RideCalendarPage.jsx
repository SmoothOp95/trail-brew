import { useMemo, useState } from 'react';
import { MapPin, Clock, Calendar, CalendarPlus, Share2, Check, TrendingUp } from 'lucide-react';
import { getRideSchedule, getRideStatus } from '../../data/rideCalendar';
import { getTypeColor } from '../../data/trailTypes';
import { downloadRideICS } from '../../utils/calendarEvent';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function parseRideDate(iso) {
  return new Date(`${iso}T00:00:00`);
}

function formatFullDate(iso) {
  const d = parseRideDate(iso);
  const weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${weekdaysLong[d.getDay()]}, ${d.getDate()} ${monthsLong[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(t) {
  // '08:00' -> '8:00 AM'
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function RideCalendarPage() {
  const rides = useMemo(() => getRideSchedule(), []);
  const [copied, setCopied] = useState(false);

  // First ride that hasn't happened yet — highlighted as "next up".
  const nextIndex = useMemo(
    () => rides.findIndex((r) => getRideStatus(r.date) !== 'past'),
    [rides]
  );

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Trailblu 2026 Ride Series',
          text: 'Our monthly ride calendar for the rest of 2026 🚵',
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // User dismissed the share sheet or clipboard was blocked — no-op.
    }
  };

  return (
    <div className="min-h-screen bg-brew-bg text-brew-text">
      {/* Page header */}
      <div className="border-b border-brew-border bg-brew-card/60 backdrop-blur-sm sticky top-[49px] lg:top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 py-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold leading-tight">Ride Calendar</h1>
            <p className="text-xs text-brew-text-dim mt-0.5">
              One big Trailblu ride a month · progressively spicier through 2026
            </p>
          </div>
          <button
            onClick={handleShare}
            className="shrink-0 flex items-center gap-1.5 font-mono text-[11px] px-3 py-2 rounded-lg border border-brew-border text-brew-text-dim hover:border-brew-accent/30 hover:text-brew-accent transition-all duration-200 uppercase tracking-wide font-bold"
            style={{ minHeight: '40px' }}
          >
            {copied ? <Check size={13} /> : <Share2 size={13} />}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>

      {/* Intro / how it works */}
      <div className="max-w-[760px] mx-auto px-5 pt-6">
        <div className="flex items-center gap-2 text-[11px] text-brew-text-dim">
          <TrendingUp size={13} className="text-brew-accent" />
          <span>
            Every ride is beginner-friendly — but the series gets tougher each month. Ride the whole thing and level up.
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-[760px] mx-auto px-5 py-8">
        <div className="relative">
          {/* Vertical spine — runs through the centre of the date avatars */}
          <div
            className="absolute top-6 bottom-6 w-px bg-gradient-to-b from-brew-border via-brew-border to-transparent left-8"
            aria-hidden="true"
          />

          <ol className="space-y-6">
            {rides.map((ride, i) => (
              <RideTimelineItem
                key={ride.trailId}
                ride={ride}
                status={getRideStatus(ride.date)}
                isNext={i === nextIndex}
              />
            ))}
          </ol>
        </div>

        <p className="text-center text-[11px] text-brew-text-muted font-mono mt-10">
          🍺 Berms, Banter &amp; Beer · see you at the trailhead
        </p>
      </div>
    </div>
  );
}

function RideTimelineItem({ ride, status, isNext }) {
  const { trail } = ride;
  const d = parseRideDate(ride.date);
  const isPast = status === 'past';

  return (
    <li className="relative flex gap-4 sm:gap-5">
      {/* Date avatar */}
      <div className="relative z-10 shrink-0">
        <div
          className={`
            w-16 h-16 rounded-full flex flex-col items-center justify-center
            border text-center leading-none transition-all
            ${isNext
              ? 'bg-brew-accent text-brew-bg border-brew-accent shadow-[0_0_0_4px_rgba(184,230,72,0.12)]'
              : isPast
                ? 'bg-brew-card border-brew-border opacity-50'
                : 'bg-brew-card border-brew-border'
            }
          `}
        >
          <span className={`text-[9px] font-bold tracking-widest ${isNext ? 'text-brew-bg/80' : 'text-brew-text-dim'}`}>
            {MONTHS[d.getMonth()]}
          </span>
          <span className={`text-xl font-black ${isNext ? 'text-brew-bg' : 'text-brew-text'}`}>
            {d.getDate()}
          </span>
          <span className={`text-[9px] font-bold tracking-widest ${isNext ? 'text-brew-bg/80' : 'text-brew-text-muted'}`}>
            {WEEKDAYS[d.getDay()]}
          </span>
        </div>
      </div>

      {/* Ride card */}
      <div className={`flex-1 min-w-0 ${isPast ? 'opacity-60' : ''}`}>
        <div
          className={`
            relative overflow-hidden rounded-2xl border p-5 sm:p-6
            transition-all duration-300 group
            ${isNext
              ? 'bg-brew-card border-brew-accent/30 shadow-[0_16px_50px_rgba(0,0,0,0.35)]'
              : 'bg-brew-card border-brew-border hover:border-brew-accent/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]'
            }
          `}
        >
          {/* Top accent line */}
          <div
            className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brew-accent to-transparent transition-opacity ${
              isNext ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          />

          {/* Ride number + next-up badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] text-brew-text-muted tracking-wide">
              RIDE {ride.position} / {ride.total}
            </span>
            {isNext && (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-brew-accent/15 text-brew-accent uppercase tracking-wide">
                Next up
              </span>
            )}
            {isPast && (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/[0.06] text-brew-text-muted uppercase tracking-wide">
                Done
              </span>
            )}
          </div>

          {/* Trail name */}
          <h3 className="text-lg sm:text-xl font-bold leading-snug">{trail.name}</h3>
          <p className="text-xs text-brew-text-dim flex items-center gap-1 mt-1">
            <MapPin size={11} className="shrink-0" />
            {trail.location}
          </p>

          {/* Tagline */}
          <p className="text-sm text-brew-text-dim mt-3 leading-relaxed">{ride.tagline}</p>

          {/* Type tags */}
          <div className="flex gap-1.5 flex-wrap mt-4">
            {trail.types?.slice(0, 3).map((type) => {
              const colors = getTypeColor(type);
              return (
                <span
                  key={type}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${colors.bg} ${colors.text} uppercase tracking-wide`}
                >
                  {type}
                </span>
              );
            })}
          </div>

          {/* Challenge meter */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] text-brew-text-dim uppercase tracking-wide">
                {ride.challenge.label}
              </span>
              <span className="font-mono text-[10px] text-brew-text-muted capitalize">
                {trail.difficultyLevels?.join(' · ')}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: ride.total }).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full ${
                    idx < ride.challenge.level ? 'bg-brew-accent' : 'bg-brew-border'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer: date/time */}
          <div className="mt-5 pt-4 border-t border-brew-border flex items-center gap-4 text-brew-text-dim flex-wrap">
            <span className="flex items-center gap-1.5 text-xs">
              <Calendar size={12} className="text-brew-accent" />
              {formatFullDate(ride.date)}
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <Clock size={12} className="text-brew-accent" />
              {formatTime(ride.startTime)}
            </span>
          </div>

          {/* Actions: save the date + directions */}
          <div className="mt-3 flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => downloadRideICS(ride)}
              className="flex items-center gap-1.5 font-mono text-[11px] font-bold px-3 py-2 rounded-lg border border-brew-accent/30 bg-brew-accent/[0.06] text-brew-accent hover:bg-brew-accent/15 transition-all duration-200 uppercase tracking-wide"
              style={{ minHeight: '40px' }}
              title="Save this ride to your calendar"
            >
              <CalendarPlus size={13} />
              Add to Calendar
            </button>
            <a
              href={trail.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-mono text-[11px] font-bold px-3 py-2 rounded-lg border border-brew-border text-brew-text-dim hover:border-brew-accent/30 hover:text-brew-text transition-all duration-200 uppercase tracking-wide"
              style={{ minHeight: '40px' }}
            >
              <MapPin size={13} />
              Directions
            </a>
          </div>
        </div>
      </div>
    </li>
  );
}
