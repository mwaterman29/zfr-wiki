import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { DataTable, type Column } from "../components/ui/DataTable";
import { GameIcon } from "../components/ui/GameIcon";
import { Gold, Brains, Xp } from "../components/ui/Currency";
import { Badge } from "../components/ui/Badge";
import { Formula, Fx } from "../components/ui/Formula";
import { PageHeader, Breadcrumbs, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { SourceCite } from "../components/ui/SourceCite";
import { ZombieChip, EnemyChip, PlaceableChip, BoostChip } from "../components/entities";
import { RaidToggleBar } from "../components/RaidToggleBar";
import { PageIcon } from "../components/PageIcon";
import { useRaidSettings, computeRaidEv, type ComputedRaidEv } from "../lib/raidEv";
import { raids, raidSlug, raidBySlug } from "../data";
import { num, duration, pct, levelLabel } from "../lib/format";
import type { Raid } from "../data/types";

interface Row {
  raid: Raid;
  ev: ComputedRaidEv;
}

export function RaidsIndex() {
  const [s, patch] = useRaidSettings();
  const rows = useMemo<Row[]>(() => raids.filter((r) => !r.practice).map((raid) => ({ raid, ev: computeRaidEv(raid, s) })), [s]);

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Raid",
      sortable: true,
      value: (r) => r.raid.name,
      render: ({ raid }) => (
        <Link to={`/raids/${raidSlug(raid)}`} className="inline-flex items-center gap-2 font-medium !text-text hover:!text-primary-strong">
          <GameIcon file={raid.enemyIcon} alt="" size="sm" fallback="none" />
          {raid.name}
        </Link>
      ),
    },
    { key: "unlock", header: "Unlock", sortable: true, align: "right", value: (r) => r.raid.unlockLevel, render: (r) => levelLabel(r.raid.unlockLevel) },
    { key: "win", header: "Win gold", sortable: true, align: "right", hint: "(goldReward + bonusGold) × survival", value: (r) => r.ev.winGold, render: (r) => <Gold value={r.ev.winGold} /> },
    {
      key: "net",
      header: "Net gold / run",
      sortable: true,
      align: "right",
      value: (r) => r.ev.netGold,
      render: ({ raid, ev }) => (
        <Formula
          result={<Gold value={ev.netGold} />}
          source={{ file: "src/raid/RaidCatalog.ts", label: "winGold" }}
        >
          <Fx>win {num(ev.winGold)} − voucher {num(ev.voucherCost)} − elite {num(ev.eliteCost)}</Fx>
          <Fx>+ bonus/refund {num(ev.alwaysGoldEV)} + decor {num(ev.decorSellEV)}</Fx>
          <Fx>= {num(ev.netGold)} gold</Fx>
        </Formula>
      ),
    },
    { key: "brains", header: "Brains / win", sortable: true, align: "right", hint: "boss roll + pity", value: (r) => r.ev.brains, render: (r) => <Brains value={r.ev.brains} digits={3} /> },
    {
      key: "rare",
      header: "Rare zombie",
      sortable: true,
      value: (r) => (r.raid.rare ? r.ev.rareExpectedWins ?? 0 : Infinity),
      render: ({ raid, ev }) =>
        raid.rare ? (
          <span className="text-sm">
            <ZombieChip k={ev.rarePrize!.key} /> <span className="text-muted">{pct(ev.rareRate, 2)} · ~{num(ev.rareExpectedWins ?? 0)} wins</span>
          </span>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Raids" icon={<PageIcon to="/raids" />} kicker={`${raids.length} raids`}>
        <p>
          Raids pay gold, brains, and boosts on every win, and every one of them can also drop a rare zombie. Six pay a
          different, promoted zombie on an elite fight in place of the ordinary one. XP only comes from your first clear
          of each. The gold, brains, and rare-zombie figures below update as you change the toggle bar.
        </p>
      </PageHeader>

      <RaidToggleBar s={s} patch={patch} />

      <DataTable rows={rows} columns={columns} rowKey={(r) => String(r.raid.id)} initialSort={{ key: "unlock", dir: "asc" }} />

      <Note tone="muted">
        Net gold counts win gold (scaled by survival), the bonus-gold and voucher-refund loot picks, and - when "Sell decorations" is
        on - the expected decoration sell value. Elite subtracts the 10,000-gold Brain Ticket, which itself skips the cooldown (so no
        voucher is charged on top), and quadruples brain luck. Rare luck is quadrupled only on a raid whose elite fight pays the same
        zombie; where an elite pays a promoted prize instead, that prize's own higher rate replaces the multiplier rather than
        stacking with it. Brains assume a <Link to="/life-force">Life Force</Link> level of 10 or lower; each level above that adds 2.5%
        of the drop chance. Enemy difficulty (much harder) isn't modeled here.
      </Note>

      {PRACTICE.length > 0 && (
        <Section title="Dual invasions (practice)">
          <p className="mb-3 max-w-3xl text-sm leading-relaxed text-text">
            The dual invasions are open as practice from level {PRACTICE[0].unlockLevel}: no rewards, no losses, no cooldown. Each has
            ten tiers you can pick freely, and a {duration(PRACTICE[0].timeLimitMs)} clock.
          </p>
          <div className="flex flex-wrap gap-2">
            {PRACTICE.map((r) => (
              <Link
                key={r.id}
                to={`/raids/${raidSlug(r)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium !text-text hover:border-primary hover:!text-primary-strong"
              >
                <GameIcon file={r.enemyIcon} alt="" size="sm" fallback="none" />
                {r.name}
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

const PRACTICE = raids.filter((r) => r.practice);

function PracticeRaidDetail({ raid }: { raid: Raid }) {
  return (
    <div>
      <Breadcrumbs trail={[{ label: "Raids", to: "/raids" }, { label: raid.name }]} />
      <PageHeader
        title={raid.name}
        icon={<GameIcon file={raid.bossPortrait} alt={raid.bossName} size="xl" fallback="none" />}
        kicker={`Boss: ${raid.bossName} · practice`}
      >
        <p>
          A dual invasion, open as practice from level {raid.unlockLevel}. A fight pays nothing and costs nothing: no gold, XP, brains,
          loot or rare zombie, every zombie comes home, and there's no cooldown. You can pick any of the ten tiers. The fight has a{" "}
          {duration(raid.timeLimitMs)} clock, and running out of time is a loss.
        </p>
      </PageHeader>
      {raid.tierLadder && (
        <Section title="Tiers">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-right">Tier</th>
                  <th>Adds</th>
                </tr>
              </thead>
              <tbody>
                {raid.tierLadder.map((note, i) => (
                  <tr key={i}>
                    <td className="text-right tabular font-medium">{i + 1}</td>
                    <td>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Each tier keeps everything the tiers below it added.</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <SourceCite file="src/raid/dualInvasion.ts" label="TIER_LADDER" />
            <SourceCite file="src/raid/practice.ts" label="DUAL_PRACTICE" />
          </div>
        </Section>
      )}
    </div>
  );
}

const KIND_LABEL: Record<string, string> = { gold: "Bonus gold", brains: "Brains", boost: "Boost", decor: "Decoration", item: "Item" };

export function RaidDetail() {
  const { slug } = useParams();
  const [s, patch] = useRaidSettings();
  const raid = slug ? raidBySlug[slug] : undefined;
  if (!raid) return <Note tone="warn">Raid not found.</Note>;
  if (raid.practice) return <PracticeRaidDetail raid={raid} />;
  const ev = computeRaidEv(raid, s);
  // Banners roll separately every win, on top of the normal drop. A name listed in
  // several tiers still rolls once.
  const extras = [...new Map(raid.lootTiers.flatMap((t) => t.items).filter((it) => it.extraRate).map((it) => [it.name, it])).values()];

  return (
    <div>
      <Breadcrumbs trail={[{ label: "Raids", to: "/raids" }, { label: raid.name }]} />
      <PageHeader
        title={raid.name}
        icon={<GameIcon file={raid.bossPortrait} alt={raid.bossName} size="xl" fallback="none" />}
        kicker={`Boss: ${raid.bossName}`}
      />

      <RaidToggleBar s={s} patch={patch} />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Rewards @ current settings</h2>
            <KeyRow label="Net gold / run"><Gold value={ev.netGold} /></KeyRow>
            <KeyRow label="Win gold"><Gold value={ev.winGold} /></KeyRow>
            <KeyRow label="Bonus + refund"><Gold value={ev.alwaysGoldEV} /></KeyRow>
            <KeyRow label="Decor sell EV"><Gold value={ev.decorSellEV} /></KeyRow>
            <KeyRow label="Brains / win"><Brains value={ev.brains} digits={3} /></KeyRow>
            {raid.rare && <KeyRow label="Rare rate">{pct(ev.rareRate, 2)}</KeyRow>}
            {raid.rare && <KeyRow label="Expected wins">~{num(ev.rareExpectedWins ?? 0)}</KeyRow>}
          </Panel>
          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Fixed</h2>
            <KeyRow label="Unlock level">{levelLabel(raid.unlockLevel)}</KeyRow>
            <KeyRow label="Recommended">Lv {raid.recommendedLevel}</KeyRow>
            <KeyRow label="First-clear XP"><Xp value={raid.xp} /></KeyRow>
            <KeyRow label="First-clear brains"><Brains value={raid.firstClearBrains} /></KeyRow>
            <KeyRow label="Cooldown">{duration(raid.cooldownMs)}</KeyRow>
            <KeyRow label="Min army">{raid.minArmyProgression.join(" → ")}</KeyRow>
            <KeyRow label="Stages">{raid.stageCount}</KeyRow>
            {raid.statue && (
              <>
                <KeyRow label="Statue">
                  <PlaceableChip k={raid.statue.stoneKey} /> <span className="text-xs text-muted">win {raid.statue.stoneWins}, then {pct(raid.statue.stoneRate, 0)}</span>
                </KeyRow>
                <KeyRow label="Golden statue">
                  <PlaceableChip k={raid.statue.goldenKey} /> <span className="text-xs text-muted">win {raid.statue.goldenWins}, then {pct(raid.statue.goldenRate, 0)}</span>
                </KeyRow>
              </>
            )}
            {raid.rare && (
              <div className="mt-2 text-right text-xs">
                Rare drop: <ZombieChip k={ev.rarePrize!.key} />
              </div>
            )}
          </Panel>
        </div>

        <div>
          <Section title="Loot table" aside={<span className="text-xs text-muted">per-item chance @ {s.dice} dice</span>}>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>Item</th>
                    <th>Kind</th>
                    <th className="text-right">Value</th>
                    <th className="text-right">Chance / win</th>
                  </tr>
                </thead>
                <tbody>
                  {raid.lootTiers.flatMap((t) => {
                    const ordinary = t.items.filter((it) => !it.extraRate);
                    return ordinary.map((it, j) => {
                      const p = (ev.tierShares[t.tier] ?? 0) / ordinary.length;
                      return (
                        <tr key={`${t.tier}-${j}`}>
                          {j === 0 && (
                            <td rowSpan={ordinary.length} className="align-top tabular font-medium">
                              t{t.tier}
                              <div className="text-xs font-normal text-muted">{pct(ev.tierShares[t.tier] ?? 0)}</div>
                            </td>
                          )}
                          <td>
                            {it.placeKey ? <PlaceableChip k={it.placeKey} /> : it.boostKey ? <BoostChip k={it.boostKey} /> : it.name}
                            {it.boostQty && it.boostQty > 1 ? <span className="ml-1 text-xs text-muted">×{it.boostQty}</span> : null}
                          </td>
                          <td><Badge>{KIND_LABEL[it.kind] ?? it.kind}</Badge></td>
                          <td className="text-right tabular">
                            {it.kind === "brains" ? <Brains value={it.brainValue} /> : it.kind === "decor" ? <Gold value={it.sellValue} /> : it.goldValue ? <Gold value={it.goldValue} /> : "-"}
                          </td>
                          <td className="text-right tabular">{pct(p, 1)}</td>
                        </tr>
                      );
                    });
                  })}
                  {extras.map((it) => (
                    <tr key={`extra-${it.name}`}>
                      <td className="align-top text-xs font-medium text-muted" title="Rolled on its own every win, on top of the normal drop">
                        Extra
                      </td>
                      <td>{it.placeKey ? <PlaceableChip k={it.placeKey} /> : it.name}</td>
                      <td><Badge>{KIND_LABEL[it.kind] ?? it.kind}</Badge></td>
                      <td className="text-right tabular">{it.kind === "decor" ? <Gold value={it.sellValue} /> : "-"}</td>
                      <td className="text-right tabular">{pct(it.extraRate, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Waves">
            {raid.statProfile && (
              <p className="mb-3 text-xs text-muted">
                This invasion scales its enemies to ×{raid.statProfile.damage} damage and ×{raid.statProfile.hp} HP
                {raid.statProfile.bossHp !== raid.statProfile.hp ? ` (boss ×${raid.statProfile.bossHp})` : ""}; the figures below
                include it. Enemy pages show base stats.
              </p>
            )}
            {raid.stages.map((st) => (
              <div key={st.index} className="mb-4">
                {raid.stages.length > 1 && <div className="mb-1 text-sm font-medium">Stage {st.index + 1}</div>}
                <div className="mb-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {st.bossKey && (
                    <span>
                      Boss: <EnemyChip k={st.bossKey} />
                    </span>
                  )}
                  <span className="text-muted">Total enemy HP: <span className="tabular text-text">{num(st.totalEnemyHp)}</span></span>
                  <span className="text-muted">Aggregate melee DPS: <span className="tabular text-text">{num(st.totalEnemyMeleeDps)}</span></span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {st.minions.map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <EnemyChip k={m.key} />
                      <span className="text-xs text-muted">×{m.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted">
              Enemy HP is con × 100 and melee DPS is str × 10 (1s enemy interval). Boss throws and specials add damage beyond melee and
              aren't in the aggregate.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
