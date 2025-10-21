// Multilingual fish facts database
// Supports English, Turkish, and Polish

export interface FishFact {
  en: string;
  tr: string;
  pl: string;
}

export interface FishData {
  name: string;
  facts: FishFact[];
}

export const fishFactsDatabase: Record<string, FishData> = {
  'tuna-fish': {
    name: 'Tuna Fish',
    facts: [
      {
        en: "Tunas can swim at speeds up to 75 km/h!",
        tr: "Orkinos balıkları saatte 75 km hıza kadar yüzebilir!",
        pl: "Tuńczyki mogą pływać z prędkością do 75 km/h!"
      },
      {
        en: "Some tuna species can dive deeper than 1000 meters!",
        tr: "Bazı orkinos türleri 1000 metreden daha derine dalabilir!",
        pl: "Niektóre gatunki tuńczyka mogą nurkować głębiej niż 1000 metrów!"
      },
      {
        en: "Tunas are warm-blooded, unlike most fish!",
        tr: "Orkinos balıkları çoğu balığın aksine sıcak kanlıdır!",
        pl: "Tuńczyki są stałocieplne, w przeciwieństwie do większości ryb!"
      },
      {
        en: "A bluefin tuna can weigh up to 680 kg!",
        tr: "Bir orkinos 680 kg'a kadar ağırlığa ulaşabilir!",
        pl: "Tuńczyk błękitnopłetwy może ważyć do 680 kg!"
      },
      {
        en: "Tunas never stop swimming throughout their lives!",
        tr: "Orkinos balıkları hayatları boyunca hiç durmazlar!",
        pl: "Tuńczyki nigdy nie przestają pływać przez całe życie!"
      }
    ]
  },
  'koi-fish': {
    name: 'Koi Fish',
    facts: [
      {
        en: "Koi fish can live for over 200 years!",
        tr: "Koi balıkları 200 yıldan fazla yaşayabilir!",
        pl: "Ryby koi mogą żyć ponad 200 lat!"
      },
      {
        en: "Koi can recognize the person who feeds them!",
        tr: "Koi balıkları kendilerini besleyen kişiyi tanıyabilir!",
        pl: "Koi mogą rozpoznać osobę, która je karmi!"
      },
      {
        en: "The most expensive koi ever sold cost $1.8 million!",
        tr: "Şimdiye kadar satılan en pahalı koi 1.8 milyon dolara mal oldu!",
        pl: "Najdroższy koi kiedykolwiek sprzedany kosztował 1,8 miliona dolarów!"
      },
      {
        en: "Koi fish can grow up to 90 cm in length!",
        tr: "Koi balıkları 90 cm uzunluğa kadar büyüyebilir!",
        pl: "Ryby koi mogą rosnąć do 90 cm długości!"
      },
      {
        en: "Koi colors can change based on their environment!",
        tr: "Koi renkleri çevrelerine göre değişebilir!",
        pl: "Kolory koi mogą się zmieniać w zależności od środowiska!"
      }
    ]
  },
  'zebrasoma-xanthurum': {
    name: 'Yellow Tang',
    facts: [
      {
        en: "Yellow tangs can live for 30+ years in the wild!",
        tr: "Sarı tang balıkları doğada 30+ yıl yaşayabilir!",
        pl: "Żółte tangi mogą żyć ponad 30 lat na wolności!"
      },
      {
        en: "They have a sharp spine on their tail for defense!",
        tr: "Savunma için kuyruklarında keskin bir dikeni vardır!",
        pl: "Mają ostry kolec na ogonie do obrony!"
      },
      {
        en: "Yellow tangs help keep coral reefs clean by eating algae!",
        tr: "Sarı tang balıkları yosun yiyerek mercan resiflerinin temiz kalmasına yardımcı olur!",
        pl: "Żółte tangi pomagają utrzymać czystość raf koralowych, jedząc glony!"
      },
      {
        en: "They can change their color intensity when stressed!",
        tr: "Stresli olduklarında renk yoğunluklarını değiştirebilirler!",
        pl: "Mogą zmieniać intensywność koloru, gdy są zestresowane!"
      },
      {
        en: "Found primarily in Hawaiian waters!",
        tr: "Ağırlıklı olarak Hawaii sularında bulunur!",
        pl: "Występują głównie w wodach hawajskich!"
      }
    ]
  },
  'generic-fish': {
    name: 'Ocean Fish',
    facts: [
      {
        en: "Fish have been on Earth for over 500 million years!",
        tr: "Balıklar 500 milyon yıldan fazla bir süredir Dünya'da!",
        pl: "Ryby istnieją na Ziemi od ponad 500 milionów lat!"
      },
      {
        en: "Some fish can breathe air and survive on land!",
        tr: "Bazı balıklar hava soluyabilir ve karada hayatta kalabilir!",
        pl: "Niektóre ryby mogą oddychać powietrzem i przetrwać na lądzie!"
      },
      {
        en: "Fish can communicate using sounds and body language!",
        tr: "Balıklar sesler ve beden dili kullanarak iletişim kurabilir!",
        pl: "Ryby mogą komunikować się za pomocą dźwięków i mowy ciała!"
      },
      {
        en: "Most fish can see in color, unlike cats and dogs!",
        tr: "Çoğu balık kediler ve köpeklerin aksine renkli görebilir!",
        pl: "Większość ryb widzi w kolorze, w przeciwieństwie do kotów i psów!"
      },
      {
        en: "Fish can taste with their fins and tail!",
        tr: "Balıklar yüzgeçleri ve kuyruklarıyla tat alabilir!",
        pl: "Ryby mogą smakować płetwami i ogonem!"
      }
    ]
  }
};

// Helper function to get a random fact for a creature
export function getRandomFishFact(creatureName: string): FishFact | null {
  // Normalize creature name to match database keys
  const normalizedName = creatureName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Try to find exact match
  let fishData = fishFactsDatabase[normalizedName];

  // If no match, try partial matching
  if (!fishData) {
    const keys = Object.keys(fishFactsDatabase);
    const partialMatch = keys.find(key =>
      normalizedName.includes(key) || key.includes(normalizedName)
    );
    if (partialMatch) {
      fishData = fishFactsDatabase[partialMatch];
    }
  }

  // Fallback to generic fish facts
  if (!fishData) {
    fishData = fishFactsDatabase['generic-fish'];
  }

  // Return random fact
  if (fishData && fishData.facts.length > 0) {
    const randomIndex = Math.floor(Math.random() * fishData.facts.length);
    return fishData.facts[randomIndex];
  }

  return null;
}

// Get all facts for a specific creature
export function getAllFactsForCreature(creatureName: string): FishFact[] {
  const normalizedName = creatureName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const fishData = fishFactsDatabase[normalizedName] || fishFactsDatabase['generic-fish'];
  return fishData?.facts || [];
}
