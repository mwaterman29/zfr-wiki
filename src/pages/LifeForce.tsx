import { Link } from "react-router-dom";
import { PageHeader, Section } from "../components/ui/layout";
import { PageIcon } from "../components/PageIcon";
import { SourceCite } from "../components/ui/SourceCite";
import { lifeForce } from "../data";
import { num, pct } from "../lib/format";

const mult = (m: number) => (m === 1 ? <span className="text-muted">-</span> : `×${+m.toFixed(3)}`);

/** Levels shown in the lifeless-harvest matrix: from 0 until every tier is safe. */
const HARVEST_LEVELS = lifeForce.levels
  .map((l) => l.level)
  .filter((l) => lifeForce.harvestTiers.some((t) => (t.failByLevel[l - 1] ?? 1) > 0));

export function LifeForcePage() {
  const top = lifeForce.levels[lifeForce.levels.length - 1];
  return (
    <div>
      <PageHeader title="Life Force" icon={<PageIcon to="/life-force" />} kicker={`${lifeForce.maxLevel} levels · ${num(top.need)} to max`}>
        <p>
          Everything placed on your farm adds Life Force. The farm's total sets a level from 0 to {lifeForce.maxLevel}, and the level
          improves mutations, zombie harvests, ability slots, fertilizing and invasion brain drops.
        </p>
      </PageHeader>

      <Section title="How it works">
        <p className="max-w-3xl text-sm leading-relaxed text-text">
          Every decoration, tree and building has a Life Force value. Your total is the sum of everything placed on the farm. Objects
          in Storage don't count. Each object's value is on its page, and the{" "}
          <Link to="/placeables">Placeables</Link> table can sort by Life Force, Life Force per tile, and gold per Life Force.
        </p>
        <div className="mt-2">
          <SourceCite file="src/lifeForce.ts" label="lifeForceLevel" />
        </div>
      </Section>

      <Section title="Levels">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-right">Level</th>
                <th className="text-right">Life Force</th>
                <th className="text-right" title="Chance each adjacent crop passes its mutation to a harvested zombie">
                  Mutation / crop
                </th>
                <th className="text-right">Ability slots</th>
                <th className="text-right" title="Multiplier on each Garden zombie's fertilize chance">
                  Fertilize chance
                </th>
                <th className="text-right" title="Multiplier on a fertilized crop's doubled payout">
                  Fertilized payout
                </th>
                <th className="text-right" title="Multiplier on invasion brain drop chances">
                  Brain drops
                </th>
              </tr>
            </thead>
            <tbody>
              {lifeForce.levels.map((l) => (
                <tr key={l.level}>
                  <td className="text-right tabular font-medium">{l.level}</td>
                  <td className="text-right tabular">{l.level === 0 ? <span className="text-muted">under {lifeForce.levels[1].need}</span> : num(l.need)}</td>
                  <td className="text-right tabular">{pct(l.mutationChance, 0)}</td>
                  <td className="text-right tabular">{l.abilitySlots}</td>
                  <td className="text-right tabular">{mult(l.fertilizeMultiplier)}</td>
                  <td className="text-right tabular">{mult(l.fertilizedCropValueMultiplier)}</td>
                  <td className="text-right tabular">{mult(l.brainDropMultiplier)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 max-w-3xl list-disc space-y-1 pl-5 text-sm leading-relaxed text-text">
          <li>
            <span className="font-medium">Mutations:</span> each crop touching a zombie plot has this chance to pass on its{" "}
            <Link to="/mutations">mutation</Link>. It reaches 100% at level {lifeForce.levels.find((l) => l.mutationChance >= 1)?.level}.
          </li>
          <li>
            <span className="font-medium">Ability slots:</span> slot <em>n</em> works from level <em>n</em>, whatever ability sits in
            it. Beating an invasion boss no longer unlocks abilities. See <Link to="/abilities">Abilities</Link>.
          </li>
          <li>
            <span className="font-medium">Fertilizing:</span> scales each Garden zombie's chance (a 4% Garden becomes{" "}
            {pct(0.04 * lifeForce.levels[lifeForce.fertilizeCapLevel].fertilizeMultiplier)} at level {lifeForce.fertilizeCapLevel}) and
            stops growing there. From level 6, fertilized crops also pay more. See <Link to="/fertilizing">Fertilizing</Link>.
          </li>
          <li>
            <span className="font-medium">Brain drops:</span> from level 11, each level adds 2.5% of an invasion's brain drop chance.
          </li>
        </ul>
        <div className="mt-2">
          <SourceCite file="src/lifeForce.ts" label="lifeForceLevelRows" />
        </div>
      </Section>

      <Section title="Lifeless harvests">
        <p className="mb-3 max-w-3xl text-sm leading-relaxed text-text">
          A zombie above Green can come out lifeless: the crop is spent and still earns its XP, but no zombie appears. Each colour
          above Green adds 10% and each Life Force level takes 10% away. Green zombies are never lifeless, and a farm with no zombies
          yet always grows its first one.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th>Zombie</th>
                {HARVEST_LEVELS.map((l) => (
                  <th key={l} className="text-right">
                    Lv {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lifeForce.harvestTiers
                .filter((t) => t.failByLevel[0] > 0)
                .map((t) => (
                  <tr key={t.tier}>
                    <td className="font-medium">{t.name}</td>
                    {HARVEST_LEVELS.map((l) => (
                      <td key={l} className="text-right tabular">
                        {t.failByLevel[l] > 0 ? pct(t.failByLevel[l], 0) : <span className="text-muted">safe</span>}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2">
          <SourceCite file="src/lifeForce.ts" label="harvestFailureChance" />
        </div>
      </Section>
    </div>
  );
}
