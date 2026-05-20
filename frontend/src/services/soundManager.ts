// frontend/src/services/soundManager.ts

let isGlobalMuted = false;

// Check localStorage in a safe browser-environment check
if (typeof window !== 'undefined') {
  isGlobalMuted = localStorage.getItem('global_mute_sound') === 'true';
}

// Track active audio instances using WeakRef to prevent memory leaks
let activeAudios: Array<WeakRef<any>> = [];

const OriginalAudio = typeof window !== 'undefined' ? window.Audio : null;

if (typeof window !== 'undefined' && OriginalAudio) {
  class PatchedAudio extends OriginalAudio {
    public _originalVolume: number = 1.0;

    constructor(src?: string) {
      super(src);
      // Grab initial default volume (usually 1.0)
      this._originalVolume = super.volume;

      if (isGlobalMuted) {
        super.volume = 0;
      }

      // Add to our weak tracking array
      activeAudios.push(new WeakRef(this));
    }

    // Override volume getter/setter to preserve original volume intent
    get volume(): number {
      return this._originalVolume;
    }

    set volume(val: number) {
      this._originalVolume = val;
      if (isGlobalMuted) {
        super.volume = 0;
      } else {
        super.volume = val;
      }
    }
  }

  // Override globally
  (window as any).Audio = PatchedAudio;
}

// Toggle mute function
export const setGlobalMute = (mute: boolean) => {
  isGlobalMuted = mute;
  if (typeof window !== 'undefined') {
    localStorage.setItem('global_mute_sound', String(mute));
    // Dispatch a custom event to notify React components of changes
    window.dispatchEvent(new CustomEvent('globalMuteChange', { detail: { mute } }));
  }

  // Update volume of all active playing instances
  // We must use the native HTMLMediaElement volume setter directly,
  // since `volume` is an accessor property — NOT a callable function.
  const nativeVolumeSetter = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    'volume'
  )?.set;

  if (nativeVolumeSetter) {
    const updatedList: Array<WeakRef<any>> = [];

    activeAudios.forEach((ref) => {
      const audio = ref.deref();
      if (audio) {
        try {
          const targetVolume = mute ? 0 : (audio._originalVolume ?? 1);
          nativeVolumeSetter.call(audio, targetVolume);
        } catch (e) {
          console.warn('Error updating volume on active audio ref:', e);
        }
        updatedList.push(ref);
      }
    });

    activeAudios = updatedList;
  }
};

export const getGlobalMute = (): boolean => {
  return isGlobalMuted;
};
