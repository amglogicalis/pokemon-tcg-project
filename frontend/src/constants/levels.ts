import React from 'react';

export interface LevelStyle {
  dark: string;
  base: string;
  bright: string;
  name: string;
  gradient?: string; // Gradiente personalizado opcional para rangos divinos
}

export function getLevelStyle(level: number): LevelStyle {
  if (level <= 10) {
    // Rango 1: 1 - 10 Menta Novato (Verde Menta Suave)
    // Sensación inicial, amigable, colores planos de inicio.
    return { dark: '#065F46', base: '#10B981', bright: '#6EE7B7', name: 'Menta Novato' };
  } else if (level <= 50) {
    // Rango 2: 11 - 50 Azul Cobalto (Azul Eléctrico)
    // El clásico azul de rareza rara, limpio y vibrante.
    return { dark: '#1E3A8A', base: '#3B82F6', bright: '#93C5FD', name: 'Azul Cobalto' };
  } else if (level <= 100) {
    // Rango 3: 51 - 100 Ciber-Púrpura (Violeta Digital)
    // Rareza épica, colores de transición cibernética.
    return { dark: '#581C87', base: '#8B5CF6', bright: '#C084FC', name: 'Ciber-Púrpura' };
  } else if (level <= 250) {
    // Rango 4: 101 - 250 Fresa Neón (Rosa / Magenta Láser)
    // Vibración radical y muy llamativa antes de entrar a la élite.
    return { dark: '#9D174D', base: '#EC4899', bright: '#FBCFE8', name: 'Fresa Neón' };
  } else if (level <= 500) {
    // Rango 5: 251 - 500 Oro Líquido (Gleam Gold)
    // El oro prestigioso universal del esfuerzo medio-alto.
    return { dark: '#78350F', base: '#EAB308', bright: '#FEF9C3', name: 'Sol Dorado' };
  } else if (level <= 1000) {
    // Rango 6: 501 - 1000 Trueno de Rubí (Fusión Térmica)
    // Mezcla bordes de rojo carmesí oscuro, cuerpo escarlata ardiente 
    // y un destello central de rayo cian neón eléctrico.
    return { dark: '#7F1D1D', base: '#EF4444', bright: '#22D3EE', name: 'Trueno de Rubí (Fusión Térmica)' };
  } else if (level <= 2000) {
    // Rango 7: 1001 - 2000 Verde Nuclear (Fuego de Ácido)
    // Un verde químico de residuos radiactivos supercargados.
    // Mezcla un borde verde petróleo oscuro, cuerpo verde nuclear brillante y destello amarillo fosforescente.
    return { dark: '#115E59', base: '#16A34A', bright: '#EAFF2F', name: 'Verde Nuclear (Fuego de Ácido)' };
  } else if (level <= 5000) {
    // Rango 8: 2001 - 5000 Tormenta de Plasma (Púrpura Profundo a Rosa Láser)
    // Púrpura imperial oscuro, cuerpo de transición índigo y un centro rosa neón deslumbrante.
    return { dark: '#4C1D95', base: '#6366F1', bright: '#F472B6', name: 'Tormenta de Plasma' };
  } else if (level <= 10000) {
    // Rango 9: 5001 - 10000 Eclipse de Supernova (Obsidiana Burgundy a Verde Ácido Fosforescente)
    // Bordes de obsidiana cereza, cuerpo de magma naranja y un destello láser verde ácido.
    return { dark: '#4C0519', base: '#EA580C', bright: '#EAFF2F', name: 'Eclipse de Supernova' };
  } else {
    // Rango 10: 10000+ Supercúmulo de Galaxias (Nébula Estelar Activa V2)
    // ¡EL PINÁCULO COSMOLÓGICO ABSOLUTO!
    // Hemos incorporado el color AZUL CELESTE (#38BDF8) en el patrón principal de la galaxia.
    // Rediseñamos los 3 patrones de estrellas deslizantes para ajustarse a las especificaciones exactas:
    // - Estrella 1: Convertida de blanco a un hermoso AMARILLO MUY CLARO (#FFFDE3).
    // - Estrella 2: Mantenida como una vibrante estrella AMARILLA NEÓN (#FDE047) en el núcleo fucsia.
    // - Estrella 3: Convertida de blanco a un NARANJA INTENSO Y BRILLANTE PERO ALGO OSCURO (#C2410C) de cobre espacial.
    // Flujo estelar: Navy ➔ Índigo ➔ Estrella Amarilla Clara ➔ Azul Celeste ➔ Fucsia ➔ Estrella Amarilla ➔ Fucsia ➔ Azul Celeste ➔ Estrella Naranja Profunda ➔ Índigo ➔ Navy.
    return {
      dark: '#1E3A8A',
      base: '#4F46E5',
      bright: '#D946EF',
      name: 'Supercúmulo de Galaxias (Cosmos de Neón)',
      gradient: 'linear-gradient(90deg, #1E3A8A 0%, #4F46E5 10%, #fdf8aaff 18%, #4F46E5 24%, #38BDF8 35%, #D946EF 45%, #FDE047 52%, #D946EF 59%, #38BDF8 70%, #C2410C 78%, #4F46E5 86%, #1E3A8A 100%)'
    };
  }
}

export function getLevelTextStyle(level: number): React.CSSProperties {
  const style = getLevelStyle(level);
  const gradient = style.gradient ?? `linear-gradient(90deg, ${style.dark} 0%, ${style.base} 25%, ${style.bright} 50%, ${style.base} 75%, ${style.dark} 100%)`;
  return {
    backgroundImage: gradient,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    display: 'inline-block'
  };
}

export function getXpNeededForLevel(level: number): number {
  if (level <= 10) return 100;
  if (level <= 50) return 100;
  if (level <= 100) return 100;
  if (level <= 250) return 150;
  if (level <= 500) return 150;
  if (level <= 1000) return 200;
  if (level <= 2000) return 250;
  if (level <= 5000) return 300;
  if (level <= 10000) return 300;
  return 600;
}

