import { PageHeader, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { PageIcon } from "../components/PageIcon";
import { SourceCite } from "../components/ui/SourceCite";
import { GameIcon } from "../components/ui/GameIcon";
import { pvp } from "../data";
import { num, titleCase } from "../lib/format";

const secs = (ms: number) => `${Math.round(ms / 1000)}s`;

/** Front-to-back order the jobs stand in, and when each one shows up. */
const ROLE_NOTES: Record<string, { when: string; job: string }> = {
  tank: { when: "Walks out at the start", job: "Holds the front. Every attacker hits this first." },
  brute: { when: "Standing at the start", job: "Mid-depth behind the tank. Climbs the perch and throws the mini." },
  mini: { when: "Standing at the start", job: "Beside the brute. Gets thrown as the projectile." },
  line: { when: "Reinforces on the drip", job: "Walks in later to plug the line." },
  girl: { when: "Reinforces on the drip", job: "Same station and beat as the Normal, its own slot." },
  support: { when: "Standing at the start", job: "Sits at the back in the doorway and heals." },
};

export function InvasionsPage() {
  const p = pvp;
  return (
    <div>
      <PageHeader title="Friend Invasions" icon={<PageIcon to="/invasions" />}>
        <p>
          You can attack a friend's farm and they can attack yours. Both sides need to be level {p.minLevel}. You send{" "}
          {p.armySize} zombies, they defend with {p.defenseCap}, and the reward is boost bundles priced by how strong the
          other side's line-up is.
        </p>
      </PageHeader>

      <Note>
        <strong>Nothing is ever lost.</strong> The defender is only a snapshot, so no zombie dies, nothing is stolen and
        no cooldown is applied on either side. Losing an attack costs you the attempt and nothing else.
      </Note>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">The basics</h2>
            <KeyRow label="Unlocks at">Level {p.minLevel}</KeyRow>
            <KeyRow label="Your attacking army">{p.armySize} zombies</KeyRow>
            <KeyRow label="Their defense">{p.defenseCap} zombies</KeyRow>
            <KeyRow label="Defense mode">{titleCase(p.defenseMode ?? "unknown")}</KeyRow>
            <KeyRow label="Fights on">Old McDonnell's stage</KeyRow>
          </Panel>
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Daily limits</h2>
            <KeyRow label="Paid wins per day">{p.dailyRewardedWins}</KeyRow>
            <KeyRow label="Paid defenses per day">{p.dailyRewardedDefenses}</KeyRow>
            <KeyRow label="Attacks on one friend">{p.dailyAttacksPerPair}</KeyRow>
            <KeyRow label="Replays kept">{p.replaysKept}</KeyRow>
            <p className="mt-2 text-xs text-muted">
              These cap the rewards, not the fights. You can invade as much as you like and it all counts in your stats,
              but only the first {p.dailyRewardedWins} wins each UTC day pay out.
            </p>
          </Panel>
        </div>

        <div>
          <Section title="How a fight works">
            <ul className="max-w-3xl list-disc space-y-1 pl-5 text-sm leading-relaxed text-text">
              <li>Scout a friend first to see their defender count, their line-up and the reward tier for beating it.</li>
              <li>Pick exactly {p.armySize} zombies in the order you want them to arrive.</li>
              <li>
                Your zombies walk in a few at a time, {p.wave.maxActive} on the field at once with another every{" "}
                {secs(p.wave.dripMs)}.
              </li>
              <li>Both sides fight at full focus, so there is no focus bubble to tap.</li>
              <li>The whole fight is recorded, and the last {p.replaysKept} are watchable from the History tab.</li>
            </ul>
            <div className="mt-2">
              <SourceCite file="src/raid/pvp.ts" label="pvp.ts" />
            </div>
          </Section>

          <Section title="The formation defense">
            <p className="mb-3 max-w-3xl text-sm leading-relaxed text-text">
              A defense is one zombie per class, six jobs in total. The defender picks who fills each job, but the jobs
              themselves are fixed. Not everyone is there at the start: the Normal and the Girl walk in later, one every{" "}
              {secs(p.defenseDripMs)}, so an attacker who clears fast gets ahead and one who stalls gets buried.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Class</th>
                    <th>When</th>
                    <th>What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {p.roles.map((r) => (
                    <tr key={r.role}>
                      <td className="font-medium">{titleCase(r.role)}</td>
                      <td>{r.group ?? "-"}</td>
                      <td className="text-muted">{ROLE_NOTES[r.role]?.when ?? "-"}</td>
                      <td className="text-muted">{ROLE_NOTES[r.role]?.job ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              A defender cannot tap anything, so most abilities are switched off. The ones that run themselves stay on:{" "}
              {p.passiveAbilities.map((a) => a.label).join(", ")}. The brute lobs the mini every {secs(p.throwIntervalMs)}{" "}
              from its perch. If a defender never arranges a defense, the game picks their strongest zombies instead.
            </p>
          </Section>

          <Section title="Reward tiers">
            <p className="mb-3 max-w-3xl text-sm leading-relaxed text-text">
              You are paid for the strength of the line-up you beat, not for winning as such, and the defender is paid
              the same way for holding. Strength is the built zombies' HP times DPS, so levels, veterancy, mutations and
              team auras all count. Group size helps a little but not linearly, so one strong zombie still outscores a
              crowd of weak ones.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-right">Tier</th>
                    <th className="text-right">Score</th>
                    <th>Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {p.tiers.map((t) => (
                    <tr key={t.tier}>
                      <td className="text-right tabular font-medium">{t.tier}</td>
                      <td className="text-right tabular text-muted">
                        {t.maxPoints === null ? `${num(t.minPoints)}+` : `${num(t.minPoints)} to ${num(t.maxPoints)}`}
                      </td>
                      <td>
                        <span className="flex flex-wrap items-center gap-2">
                          {t.rewards.map((r) => (
                            <span key={r.key} className="inline-flex items-center gap-1">
                              {r.icon && <GameIcon file={r.icon} alt="" size="xs" fallback="none" />}
                              {r.qty}× {r.name}
                            </span>
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              Tier 5 is the only place a Brain Ticket drops from invasions. Plain green zombies stay tier 1 whatever your
              account level, and even a fully mutated set of greens stops at tier 2.
            </p>
          </Section>

          <Section title="Claiming and history">
            <ul className="max-w-3xl list-disc space-y-1 pl-5 text-sm leading-relaxed text-text">
              <li>Held defenses park a reward you claim next time you log in. There is a Claim all button.</li>
              <li>Rewards stack up forever, so coming back after a month you can still claim every one of them.</li>
              <li>Recordings do not. Only the newest {p.replaysKept} fights per player stay watchable.</li>
              <li>A recording only plays back on the rules it was recorded under, so older ones lose their Watch button.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
