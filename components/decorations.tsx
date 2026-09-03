// Small reusable decorative pieces shared by the public-facing pages, built
// as plain CSS shapes (no images needed) so they load instantly.

export function ChristmasLights({ count = 12 }: { count?: number }) {
  const colors = ["#e0483f", "#fdd85f", "#a8e0d0", "#7a5cc4"];
  return (
    <div className="lights-strip">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="light-bulb"
          style={{
            background: colors[i % colors.length],
            boxShadow: `0 4px 10px ${colors[i % colors.length]}`,
            animationDelay: `${(i % 7) * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

export function SnowOverlay() {
  const flakes = [
    { left: "6%", size: 8, duration: 9, delay: 0 },
    { left: "17%", size: 5, duration: 7, delay: 0.8 },
    { left: "31%", size: 10, duration: 11, delay: 2 },
    { left: "44%", size: 6, duration: 8, delay: 1.2 },
    { left: "58%", size: 5, duration: 10, delay: 3 },
    { left: "72%", size: 9, duration: 8.5, delay: 0.4 },
    { left: "86%", size: 6, duration: 12, delay: 1.8 },
  ];
  return (
    <div className="snow-overlay" aria-hidden="true">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function TreeIcon({ size = 60 }: { size?: number }) {
  const w = size;
  const h = size * 1.15;
  return (
    <div className="tree-icon" style={{ width: w, height: h }}>
      <div className="tree-icon__trunk" />
      <div className="tree-icon__tier tree-icon__tier--bottom" />
      <div className="tree-icon__tier tree-icon__tier--middle" />
      <div className="tree-icon__tier tree-icon__tier--top" />
      <div className="tree-icon__star" />
    </div>
  );
}

export function SantaOrnament() {
  return (
    <div className="hanging-ornament hanging-ornament--santa">
      <div className="hanging-ornament__string" />
      <div className="hanging-ornament__cap" />
      <div className="santa-face" />
      <div className="santa-face__trim" />
    </div>
  );
}

export function ReindeerOrnament() {
  return (
    <div className="hanging-ornament hanging-ornament--reindeer">
      <div className="reindeer__antler reindeer__antler--left" />
      <div className="reindeer__antler reindeer__antler--right" />
      <div className="reindeer__antler-tip reindeer__antler-tip--left" />
      <div className="reindeer__antler-tip reindeer__antler-tip--right" />
      <div className="reindeer__head" />
      <div className="reindeer__eye reindeer__eye--left" />
      <div className="reindeer__eye reindeer__eye--right" />
      <div className="reindeer__nose" />
    </div>
  );
}

export function SleighIcon() {
  return (
    <div className="sleigh-icon">
      <div className="sleigh-icon__body" />
      <div className="sleigh-icon__runner" />
      <div className="sleigh-icon__gift sleigh-icon__gift--a" />
      <div className="sleigh-icon__gift sleigh-icon__gift--b" />
      <div className="sleigh-icon__back" />
      <div className="sleigh-icon__antler sleigh-icon__antler--left" />
      <div className="sleigh-icon__antler sleigh-icon__antler--right" />
      <div className="sleigh-icon__nose" />
    </div>
  );
}

export function LogoMark() {
  return (
    <div className="logo-mark">
      <div className="logo-mark__tier logo-mark__tier--bottom" />
      <div className="logo-mark__tier logo-mark__tier--top" />
      <div className="logo-mark__star" />
    </div>
  );
}
