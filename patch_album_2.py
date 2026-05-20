import os

file_path = r"c:\tcg-project\pokemon-tcg-project\frontend\src\pages\Album.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State change (default sortBy)
content = content.replace(
    "const [sortBy, setSortBy] = useState<SortOrder>('recent');",
    "const [sortBy, setSortBy] = useState<SortOrder>('id');"
)

# 2. Stats logic change
old_stats_logic = """    const mappedEntries = filteredAllCards.map(card => {
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
    
    const sorted = [...mappedEntries].sort((a, b) => {
      switch (sortBy) {
        case 'id': 
          const numA = parseInt(a.card.id.split('-')[1]) || 0;
          const numB = parseInt(b.card.id.split('-')[1]) || 0;
          return numA - numB;
        case 'rarity': 
          return (rarityWeight[b.card.rarity.toLowerCase()] || 0) - (rarityWeight[a.card.rarity.toLowerCase()] || 0);
        case 'hp': 
          return (b.card.hp || 0) - (a.card.hp || 0);
        default: return 0;
      }
    });"""

new_stats_logic = """    const mappedEntries = filteredAllCards.map(card => {
      const ownedIndex = entries.findIndex(e => String(e.card.id).trim().toLowerCase() === String(card.id).trim().toLowerCase());
      const owned = ownedIndex !== -1 ? entries[ownedIndex] : null;
      return {
        card: card,
        quantity: owned ? owned.quantity : 0,
        unlocked: !!owned,
        acquiredIndex: ownedIndex
      };
    }).filter(e => !(e.card.rarity.toLowerCase() === 'divine' && !e.unlocked));
    
    const standardEntries = mappedEntries.filter(e => e.card.rarity.toLowerCase() !== 'divine');
    const uniqueCount = standardEntries.filter(e => e.unlocked).length;
    const progress = Math.min(100, Math.round((uniqueCount / currentExp.total) * 100));
    
    const sorted = [...mappedEntries].sort((a, b) => {
      if (sortBy === 'recent') {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        if (a.unlocked && b.unlocked) {
          return b.acquiredIndex - a.acquiredIndex; // Newest acquired first
        }
        // If both locked, sort by ID
        const numA = parseInt(a.card.id.split('-')[1]) || 0;
        const numB = parseInt(b.card.id.split('-')[1]) || 0;
        return numA - numB;
      }

      switch (sortBy) {
        case 'id': 
          const numA = parseInt(a.card.id.split('-')[1]) || 0;
          const numB = parseInt(b.card.id.split('-')[1]) || 0;
          return numA - numB;
        case 'rarity': 
          return (rarityWeight[b.card.rarity.toLowerCase()] || 0) - (rarityWeight[a.card.rarity.toLowerCase()] || 0);
        case 'hp': 
          return (b.card.hp || 0) - (a.card.hp || 0);
        default: return 0;
      }
    });"""

content = content.replace(old_stats_logic, new_stats_logic)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully.")
