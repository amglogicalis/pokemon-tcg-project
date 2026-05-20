import os
import re

file_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Album.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State changes
content = content.replace(
    "const [entries, setEntries] = useState<AlbumEntry[]>([]);",
    "const [entries, setEntries] = useState<AlbumEntry[]>([]);\n  const [allCards, setAllCards] = useState<any[]>([]);"
)

# 2. Fetch changes
content = content.replace(
    "setEntries(response.data.album || []);",
    "setEntries(response.data.album || []);\n        setAllCards(response.data.allCards || []);"
)

# 3. Stats changes
old_stats_logic = """    const filteredEntries = entries.filter(e => {
      const cardId = e.card.id.toLowerCase();
      if (activeTab === 'xy5') {
        return cardId.startsWith('xy5-');
      }
      if (activeTab === 'swsh12') {
        return cardId.startsWith('swsh12-');
      }
      
      if (activeTab === 'dp6') {
        return cardId.startsWith('card-') || cardId.startsWith('dp6');
      }
      if (activeTab === 'bw9') {
        return cardId.startsWith('bw9-') || cardId.startsWith('bw-');
      }
      if (activeTab === 'xyp') {
        return cardId.startsWith('xyp-') || cardId.startsWith('xy-') || cardId.startsWith('621-');
      }
      if (activeTab === 'sm3') {
        return cardId.startsWith('sm3-');
      }
      if (activeTab === 'zsv10pt5') {
        return cardId.startsWith('zsv10pt5-');
      }
      return false;
    });
    
    const standardEntries = filteredEntries.filter(e => e.card.rarity.toLowerCase() !== 'divine');
    const uniqueCount = standardEntries.length;
    const progress = Math.min(100, Math.round((uniqueCount / currentExp.total) * 100));
    
    const sorted = [...filteredEntries].sort((a, b) => {"""

new_stats_logic = """    const filteredAllCards = allCards.filter(card => {
      const cardId = card.id.toLowerCase();
      if (activeTab === 'xy5') return cardId.startsWith('xy5-');
      if (activeTab === 'swsh12') return cardId.startsWith('swsh12-');
      if (activeTab === 'dp6') return cardId.startsWith('card-') || cardId.startsWith('dp6');
      if (activeTab === 'bw9') return cardId.startsWith('bw9-') || cardId.startsWith('bw-');
      if (activeTab === 'xyp') return cardId.startsWith('xyp-') || cardId.startsWith('xy-') || cardId.startsWith('621-');
      if (activeTab === 'sm3') return cardId.startsWith('sm3-');
      if (activeTab === 'zsv10pt5') return cardId.startsWith('zsv10pt5-');
      return false;
    });
    
    const mappedEntries = filteredAllCards.map(card => {
      const owned = entries.find(e => String(e.card.id).trim().toLowerCase() === String(card.id).trim().toLowerCase());
      return {
        card: card,
        quantity: owned ? owned.quantity : 0,
        unlocked: !!owned
      };
    });
    
    const standardEntries = mappedEntries.filter(e => e.card.rarity.toLowerCase() !== 'divine');
    const uniqueCount = standardEntries.filter(e => e.unlocked).length;
    const progress = Math.min(100, Math.round((uniqueCount / currentExp.total) * 100));
    
    const sorted = [...mappedEntries].sort((a, b) => {"""

content = content.replace(old_stats_logic, new_stats_logic)
content = content.replace("  }, [entries, sortBy, activeTab]);", "  }, [entries, allCards, sortBy, activeTab]);")

# 4. Render click and div
old_motion_div = """              <div key={`${entry.card.id}-${index}`} className="relative aspect-[2/3] cursor-pointer"
                onClick={() => { playSelect(); setSelectedCardId(isSelected ? null : entry.card.id); }}>
                
                <motion.div 
                  animate={isSelected ? { scale: 1.05, zIndex: 50 } : { scale: 1 }}
                  className={`w-full h-full p-3 rounded-xl border-2 transition-all duration-500 relative overflow-hidden flex flex-col
                    ${isSelected ? `${style.border} ${style.bg} ${style.shadow}` : 'border-gray-800 bg-gray-800/50'}`}
                >
                  {isSelected && ("""

new_motion_div = """              <div key={`${entry.card.id}-${index}`} className="relative aspect-[2/3] cursor-pointer"
                onClick={() => { if(entry.unlocked) { playSelect(); setSelectedCardId(isSelected ? null : entry.card.id); } }}>
                
                <motion.div 
                  animate={isSelected && entry.unlocked ? { scale: 1.05, zIndex: 50 } : { scale: 1 }}
                  className={`w-full h-full p-3 rounded-xl border-2 transition-all duration-500 relative overflow-hidden flex flex-col
                    ${isSelected && entry.unlocked ? `${style.border} ${style.bg} ${style.shadow}` : 'border-gray-800 bg-gray-800/50'}
                    ${!entry.unlocked ? 'grayscale opacity-75' : ''}`}
                >
                  {isSelected && entry.unlocked && ("""

content = content.replace(old_motion_div, new_motion_div)

# 5. Badges and image
old_badges_and_image = """                  {/* Quantity badge */}
                  <div className={`absolute -top-1 -right-1 ${currentTheme.accentClass} font-black w-6 h-6 flex items-center justify-center rounded-full z-40 border-2 border-gray-900 text-[9px] shadow-xl`}>
                    x{entry.quantity}
                  </div>

                  {/* Favorite star badge */}
                  {favoriteCardId === entry.card.id && (
                    <div className={`absolute -top-1 -left-1 ${currentTheme.accentClass} font-black w-6 h-6 flex items-center justify-center rounded-full z-40 border-2 border-gray-900 text-[10px] shadow-xl`}>
                      ⭐
                    </div>
                  )}

                  <img src={entry.card.imageUrl} alt={entry.card.name} className={`w-full flex-1 min-h-0 object-contain mb-3 relative z-10 transition-all duration-500 ${!isSelected ? 'grayscale-[0.5] opacity-60' : 'drop-shadow-2xl grayscale-0 opacity-100'}`} />"""

new_badges_and_image = """                  {/* Quantity badge */}
                  {entry.unlocked && (
                    <div className={`absolute -top-1 -right-1 ${currentTheme.accentClass} font-black w-6 h-6 flex items-center justify-center rounded-full z-40 border-2 border-gray-900 text-[9px] shadow-xl`}>
                      x{entry.quantity}
                    </div>
                  )}

                  {/* Favorite star badge */}
                  {entry.unlocked && favoriteCardId === entry.card.id && (
                    <div className={`absolute -top-1 -left-1 ${currentTheme.accentClass} font-black w-6 h-6 flex items-center justify-center rounded-full z-40 border-2 border-gray-900 text-[10px] shadow-xl`}>
                      ⭐
                    </div>
                  )}

                  <div className="relative w-full flex-1 min-h-0 mb-3 flex items-center justify-center">
                    <img src={entry.card.imageUrl} alt={entry.card.name} className={`w-full h-full object-contain relative z-10 transition-all duration-500 ${!isSelected ? 'grayscale-[0.5] opacity-60' : 'drop-shadow-2xl grayscale-0 opacity-100'} ${!entry.unlocked ? 'grayscale opacity-40 brightness-50' : ''}`} />
                    {!entry.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center z-50">
                        <span className="text-5xl drop-shadow-[0_0_15px_rgba(0,0,0,1)]">🔒</span>
                      </div>
                    )}
                  </div>"""

content = content.replace(old_badges_and_image, new_badges_and_image)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully.")
