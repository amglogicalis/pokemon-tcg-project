/**
 * Servicio de música singleton a nivel de módulo.
 *
 * Exporta las instancias de Audio compartidas para toda la aplicación.
 * La lógica de reproducción y desbloqueo de autoplay se maneja
 * a nivel de componente para evitar activaciones fuera de las vistas deseadas.
 */

export const homeMusic = new Audio('/sounds/home-music.mp3');
homeMusic.loop = true;
homeMusic.volume = 0.35;

export const packMusic = new Audio('/sounds/while-op-pack.mp3');
packMusic.loop = true;
packMusic.volume = 0.35;

export const unlockAllAudio = () => {
  [homeMusic, packMusic].forEach(audio => {
    if (audio.paused) {
      audio.play().then(() => {
        audio.pause();
      }).catch(() => {});
    }
  });
};
