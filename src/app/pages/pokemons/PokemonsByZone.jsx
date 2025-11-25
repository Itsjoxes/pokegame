"use client";

import React, { useEffect, useState } from 'react';
import './pokemon.css';

// Helper: fetch pokemon types by id (returns array of type names)
async function getPokemonTypes(id) {
  try {
    if (TYPE_CACHE[id]) return TYPE_CACHE[id];
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`);
    if (!res.ok) return [];
    const data = await res.json();
    const types = (data.types || []).map((t) => t.type.name);
    TYPE_CACHE[id] = types;
    return types;
  } catch (e) {
    return [];
  }
}

// Full 18-type effectiveness chart (attacker -> defender multipliers)
// Values: 2 = super effective, 0.5 = not very effective, 0 = no effect
const TYPE_EFFECTIVENESS = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, ghost: 0 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, fairy: 2, steel: 0.5 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// small cache for types fetched during session to avoid repeated network calls
const TYPE_CACHE = {};
// cache for base stats
const STATS_CACHE = {};

async function getPokemonBaseStats(id) {
  try {
    if (STATS_CACHE[id]) return STATS_CACHE[id];
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`);
    if (!res.ok) return null;
    const data = await res.json();
    const statsObj = {};
    (data.stats || []).forEach((s) => {
      const name = s.stat.name; // e.g., 'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'
      statsObj[name] = s.base_stat;
    });
    STATS_CACHE[id] = statsObj;
    return statsObj;
  } catch (e) {
    return null;
  }
}

function computeInstanceStats(baseStats = {}, level = 1) {
  // simplified Pokemon formulas (no IV/EV, flat calculation)
  const bs = baseStats || {};
  const hpBase = bs.hp || 10;
  const atkBase = bs.attack || 5;
  const defBase = bs.defense || 5;
  const spAtkBase = bs['special-attack'] || 5;
  const spDefBase = bs['special-defense'] || 5;
  const speedBase = bs.speed || 5;
  const hp = Math.floor(((2 * hpBase) * level) / 100 + level + 10);
  const attack = Math.floor(((2 * atkBase) * level) / 100 + 5);
  const defense = Math.floor(((2 * defBase) * level) / 100 + 5);
  const spAttack = Math.floor(((2 * spAtkBase) * level) / 100 + 5);
  const spDefense = Math.floor(((2 * spDefBase) * level) / 100 + 5);
  const speed = Math.floor(((2 * speedBase) * level) / 100 + 5);
  return { hp, attack, defense, spAttack, spDefense, speed };
}

function typeMultiplier(attackerTypes = [], defenderTypes = []) {
  if (!attackerTypes || attackerTypes.length === 0) return 1;
  if (!defenderTypes || defenderTypes.length === 0) return 1;
  // multiply effectiveness for each attacker type vs each defender type
  let mult = 1;
  for (const a of attackerTypes) {
    for (const d of defenderTypes) {
      const row = TYPE_EFFECTIVENESS[a];
      if (row && Object.prototype.hasOwnProperty.call(row, d)) {
        mult *= row[d];
      } else {
        mult *= 1;
      }
    }
  }
  return mult;
}

function calcDamage(level, attackerTypes = [], defenderTypes = []) {
  const rnd = (n) => Math.floor(Math.random() * n) + 1;
  const base = rnd(Math.max(1, level * 2));
  const mult = typeMultiplier(attackerTypes, defenderTypes) || 1;
  const dmg = Math.max(1, Math.floor(base * mult));
  return dmg;
}

