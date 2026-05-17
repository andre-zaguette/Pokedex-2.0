import { Injectable, NotFoundException } from '@nestjs/common';

type PokeApiListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{ name: string; url: string }>;
};

type PokeApiPokemon = {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    other?: {
      'official-artwork'?: {
        front_default: string | null;
      };
    };
  };
  types: Array<{
    slot: number;
    type: { name: string };
  }>;
};

@Injectable()
export class PokemonService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private cachedList: Array<{ name: string; url: string }> | null = null;

  private async getAllPokemon() {
    if (this.cachedList) return this.cachedList;

    const response = await fetch(`${this.baseUrl}/pokemon?limit=2000&offset=0`);
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as PokeApiListResponse;
    this.cachedList = data.results;
    return this.cachedList;
  }

  private readonly regionRanges: Record<string, { min: number; max: number }> = {
    kanto: { min: 1, max: 151 },
    johto: { min: 152, max: 251 },
    hoenn: { min: 252, max: 386 },
    sinnoh: { min: 387, max: 493 },
    unova: { min: 494, max: 649 },
    kalos: { min: 650, max: 721 },
    alola: { min: 722, max: 809 },
    galar: { min: 810, max: 898 },
    paldea: { min: 905, max: 1025 },
  };

  async search(search?: string, limit = 12, offset = 0, region?: string) {
    const normalizedLimit = Math.min(Math.max(limit, 1), 50);
    const results = await this.getAllPokemon();

    const filtered = results.filter((pokemon) => {
      const id = parseInt(pokemon.url.split('/').filter(Boolean).pop() || '0');
      
      const matchesSearch = search ? pokemon.name.toLowerCase().includes(search.toLowerCase()) : true;
      
      if (region && this.regionRanges[region]) {
        const { min, max } = this.regionRanges[region];
        return matchesSearch && id >= min && id <= max;
      }
      
      return matchesSearch;
    });

    const paginated = filtered.slice(offset, offset + normalizedLimit);
    const detailed = await Promise.all(
      paginated.map(async (pokemon) => this.getByNameOrId(pokemon.name)),
    );

    return {
      total: filtered.length,
      items: detailed,
      hasMore: offset + normalizedLimit < filtered.length,
    };
  }

  async getByNameOrId(nameOrId: string | number) {
    const [pokemonRes, speciesRes] = await Promise.all([
      fetch(`${this.baseUrl}/pokemon/${nameOrId}`),
      fetch(`${this.baseUrl}/pokemon-species/${nameOrId}`),
    ]);

    if (!pokemonRes.ok) {
      throw new NotFoundException('Pokemon not found.');
    }

    const data = (await pokemonRes.json()) as any;
    const speciesData = speciesRes.ok ? ((await speciesRes.json()) as any) : null;

    const stats = {
      hp: data.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 0,
      atk: data.stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 0,
      def: data.stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 0,
      satk: data.stats.find((s: any) => s.stat.name === 'special-attack')?.base_stat || 0,
      sdef: data.stats.find((s: any) => s.stat.name === 'special-defense')?.base_stat || 0,
      spd: data.stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 0,
    };

    const varieties = speciesData?.varieties?.map((v: any) => ({
      name: v.pokemon.name,
      is_default: v.is_default,
      pokemonId: v.pokemon.url.split('/').filter(Boolean).pop()
    })) || [];

    const other = data.sprites.other;
    const official = other?.['official-artwork'];
    const home = other?.home;

    // 3D Mastery: We strictly use 'Home' artwork as our primary style.
    const mainArt = home?.front_default || official?.front_default || data.sprites.front_default;
    const femaleArt = home?.front_female || mainArt;
    const shinyArt = home?.front_shiny || official?.front_shiny || data.sprites.front_shiny || mainArt;
    const femaleShinyArt = home?.front_shiny_female || shinyArt;

    // Extract Description (Flavor Text)
    const description = speciesData?.flavor_text_entries
      ?.find((entry: any) => entry.language.name === 'en' || entry.language.name === 'pt')
      ?.flavor_text.replace(/[\n\f]/g, ' ') || 'No description available.';

    // Fetch Effectiveness & Ability Details
    const typeUrls = data.types.map((t: any) => t.type.url);
    const abilityUrls = data.abilities.map((a: any) => a.ability.url);

    const [typesDetailedRes, abilitiesDetailedRes] = await Promise.all([
      Promise.all(typeUrls.map((url: string) => fetch(url).then(r => r.json()))),
      Promise.all(abilityUrls.map((url: string) => fetch(url).then(r => r.json())))
    ]);

    const weaknesses = new Set<string>();
    const resistances = new Set<string>();

    typesDetailedRes.forEach((t: any) => {
      t.damage_relations.double_damage_from.forEach((d: any) => weaknesses.add(d.name));
      t.damage_relations.half_damage_from.forEach((d: any) => resistances.add(d.name));
      t.damage_relations.no_damage_from.forEach((d: any) => resistances.add(d.name));
    });

    const abilitiesDetails = abilitiesDetailedRes.map((a: any) => ({
      name: a.name,
      description: a.effect_entries.find((e: any) => e.language.name === 'en')?.short_effect || 'No description.'
    }));

    // Extract Held Items
    const heldItems = data.held_items?.map((i: any) => i.item.name) || [];

    // Extract Top 15 Level-up Moves
    const moves = (data.moves || [])
      .filter((m: any) => m.version_group_details[0]?.move_learn_method?.name === 'level-up' && m.version_group_details[0]?.level_learned_at > 0)
      .sort((a: any, b: any) => a.version_group_details[0].level_learned_at - b.version_group_details[0].level_learned_at)
      .slice(0, 15)
      .map((m: any) => ({
        name: m.move.name,
        level: m.version_group_details[0].level_learned_at
      }));

    // Fetch Evolution Chain
    let evolutionChain: any[] = [];
    if (speciesData?.evolution_chain?.url) {
      try {
        const evoRes = await fetch(speciesData.evolution_chain.url);
        if (evoRes.ok) {
          const evoData = await evoRes.json();
          const chain = [];
          let current = evoData.chain;
          while (current) {
            const speciesId = current.species.url.split('/').filter(Boolean).pop();
            chain.push({
              id: parseInt(speciesId),
              name: current.species.name,
              spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${speciesId}.png`
            });
            current = current.evolves_to[0];
          }
          evolutionChain = chain;
        }
      } catch (e) {
        console.error('Evo chain fetch failed');
      }
    }

    return {
      id: data.id,
      name: data.name,
      spriteUrl: mainArt,
      femaleSpriteUrl: femaleArt,
      shinySpriteUrl: shinyArt,
      femaleShinySpriteUrl: femaleShinyArt,
      artworkUrl: mainArt,
      types: data.types
        .sort((left: any, right: any) => left.slot - right.slot)
        .map((item: any) => item.type.name),
      weight: data.weight,
      height: data.height,
      abilities: data.abilities.map((a: any) => a.ability.name),
      genderRate: speciesData?.gender_rate ?? -1,
      description,
      cryUrl: data.cries?.latest || data.cries?.legacy || null,
      effectiveness: {
        weaknesses: Array.from(weaknesses).filter(w => !resistances.has(w)),
        resistances: Array.from(resistances)
      },
      abilitiesDetails,
      heldItems,
      moves,
      stats,
      varieties,
      evolutionChain
    };
  }
}
