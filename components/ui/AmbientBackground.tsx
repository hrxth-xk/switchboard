type AmbientBackgroundProps = {
  /**
   * "marketing" scrolls with the page and runs the light brighter for the
   * landing page; "app" pins a fainter version behind dense product UI.
   */
  tone?: "marketing" | "app";
};

/** Grid, drifting light, and film grain — the shared backdrop for every surface. */
export function AmbientBackground({ tone = "app" }: AmbientBackgroundProps) {
  return (
    <div aria-hidden="true" className={`ambient ambient-${tone}`}>
      <span className="ambient-orb ambient-orb-a" />
      <span className="ambient-orb ambient-orb-b" />
      <span className="ambient-orb ambient-orb-c" />
    </div>
  );
}
