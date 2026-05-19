export type Rarity = 
  | 'common' 
  | 'uncommon' 
  | 'rare' 
  | 'holographic' 
  | 'ultra-rare' 
  | 'shiny'
  | 'secret'
  | 'super-secret'
  | 'ultra-secret'
  | 'divine';

export type PokemonType =
  | 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Psychic' | 'Colorless'
  | 'Normal' | 'Fighting' | 'Poison' | 'Ground' | 'Rock' | 'Steel' | 'Metal'
  | 'Ice' | 'Dragon' | 'Ghost' | 'Bug' | 'Flying' | 'Darkness' | 'Lightning';

export interface Card {
  id: string;
  pokemonId: number;
  name: string;
  rarity: Rarity;
  hp: number;
  type: string; // Lo cambiamos a string para evitar errores con tipos mixtos de la API
  attack: number;
  defense: number;
  imageUrl: string;
}

export interface AlbumEntry {
  card: Card;
  quantity: number;
  obtainedAt: string;
}
