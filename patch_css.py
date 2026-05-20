import os

css_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\index.css"
with open(css_path, "a", encoding="utf-8") as f:
    f.write("""

@layer utilities {
  @keyframes shiny-bg {
    0%, 100% { background-color: rgba(255,30,0,0.15); }
    25% { background-color: rgba(200,0,150,0.1); }
    50% { background-color: rgba(0,70,255,0.1); }
    75% { background-color: rgba(0,255,100,0.1); }
  }
  .animate-shiny-bg { animation: shiny-bg 6s linear infinite; will-change: background-color; }

  @keyframes shiny-border {
    0%, 100% { border-color: #ff2000; }
    20% { border-color: #cc0099; }
    40% { border-color: #0066ff; }
    60% { border-color: #00ff66; }
    80% { border-color: #ffcc00; }
  }
  .animate-shiny-border { animation: shiny-border 6s linear infinite; will-change: border-color; }

  @keyframes skew-slide {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%) skewX(-12deg); }
  }
  .animate-skew-slide-3s { animation: skew-slide 3s linear infinite; will-change: transform; }
  .animate-skew-slide-2_5s { animation: skew-slide 2.5s linear infinite; will-change: transform; }

  @keyframes ultra-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  .animate-ultra-pulse { animation: ultra-pulse 3s ease-in-out infinite; will-change: opacity; }

  @keyframes super-secret-bg {
    0%, 100% { background-color: rgba(16,185,129,0.25); }
    50% { background-color: rgba(234,179,8,0.25); }
  }
  .animate-super-secret-bg { animation: super-secret-bg 4s ease-in-out infinite; will-change: background-color; }

  @keyframes spin-slow-8s {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .animate-spin-slow-8s { animation: spin-slow-8s 8s linear infinite; will-change: transform; }

  @keyframes spin-slow-15s {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .animate-spin-slow-15s { animation: spin-slow-15s 15s linear infinite; will-change: transform; }

  @keyframes super-secret-pulse {
    0%, 100% { opacity: 0.8; transform: scale(0.98); }
    50% { opacity: 1.0; transform: scale(1.02); }
  }
  .animate-super-secret-pulse { animation: super-secret-pulse 2s ease-in-out infinite; will-change: transform, opacity; }

  @keyframes ultra-secret-bg {
    0%, 100% { background-color: rgba(234,179,8,0.25); }
    50% { background-color: rgba(244,63,94,0.25); }
  }
  .animate-ultra-secret-bg { animation: ultra-secret-bg 6s ease-in-out infinite; will-change: background-color; }

  @keyframes ultra-secret-pulse {
    0%, 100% { opacity: 0.8; transform: scale(0.98); }
    50% { opacity: 1.0; transform: scale(1.02); }
  }
  .animate-ultra-secret-pulse { animation: ultra-secret-pulse 3s ease-in-out infinite; will-change: transform, opacity; }

  @keyframes divine-bg {
    0%, 100% { background-color: rgba(251,191,36,0.25); }
    33% { background-color: rgba(120,40,180,0.15); }
    66% { background-color: rgba(217,119,6,0.25); }
  }
  .animate-divine-bg { animation: divine-bg 6s ease-in-out infinite; will-change: background-color; }

  @keyframes divine-pulse {
    0%, 100% { 
      opacity: 0.8; 
      transform: scale(0.97); 
      box-shadow: 0 0 45px rgba(251,191,36,0.95), inset 0 0 20px rgba(251,191,36,0.65);
    }
    50% { 
      opacity: 1.0; 
      transform: scale(1.02); 
      box-shadow: 0 0 65px rgba(251,191,36,1.0), inset 0 0 30px rgba(251,191,36,0.85);
    }
  }
  .animate-divine-pulse { animation: divine-pulse 2.5s ease-in-out infinite; will-change: transform, opacity, box-shadow; }

  @keyframes divine-text-badge {
    0%, 100% { color: #fbbf24; border-color: #fbbf24; }
    25% { color: #a78bfa; border-color: #a78bfa; }
    50% { color: #ef4444; border-color: #ef4444; }
    75% { color: #06b6d4; border-color: #06b6d4; }
  }
  .animate-divine-text-badge { animation: divine-text-badge 4s linear infinite; will-change: color, border-color; }

  @keyframes ultra-secret-text-badge {
    0%, 100% { color: #facc15; border-color: #facc15; }
    33% { color: #f43f5e; border-color: #f43f5e; }
    66% { color: #d946ef; border-color: #d946ef; }
    85% { color: #8b5cf6; border-color: #8b5cf6; }
  }
  .animate-ultra-secret-text-badge { animation: ultra-secret-text-badge 4s linear infinite; will-change: color, border-color; }
}
""")
print("index.css updated.")