// Utility: fetch with limited concurrency
async function fetchWithConcurrency(urls, worker) {
  const results = [];
  const concurrency = 6;
  let idx = 0;

  async function runner() {
    while (true) {
      let i;
      // grab next index
      i = idx;
      idx += 1;
      if (i >= urls.length) return;
      try {
        const res = await worker(urls[i], i);
        results[i] = res;
      } catch (e) {
        results[i] = { error: e };
      }
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) workers.push(runner());
  await Promise.all(workers);
  return results;
}

export default function PokemonsByZone() {
  const [pokemons, setPokemons] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zonePokemons, setZonePokemons] = useState([]);
  const [loadingZone, setLoadingZone] = useState(false);
  const [zoneTheme, setZoneTheme] = useState('default');
  // when zoneTheme changes, apply class to body so background covers whole page
  useEffect(() => {
    try {
      const classes = Array.from(document.body.classList).filter((c) => c.startsWith('zone-'));
      classes.forEach((c) => document.body.classList.remove(c));
      if (zoneTheme) document.body.classList.add(`zone-${zoneTheme}`);
      return () => {
        // cleanup not strictly necessary but keep body clean
        if (zoneTheme) document.body.classList.remove(`zone-${zoneTheme}`);
      };
    } catch (e) {}
  }, [zoneTheme]);
  // auth: current user
  const [currentUser, setCurrentUser] = useState(() => {
    try { return localStorage.getItem('currentUser') || null; } catch (e) { return null; }
  });

  // roster: array of captured instances { id: uniqueInstanceId, originalId, currentId, name, image, level, xp }
  const [roster, setRoster] = useState([]);

  // load roster when currentUser changes (or on mount)
  useEffect(() => {
    function loadForUser(user) {
      try {
        if (!user) {
          // try legacy key first
          const legacy = localStorage.getItem('roster');
          if (legacy) {
            const parsed = JSON.parse(legacy || '[]');
            if (Array.isArray(parsed)) {
              setRoster(parsed);
              return;
            }
            if (parsed && typeof parsed === 'object') {
              const migrated = Object.keys(parsed).map((k, idx) => {
                const v = parsed[k] || {};
                return {
                  id: v.id || `${v.originalId || k}-migr-${idx}`,
                  originalId: v.originalId || Number(k) || v.currentId || null,
                  currentId: v.currentId || v.originalId || Number(k) || null,
                  name: v.name || '',
                  image: v.image || '',
                  level: v.level || 1,
                  xp: v.xp || 0,
                };
              });
              setRoster(migrated);
              return;
            }
          }
          setRoster([]);
          return;
        }
        const key = `roster:${user}`;
        const raw = localStorage.getItem(key) || '[]';
        const parsed = JSON.parse(raw || '[]');
        if (Array.isArray(parsed)) setRoster(parsed);
        else setRoster([]);
      } catch (e) {
        setRoster([]);
      }
    }
    loadForUser(currentUser);
    // listen for auth changes
    function onAuth(e) {
      const name = (e && e.detail) || localStorage.getItem('currentUser') || null;
      setCurrentUser(name);
      loadForUser(name);
    }
    window.addEventListener('authChanged', onAuth);
    function onStorage(e) {
      if (e.key === `currentUser`) {
        onAuth();
      }
    }
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('authChanged', onAuth);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Configuration: define zones by ranges (adjust as desired)
  const ZONE_SIZE = 15; // pokemons per zone
  const EARLY_ZONES = 3; // first N zones restrict capture to base-evolution
  // Increase XP per capture to make leveling faster
  const XP_PER_CAPTURE = 40;
  const EVOLVE_LEVEL = 16; // simple threshold (can be adapted to use real evolution-level data)
  // Reduce XP needed per level for faster progression
  const levelXp = (level) => Math.max(20, level * 60);

  // persist roster
  useEffect(() => {
    try {
      const key = currentUser ? `roster:${currentUser}` : 'roster';
      localStorage.setItem(key, JSON.stringify(roster));
    } catch (e) {}
  }, [roster]);

  const [captureResult, setCaptureResult] = useState({});

  const getMaxRosterLevel = () => {
    if (!roster || roster.length === 0) return 0;
    return Math.max(...roster.map((r) => r.level || 0));
  };

  

  const zoneRequiredLevel = (zone) => {
    // zone 1 requires 0, zone 2 requires 5, zone 3 requires 10, etc.
    return (zone.id - 1) * 5;
  };

  const isZoneUnlocked = (zone) => {
    return getMaxRosterLevel() >= zoneRequiredLevel(zone);
  };

  // Capture balance - reduced base chances for a tougher game
  const BASE_CAPTURE_CHANCE = 0.35; // base forms (was 0.7)
  const NONBASE_CAPTURE_CHANCE = 0.15; // evolved forms (was 0.35)
  const MAX_CAPTURE_BONUS = 0.15; // bonus from roster max level (was 0.2)
  // revive time for fainted roster pokemon (ms)
  const REVIVE_MS = 10 * 1000; // 10 seconds

  // time ticker to update revive countdowns in UI
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const addCaptured = (id, name, image) => {
    // default level 1
    addCapturedWithLevel(id, name, image, 1);
  };

  const addCapturedWithLevel = (id, name, image, level = 1) => {
    const instanceId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    setRoster((prev) => {
      const copy = [...prev];
      const entry = {
        id: instanceId,
        originalId: id,
        currentId: id,
        name,
        image,
        level: level,
        xp: 0,
      };
      copy.push(entry);
      // when capturing a pokemon, award XP to all captured (including the new one)
      copy.forEach((c) => {
        c.xp = (c.xp || 0) + XP_PER_CAPTURE;
        while (c.xp >= levelXp(c.level)) {
          c.xp -= levelXp(c.level);
          c.level += 1;
        }
      });
      return copy;
    });
    // fetch and attach types for this newly captured instance
    (async () => {
      try {
        const [types, baseStats] = await Promise.all([getPokemonTypes(id), getPokemonBaseStats(id)]);
        const instStats = computeInstanceStats(baseStats || {}, level);
        setRoster((prev) => {
          const copy = [...(prev || [])];
          const idx = copy.findIndex((c) => c.id === instanceId);
          if (idx !== -1) {
            copy[idx] = { ...copy[idx], types: types || [], baseStats: baseStats || null, stats: instStats };
          }
          return copy;
        });
      } catch (e) {
        // ignore
      }
    })();
  };

  const removeCaptured = (id) => {
    setRoster((prev) => prev.filter((p) => p.id !== id));
  };

  const attemptCapture = async (pokemon, canCapture) => {
    if (!canCapture) return;
    // compute chance
    const maxLevel = getMaxRosterLevel();
    const bonus = Math.min(MAX_CAPTURE_BONUS, maxLevel / 100);
    const base = pokemon.isBase ? BASE_CAPTURE_CHANCE : NONBASE_CAPTURE_CHANCE;
    const chance = Math.max(0.02, Math.min(0.98, base + bonus));
    const roll = Math.random();
    if (roll < chance) {
      // success
      addCaptured(pokemon.id, pokemon.name, pokemon.image);
      setCaptureResult((s) => ({ ...s, [pokemon.id]: { ok: true, msg: '¡Capturado!' } }));
      // ensure a wild appears after capturing directly
      try {
        console.debug('Direct capture succeeded, forcing spawn');
        setTimeout(() => {
          forceSpawn();
        }, 400);
      } catch (e) {}
    } else {
      setCaptureResult((s) => ({ ...s, [pokemon.id]: { ok: false, msg: 'Falló la captura' } }));
    }
    // clear message shortly
    setTimeout(() => {
      setCaptureResult((s) => {
        const copy = { ...s };
        delete copy[pokemon.id];
        return copy;
      });
    }, 2000);
  };

    const attemptCaptureWild = (wildPokemon) => {
        if (!wildPokemon) return;
        // respect cooldown per species
        if (captureCooldowns[wildPokemon.id]) return;
        const canCapture = true; // wild respects early-zone filtering already
      const maxLevel = getMaxRosterLevel();
      const bonus = Math.min(MAX_CAPTURE_BONUS, maxLevel / 100);
      const base = wildPokemon.isBase ? BASE_CAPTURE_CHANCE : NONBASE_CAPTURE_CHANCE;
      // increase chance slightly with wild level (higher-level wild slightly harder)
      const levelBonus = Math.min(0.12, wildPokemon.wildLevel / 100);
      // if the wild has been weakened in battle, increase capture chance proportionally
      // use a stronger multiplier so weaker HP significantly raises chance
      const hpFactor = wildPokemon.battle ? (1 - (wildPokemon.battle.wild.hp / wildPokemon.battle.wild.maxHp)) : 0;
      const hpBonus = hpFactor * 0.9; // up to +0.9 when the wild is almost fainted
      const chance = Math.max(0.01, Math.min(0.98, base + bonus + levelBonus + hpBonus));
      const roll = Math.random();
      if (roll < chance) {
        addCapturedWithLevel(wildPokemon.id, wildPokemon.name, wildPokemon.image, wildPokemon.wildLevel || 1);
        setCaptureResult((s) => ({ ...s, [wildPokemon.id]: { ok: true, msg: `¡Capturado (niv ${wildPokemon.wildLevel})!` } }));
        // set temporary cooldown for this species
        setCaptureCooldowns((prev) => ({ ...prev, [wildPokemon.id]: true }));
        setTimeout(() => {
          setCaptureCooldowns((prev) => {
            const copy = { ...prev };
            delete copy[wildPokemon.id];
            return copy;
          });
        }, COOLDOWN_MS);
          // remove wild from screen after successful capture, then force spawn a new one
          setTimeout(() => {
            setWild(null);
            try {
              // force spawn shortly after clearing
              setTimeout(() => {
                console.debug('Wild captured, forcing spawn');
                forceSpawn();
              }, 300);
            } catch (e) {}
          }, 200);
      } else {
          setCaptureResult((s) => ({ ...s, [wildPokemon.id]: { ok: false, msg: 'Falló la captura' } }));
          // chance to flee after a failed capture
          try {
            const FLEE_BASE = 0.25;
            const fleeChance = Math.min(0.6, FLEE_BASE + ((wildPokemon.wildLevel || 1) * 0.02));
            if (Math.random() < fleeChance) {
              setCaptureResult((s) => ({ ...s, [wildPokemon.id]: { ok: false, msg: '¡Se escapó!' } }));
              // remove wild from screen
              setTimeout(() => setWild(null), 300);
            }
          } catch (e) { /* ignore */ }
      }
      // clear message shortly
      setTimeout(() => {
        setCaptureResult((s) => {
          const copy = { ...s };
          delete copy[wildPokemon.id];
          return copy;
        });
      }, 2000);
    };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
        const data = await res.json();
        const list = data.results.map((p, idx) => ({
          id: idx + 1,
          name: p.name,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idx + 1}.png`,
        }));
        if (!mounted) return;
        setPokemons(list);
        // build zones
        const z = [];
        for (let i = 0; i < list.length; i += ZONE_SIZE) {
          const slice = list.slice(i, i + ZONE_SIZE);
          const zoneIndex = Math.floor(i / ZONE_SIZE);
          const zid = zoneIndex + 1;
          // zone level range: zone 1 -> 1-3, zone 2 -> 4-6, zone 3 -> 7-9, etc.
          const minLevel = zoneIndex * 3 + 1;
          const maxLevel = (zoneIndex + 1) * 3;
          z.push({
            id: zid,
            name: `Zona ${zid}`,
            startId: slice[0].id,
            endId: slice[slice.length - 1].id,
            count: slice.length,
            minLevel,
            maxLevel,
          });
        }
        setZones(z);
      } catch (err) {
        console.error('Error loading pokemon list', err);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  const openZone = async (zone) => {
    setSelectedZone(zone);
    // set an immediate fallback theme based on zone id so the background updates instantly
    try {
      const DEFAULT_ZONE_THEMES = ['forest','rock','water','volcanic','storm','tundra','spooky','sky','mystic','industrial','mountain','plain'];
      const fallback = DEFAULT_ZONE_THEMES[(zone.id - 1) % DEFAULT_ZONE_THEMES.length] || 'default';
      setZoneTheme(fallback);
    } catch (e) {
      setZoneTheme('default');
    }
    setZonePokemons([]);
    setLoadingZone(true);
    try {
      const list = pokemons.filter((p) => p.id >= zone.startId && p.id <= zone.endId);
      // For each pokemon in the zone, fetch species to determine if it's a base form
      const urls = list.map((p) => `https://pokeapi.co/api/v2/pokemon-species/${p.id}/`);
      const results = await fetchWithConcurrency(urls, async (url, i) => {
        const res = await fetch(url);
        if (!res.ok) return { isBase: false, error: true };
        const data = await res.json();
        // base form if evolves_from_species is null
        const isBase = data.evolves_from_species === null;
        return { isBase };
      });

      const mapped = list.map((p, i) => ({ ...p, isBase: !!results[i] && !!results[i].isBase }));
      // preload types for the zone (concurrency-limited)
      const ids = mapped.map((m) => m.id);
      const typeResults = await fetchWithConcurrency(ids, async (id) => {
        try {
          const [types, baseStats] = await Promise.all([getPokemonTypes(id), getPokemonBaseStats(id)]);
          return { types: types || [], baseStats: baseStats || null };
        } catch (e) {
          return { types: [], baseStats: null };
        }
      });
      const mappedWithTypes = mapped.map((m, i) => ({ ...m, types: typeResults[i].types || [], baseStats: typeResults[i].baseStats || null }));
      setZonePokemons(mappedWithTypes);
      // compute dominant type for theme
      try {
        const typeCounts = {};
        for (const m of mappedWithTypes) {
          (m.types || []).forEach((t) => { typeCounts[t] = (typeCounts[t] || 0) + 1; });
        }
        const entries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
        const topType = entries.length ? entries[0][0] : null;
        function mapTypeToTheme(t) {
          if (!t) return 'default';
          if (['grass', 'bug'].includes(t)) return 'forest';
          if (['rock', 'ground'].includes(t)) return 'rock';
          if (['water'].includes(t)) return 'water';
          if (['fire'].includes(t)) return 'volcanic';
          if (['electric'].includes(t)) return 'storm';
          if (['ice'].includes(t)) return 'tundra';
          if (['ghost', 'dark'].includes(t)) return 'spooky';
          if (['flying'].includes(t)) return 'sky';
          if (['fairy','psychic'].includes(t)) return 'mystic';
          if (['steel'].includes(t)) return 'industrial';
          if (['dragon'].includes(t)) return 'mountain';
          if (['normal'].includes(t)) return 'plain';
          return 'default';
        }
        const detected = mapTypeToTheme(topType);
        // only override the fallback if we detected a meaningful theme
        if (detected && detected !== 'default') setZoneTheme(detected);
      } catch (e) {
        setZoneTheme('default');
      }
    } catch (err) {
      console.error('Error loading zone pokemons', err);
    } finally {
      setLoadingZone(false);
    }
  };


  // Wild spawn logic: spawn a random pokemon from the zone periodically
  const [wild, setWild] = useState(null);
  const [captureCooldowns, setCaptureCooldowns] = useState({});
  const COOLDOWN_MS = 3000; // cooldown after successful capture (ms)
  // roster sorting
  const [sortKey, setSortKey] = useState('capturedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  // sorted roster view
  const sortedRoster = (() => {
    const copy = [...roster];
    const order = sortOrder === 'desc' ? -1 : 1;
    if (sortKey === 'level') {
      copy.sort((a, b) => (b.level - a.level) * order);
    } else if (sortKey === 'name') {
      copy.sort((a, b) => a.name.localeCompare(b.name) * order);
    } else if (sortKey === 'pokedex') {
      copy.sort((a, b) => (a.originalId - b.originalId) * order);
    } else {
      // default: captured order (most recent last) - we'll treat as newest first
      copy.sort((a, b) => (a.id < b.id ? 1 : -1) * order);
    }
    return copy;
  })();
  // spawn helper: picks a random pokemon from current zone (avoids repeating the same wild when possible)
  const spawnWild = () => {
    if (!selectedZone || !zonePokemons.length) return;
    setWild((prevWild) => {
      // don't spawn a new wild if there's an active battle ongoing
      if (prevWild && prevWild.battle && !prevWild.battle.ended) return prevWild;
      const zoneIndex = selectedZone.id - 1;
      const pool = zonePokemons.filter((p) => (zoneIndex < EARLY_ZONES ? p.isBase : true));
      if (!pool.length) return prevWild;
      // try to avoid picking the same as current wild
      let pick = pool[Math.floor(Math.random() * pool.length)];
      if (prevWild && pool.length > 1) {
        let attempts = 0;
        while (pick.id === prevWild.id && attempts < 6) {
          pick = pool[Math.floor(Math.random() * pool.length)];
          attempts += 1;
        }
      }
      const minL = (selectedZone && selectedZone.minLevel) || 1;
      const maxL = (selectedZone && selectedZone.maxLevel) || Math.max(1, selectedZone.id * 3);
      const lvl = Math.floor(Math.random() * (maxL - minL + 1)) + minL;
      const w = { ...pick, wildLevel: lvl, appearedAt: Date.now() };
      // fetch types and base stats asynchronously and attach
      (async () => {
        try {
          const [types, baseStats] = await Promise.all([getPokemonTypes(pick.id), getPokemonBaseStats(pick.id)]);
          const instStats = computeInstanceStats(baseStats || {}, lvl);
          setWild((cur) => (cur && cur.id === pick.id ? { ...cur, types, baseStats, stats: instStats } : cur));
        } catch (e) {}
      })();
      return w;
    });
  };

  // Force spawn: generate a new wild regardless of current battle state (used after capture/victory)
  const forceSpawn = () => {
    if (!selectedZone || !zonePokemons.length) return;
    const zoneIndex = selectedZone.id - 1;
    const pool = zonePokemons.filter((p) => (zoneIndex < EARLY_ZONES ? p.isBase : true));
    if (!pool.length) return;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    // try to avoid picking the same as current wild if any
    if (wild && pool.length > 1) {
      let attempts = 0;
      while (pick.id === wild.id && attempts < 6) {
        pick = pool[Math.floor(Math.random() * pool.length)];
        attempts += 1;
      }
    }
    const minL = (selectedZone && selectedZone.minLevel) || 1;
    const maxL = (selectedZone && selectedZone.maxLevel) || Math.max(1, selectedZone.id * 3);
    const lvl = Math.floor(Math.random() * (maxL - minL + 1)) + minL;
    const w = { ...pick, wildLevel: lvl, appearedAt: Date.now() };
    setWild(w);
    (async () => {
      try {
        const [types, baseStats] = await Promise.all([getPokemonTypes(pick.id), getPokemonBaseStats(pick.id)]);
        const instStats = computeInstanceStats(baseStats || {}, lvl);
        setWild((cur) => (cur && cur.id === pick.id ? { ...cur, types, baseStats, stats: instStats } : cur));
      } catch (e) {}
    })();
  };

  useEffect(() => {
    // No spawn timer: when a zone opens we spawn once. Subsequent spawns happen
    // either manually or when a battle is won (handled elsewhere).
    if (!selectedZone || !zonePokemons.length) return;
    spawnWild();
    return undefined;
  }, [selectedZone, zonePokemons]);

  // removeCaptured/adding handled via addCapturedWithLevel/removeCaptured

  // evolve a captured instance (basic flow: fetch evolution chain and pick first next evolution)
  const handleEvolveInstance = async (instanceId) => {
    const idx = roster.findIndex((r) => r.id === instanceId);
    if (idx === -1) return;
    const entry = roster[idx];
    try {
      const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${entry.currentId}/`);
      if (!speciesRes.ok) return;
      const species = await speciesRes.json();
      if (!species.evolution_chain || !species.evolution_chain.url) return;
      const chainRes = await fetch(species.evolution_chain.url);
      if (!chainRes.ok) return;
      const chain = await chainRes.json();
      function findNode(node, name) {
        if (!node) return null;
        if (node.species && node.species.name === name) return node;
        for (const child of node.evolves_to || []) {
          const found = findNode(child, name);
          if (found) return found;
        }
        return null;
      }
      const node = findNode(chain.chain, entry.name);
      if (!node) return;
      const next = (node.evolves_to && node.evolves_to[0]) || null;
      if (!next) return;
      const nextSpeciesUrl = next.species.url; // .../pokemon-species/{id}/
      const parts = nextSpeciesUrl.split('/').filter(Boolean);
      const nextId = parseInt(parts[parts.length - 1], 10);
      if (!nextId) return;
      // update roster entry
      setRoster((prev) => {
        const copy = [...prev];
        const e = { ...copy[idx] };
        e.currentId = nextId;
        e.name = next.species.name;
        e.image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nextId}.png`;
        copy[idx] = e;
        return copy;
      });
    } catch (err) {
      console.error('Error evolving', err);
    }
  };

  return (
    <div className={`pokemonsPage ${zoneTheme ? `zone-${zoneTheme}` : ''}`}>
      <h2>Zonas</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {zones.map((z) => {
          const unlocked = isZoneUnlocked(z) || z.id === 1;
          return (
            <button
              key={z.id}
              onClick={() => unlocked && openZone(z)}
              disabled={!unlocked}
              className={selectedZone && selectedZone.id === z.id ? 'activeZone' : ''}
              title={!unlocked ? `Requiere nivel ${zoneRequiredLevel(z)} para desbloquear` : ''}
            >
              {z.name} ({z.startId}-{z.endId})
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        {selectedZone ? (
          <div>
            <h3>{selectedZone.name}</h3>
              {loadingZone ? (
              <p>Cargando pokemons de la zona...</p>
            ) : (
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 2 }}>
                  {/* Wild spawn area */}
                  {wild && (
                    <div className='pokemonCard' style={{ border: '2px solid #444' }}>
                      <img src={wild.image} alt={wild.name} />
                      <h2>{wild.name} (Nivel {wild.wildLevel})</h2>
                      <p>{wild.isBase ? 'Primera etapa' : 'Evolución posterior'}</p>
                      {/* Battle system state */}
                      {!(wild.battle && wild.battle.ended) && (
                        <div style={{ marginTop: 8 }}>
                          <small style={{ color: '#888' }}>Un Pokémon salvaje aparece — empieza la batalla si atacas.</small>
                        </div>
                      )}
                        <div className='buttonCapturar' style={{ marginTop: 8 }}>
                        <button onClick={() => attemptCaptureWild(wild)} disabled={!!captureCooldowns[wild.id]}>Capturar</button>
                        <button style={{ marginLeft: 8 }} onClick={() => {
                          // start battle if not started: initialize with no selected battler
                          setWild((w) => {
                            if (!w) return w;
                            if (!w.battle) {
                              const wildHp = Math.max(5, w.wildLevel * 8);
                              return { ...w, battle: { player: { id: null, hp: 0, maxHp: 0 }, wild: { hp: wildHp, maxHp: wildHp }, log: [], ended: false } };
                            }
                            return w;
                          });
                        }}>Luchar</button>
                      </div>
                      {captureResult[wild.id] && <div style={{ marginTop: 6 }}>{captureResult[wild.id].msg}</div>}
                      {/* Battle UI */}
                      {wild.battle && (
                        <div style={{ marginTop: 10, textAlign: 'left' }}>
                          <div>
                            <strong>Salvaje</strong>
                            <div className='hpBar' style={{ marginTop: 6 }}>
                              <div className='hpFill' style={{ width: `${Math.round((wild.battle.wild.hp / wild.battle.wild.maxHp) * 100)}%` }} />
                            </div>
                            <div className='hpLabel'>{wild.battle.wild.hp}/{wild.battle.wild.maxHp}</div>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <strong>Tú</strong>
                            <div className='hpBar' style={{ marginTop: 6 }}>
                              <div className='hpFill' style={{ width: `${Math.round((wild.battle.player.hp / wild.battle.player.maxHp) * 100)}%` }} />
                            </div>
                            <div className='hpLabel'>{wild.battle.player.hp}/{wild.battle.player.maxHp}</div>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            {/* Selector para elegir el Pokémon que luchará */}
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ fontSize: 13, marginRight: 8 }}>Pokémon para luchar:</label>
                              <select
                                value={(wild.battle && wild.battle.player && wild.battle.player.id) || ''}
                                onChange={async (e) => {
                                  const sel = e.target.value || null;
                                  setWild((w) => {
                                    if (!w || !w.battle) return w;
                                    const b = { ...w.battle };
                                    if (!sel) {
                                      b.player = { id: null, hp: 0, maxHp: 0 };
                                    } else {
                                      const inst = roster.find((r) => r.id === sel);
                                      // if the selected pokemon is fainted and still in revive cooldown, do not allow selection
                                      if (inst && inst.faintedUntil && inst.faintedUntil > Date.now()) {
                                        return w; // ignore selection of fainted
                                      }
                                      const maxHp = inst ? Math.max(8, inst.level * 8 + 10) : 10;
                                      b.player = { id: sel, hp: maxHp, maxHp };
                                      b.log = [...(b.log || []), `Seleccionaste a ${inst ? inst.name : 'tu Pokémon'} para luchar.`];
                                    }
                                    return { ...w, battle: b };
                                  });
                                  // if selected instance lacks types, fetch and attach
                                  if (sel) {
                                    const inst = roster.find((r) => r.id === sel);
                                    if (inst && (!inst.types || inst.types.length === 0)) {
                                      try {
                                        const types = await getPokemonTypes(inst.originalId || inst.currentId || inst.currentId);
                                        setRoster((prev) => {
                                          const copy = [...(prev || [])];
                                          const idx = copy.findIndex((c) => c.id === sel);
                                          if (idx !== -1) copy[idx] = { ...copy[idx], types };
                                          return copy;
                                        });
                                      } catch (e) {}
                                    }
                                  }
                                }}
                              >
                                <option value=''>-- Ninguno --</option>
                                {roster.map((r) => {
                                  const disabled = r.faintedUntil && r.faintedUntil > Date.now();
                                  return (
                                    <option key={r.id} value={r.id} disabled={disabled}>{`${r.name} (Lv ${r.level})${disabled ? ' — Debilitado' : ''}`}</option>
                                  );
                                })}
                              </select>
                            </div>

                            <button onClick={() => {
                              // perform one round: wild attacks, then player attacks (if alive)
                              setWild((w) => {
                                if (!w || !w.battle || w.battle.ended) return w;
                                const b = { ...w.battle };
                                const rnd = (n) => Math.floor(Math.random() * n) + 1;
                                // determine speeds and order using stats when available
                                const wildStats = (w && w.stats) || { hp: Math.max(8, (w && w.wildLevel) * 8 + 10), attack: 6, defense: 6, speed: 5 };
                                const playerEntry = roster.find((r) => r.id === b.player.id) || {};
                                const playerStats = playerEntry.stats || { hp: b.player.maxHp || 10, attack: Math.max(5, (playerEntry.level || 1) * 2), defense: 6, speed: 5 };
                                const wildTypes = (w && w.types) || [];
                                const playerTypes = playerEntry.types || [];
                                // decide who attacks first by speed
                                const wildSpeed = wildStats.speed || 1;
                                const playerSpeed = playerStats.speed || 1;
                                const playerFirst = playerSpeed >= wildSpeed;
                                function doWildAttack() {
                                  const dmg = Math.max(1, Math.floor(((wildStats.attack || 6) / (playerStats.defense || 6)) * (8 + (w.wildLevel || 1)) * typeMultiplier(wildTypes, playerTypes)));
                                  b.player.hp = Math.max(0, b.player.hp - dmg);
                                  b.log = [...b.log, `Salvaje causó ${dmg} de daño.`];
                                }
                                function doPlayerAttack() {
                                  const dmg = Math.max(1, Math.floor(((playerStats.attack || 6) / (wildStats.defense || 6)) * (8 + (playerEntry.level || 1)) * typeMultiplier(playerTypes, wildTypes)));
                                  b.wild.hp = Math.max(0, b.wild.hp - dmg);
                                  b.log = [...b.log, `Tu Pokémon causó ${dmg} de daño.`];
                                }
                                if (playerFirst) {
                                  if (b.player.hp > 0 && b.player.id) doPlayerAttack();
                                  if (b.wild.hp > 0) doWildAttack();
                                } else {
                                  doWildAttack();
                                  if (b.player.hp > 0 && b.player.id) doPlayerAttack();
                                }
                                // check end
                                let spawnedAfterWin = false;
                                  if (b.wild.hp <= 0) {
                                    b.ended = true;
                                    b.log = [...b.log, '¡Has debilitado al salvaje! Puedes intentar capturarlo con mayor probabilidad.'];
                                  // award battle XP: majority to the battling pokemon, small share to others
                                  try {
                                    const xpTotal = Math.max(10, w.wildLevel * 15);
                                    const activeId = b.player.id;
                                    const activeXP = Math.ceil(xpTotal * 0.7);
                                    const othersXP = xpTotal - activeXP;
                                    setRoster((prev) => {
                                      if (!prev || prev.length === 0) return prev;
                                      const copy = prev.map((c) => ({ ...c }));
                                      const othersCount = copy.length > 1 ? copy.length - 1 : 0;
                                      for (let i = 0; i < copy.length; i++) {
                                        if (copy[i].id === activeId) {
                                          copy[i].xp = (copy[i].xp || 0) + activeXP;
                                          while (copy[i].xp >= levelXp(copy[i].level)) {
                                            copy[i].xp -= levelXp(copy[i].level);
                                            copy[i].level += 1;
                                          }
                                        } else if (othersCount > 0) {
                                          const share = Math.floor(othersXP / othersCount);
                                          copy[i].xp = (copy[i].xp || 0) + share;
                                          while (copy[i].xp >= levelXp(copy[i].level)) {
                                            copy[i].xp -= levelXp(copy[i].level);
                                            copy[i].level += 1;
                                          }
                                        }
                                      }
                                      return copy;
                                    });
                                  } catch (e) {
                                    console.error('Error awarding battle XP', e);
                                  }
                                  spawnedAfterWin = true;
                                }
                                if (b.player.hp <= 0) {
                                  // mark player pokemon as fainted until now + REVIVE_MS
                                  b.player.hp = 0;
                                  b.log = [...b.log, 'Tu Pokémon se debilitó. Espera para que se recupere o cambia a otro.'];
                                  b.player.ended = true;
                                  b.ended = false; // keep battle alive if possible
                                  // mark roster entry with faintedUntil timestamp
                                  try {
                                    const faintedId = b.player.id;
                                    if (faintedId) {
                                      setRoster((prev) => {
                                        const copy = prev.map((c) => ({ ...c }));
                                        const idx2 = copy.findIndex((c) => c.id === faintedId);
                                        if (idx2 !== -1) {
                                          copy[idx2].faintedUntil = Date.now() + REVIVE_MS;
                                        }
                                        return copy;
                                      });
                                    }
                                  } catch (e) {}
                                    // check if there is any other available pokemon to continue
                                    try {
                                      const othersAvailable = (roster || []).some((c) => c.id !== b.player.id && !(c.faintedUntil && c.faintedUntil > Date.now()));
                                      if (!othersAvailable) {
                                        // no available pokemon -> end battle
                                        b.ended = true;
                                        b.log = [...b.log, 'No te quedan Pokémon disponibles. La batalla terminó.'];
                                      }
                                    } catch (e) {}
                                  }
                                const newW = { ...w, battle: b };
                                // schedule spawn of next wild if we won
                                if (spawnedAfterWin) {
                                  setTimeout(() => {
                                    // clear current wild first
                                    setWild(null);
                                    // small delay then spawn next
                                    setTimeout(() => forceSpawn(), 600);
                                  }, 400);
                                }
                                return newW;
                              });
                            }}>Atacar</button>
                            <button style={{ marginLeft: 8 }} onClick={() => {
                              // if battle ended and wild fainted, allow capture; otherwise attempt capture in-battle
                              if (wild.battle && wild.battle.ended && wild.battle.wild.hp <= 0) {
                                attemptCaptureWild(wild);
                                // after attempt, clear wild if captured
                                setTimeout(() => setWild(null), 800);
                              } else {
                                attemptCaptureWild(wild);
                              }
                            }} disabled={!!captureCooldowns[wild.id]}>Intentar Capturar</button>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            {wild.battle.log.slice(-5).map((l, i) => <div key={i} style={{ fontSize: 12 }}>{l}</div>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <h4 style={{ marginTop: 12 }}>Especies en la zona</h4>
                  <div className='pokemonList'>
                    {zonePokemons
                      .filter((pokemon) => {
                        const zoneIndex = selectedZone.id - 1;
                        if (zoneIndex < EARLY_ZONES) return pokemon.isBase;
                        return true;
                      })
                      .map((pokemon) => {
                        const count = roster.filter((r) => r.originalId === pokemon.id).length;
                        return (
                          <div className='pokemonCard' key={pokemon.id}>
                            <img src={pokemon.image} alt={pokemon.name} />
                            <h2>{pokemon.name}</h2>
                            <p>{pokemon.isBase ? 'Primera etapa' : 'Evolución posterior'}</p>
                            <p>En tu equipo: {count}</p>
                            
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 220 }}>
                  <h4>Tu Roster</h4>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: 12 }}>Ordenar por:</label>
                    <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                      <option value='capturedAt'>Reciente</option>
                      <option value='level'>Nivel</option>
                      <option value='name'>Nombre</option>
                      <option value='pokedex'>N.º Pokédex</option>
                    </select>
                    <button onClick={() => setSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))} style={{ marginLeft: 8 }}>
                      {sortOrder === 'desc' ? 'Desc' : 'Asc'}
                    </button>
                  </div>
                  {roster.length === 0 ? (
                    <p>No tienes Pokémon capturados aún.</p>
                  ) : (
                    <div>
                      {sortedRoster.map((r) => (
                        <div key={r.id} className='pokemonCard' style={{ marginBottom: 8, padding: 6 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <img src={r.image} alt={r.name} style={{ width: 56, height: 56 }} />
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <div style={{ fontWeight: 600 }}>{r.name}</div>
                              <div style={{ fontSize: 12, color: '#444' }}>
                                Nivel: {r.level} • XP: {r.xp}/{levelXp(r.level)}
                                {r.faintedUntil && r.faintedUntil > now ? (
                                  <div style={{ fontSize: 11, color: '#a00' }}>Debilitado — revive en {Math.ceil((r.faintedUntil - now) / 1000)}s</div>
                                ) : null}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <button onClick={() => removeCaptured(r.id)} style={{ fontSize: 12, padding: '4px 8px' }}>Liberar</button>
                              <button onClick={() => handleEvolveInstance(r.id)} disabled={r.level < EVOLVE_LEVEL} style={{ fontSize: 12, padding: '4px 8px' }}>
                                Evolucionar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p>Selecciona una zona para ver los pokemons.</p>
        )}
      </div>
    </div>
  );
}
