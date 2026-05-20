import re
import os

files = [
    r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Shop.tsx",
    r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Album.tsx",
    r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Mural.tsx"
]

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to replace dynamic window.innerWidth with fixed vw/vh and Math.random() with seeded variables 
    # to stop React/Framer Motion from restarting animations on re-renders.

    # Fix 1: Super Secret background in Shop
    content = content.replace("x: Math.random() * window.innerWidth - window.innerWidth/2,", "x: `${Math.sin(i * 11) * 50}vw`,")
    content = content.replace("y: window.innerHeight/2 + 50,", "y: '50vh',")
    content = content.replace("y: -window.innerHeight/2 - 50,", "y: '-50vh',")
    content = content.replace("x: `calc(${Math.random() * window.innerWidth - window.innerWidth/2}px + ${Math.sin(i) * 60}px)`,", "x: `calc(${Math.cos(i * 22) * 50}vw + ${Math.sin(i) * 60}px)`,")
    
    # Fix 2: Ultra Secret background in Shop (25 particles) -> Reduce to 15 particles to fix lag
    content = content.replace("[...Array(25)].map", "[...Array(15)].map")
    content = content.replace("x: Math.random() * window.innerWidth - window.innerWidth/3,", "x: `${Math.sin(i * 33) * 60 - 30}vw`,")
    content = content.replace("y: -window.innerHeight/2 - 100,", "y: '-60vh',")
    content = content.replace("x: `calc(${Math.random() * window.innerWidth - window.innerWidth/2}px - 200px)`,", "x: `calc(${Math.cos(i * 44) * 50 - 50}vw - 200px)`,")
    content = content.replace("y: window.innerHeight/2 + 100,", "y: '60vh',")

    # Fix 3: Secret background in Shop (already partially patched, but ensure window.innerWidth is removed)
    content = content.replace("x: Math.random() * window.innerWidth - window.innerWidth/2,", "x: `${Math.sin(i * 55) * 50}vw`,")
    content = content.replace("y: Math.random() * window.innerHeight - window.innerHeight/2,", "y: `${Math.cos(i * 66) * 50}vh`,")
    
    # Generic Math.random() in particle arrays (delays, durations, coordinates inside cards)
    # This regex looks for Math.random() inside the map function and replaces it with Math.abs(Math.sin(i * X))
    # We'll just do a simpler string replacement for common patterns.
    
    content = content.replace("Math.random() * 16 - 8", "Math.sin(i * 123) * 16")
    content = content.replace("Math.random() * 80", "Math.abs(Math.cos(i * 456)) * 80")
    content = content.replace("Math.random() * 74", "Math.abs(Math.sin(i * 789)) * 74")
    content = content.replace("Math.random() * 0.7", "Math.abs(Math.cos(i * 101)) * 0.7")
    content = content.replace("Math.random() * 1.4", "Math.abs(Math.sin(i * 202)) * 1.4")
    content = content.replace("Math.random() * 1.5", "Math.abs(Math.cos(i * 303)) * 1.5")
    content = content.replace("Math.random() * 4", "Math.abs(Math.sin(i * 404)) * 4")
    content = content.replace("Math.random() * 3", "Math.abs(Math.cos(i * 505)) * 3")
    content = content.replace("Math.random() * 5", "Math.abs(Math.sin(i * 606)) * 5")
    content = content.replace("Math.random() * 8", "Math.abs(Math.cos(i * 707)) * 8")
    content = content.replace("Math.random() * 1.2", "Math.abs(Math.sin(i * 808)) * 1.2")
    content = content.replace("Math.random() * 2", "Math.abs(Math.cos(i * 909)) * 2")

    # Divine lag: Divine has 16 inner particles. Reduce to 8 total.
    content = content.replace("[...Array(isShiny ? 6 : isSecret ? 12 : isSuperSecret ? 10 : isUltraSecret ? 18 : 0)]", "[...Array(isShiny ? 6 : isSecret ? 10 : isSuperSecret ? 8 : isUltraSecret ? 12 : 0)]")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filepath in files:
    patch_file(filepath)

print("Particles optimized!")
