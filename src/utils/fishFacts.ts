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
  'shark': {
    name: 'Shark',
    facts: [
      {
        en: "Sharks have been around for over 400 million years!",
        tr: "Köpekbalıkları 400 milyon yıldan fazladır var!",
        pl: "Rekiny istnieją od ponad 400 milionów lat!"
      },
      {
        en: "Sharks can detect a single drop of blood in an Olympic-sized pool!",
        tr: "Köpekbalıkları olimpik havuzdaki tek damla kanı algılayabilir!",
        pl: "Rekiny mogą wykryć pojedynczą kroplę krwi w basenie olimpijskim!"
      },
      {
        en: "Sharks never run out of teeth - they grow new ones constantly!",
        tr: "Köpekbalıklarının dişleri asla bitmez - sürekli yenileri çıkar!",
        pl: "Rekiny nigdy nie wyczerpują zębów - stale wyrastają im nowe!"
      },
      {
        en: "Some sharks can live up to 500 years!",
        tr: "Bazı köpekbalıkları 500 yıla kadar yaşayabilir!",
        pl: "Niektóre rekiny mogą żyć do 500 lat!"
      }
    ]
  },
  'dolphin': {
    name: 'Dolphin',
    facts: [
      {
        en: "Dolphins are one of the smartest animals on Earth!",
        tr: "Yunuslar Dünya'daki en akıllı hayvanlardan biridir!",
        pl: "Delfiny są jednymi z najmądrzejszych zwierząt na Ziemi!"
      },
      {
        en: "Dolphins sleep with one eye open!",
        tr: "Yunuslar bir göz açık uyurlar!",
        pl: "Delfiny śpią z jednym otwartym okiem!"
      },
      {
        en: "Dolphins have their own signature whistle that acts like a name!",
        tr: "Yunusların isim gibi davranan kendilerine özgü ıslıkları vardır!",
        pl: "Delfiny mają swój charakterystyczny gwizd, który działa jak imię!"
      },
      {
        en: "Dolphins can recognize themselves in a mirror!",
        tr: "Yunuslar aynada kendilerini tanıyabilirler!",
        pl: "Delfiny potrafią rozpoznać siebie w lustrze!"
      }
    ]
  },
  'whale': {
    name: 'Whale',
    facts: [
      {
        en: "Blue whales are the largest animals ever to exist on Earth!",
        tr: "Mavi balinalar Dünya'da yaşamış en büyük hayvanlardır!",
        pl: "Płetwale błękitne to największe zwierzęta, jakie kiedykolwiek istniały na Ziemi!"
      },
      {
        en: "A whale's heart can weigh as much as a car!",
        tr: "Bir balinanın kalbi bir araba kadar ağır olabilir!",
        pl: "Serce wieloryba może ważyć tyle co samochód!"
      },
      {
        en: "Whales can hold their breath for over 90 minutes!",
        tr: "Balinalar 90 dakikadan fazla nefeslerini tutabilirler!",
        pl: "Wieloryby mogą wstrzymywać oddech przez ponad 90 minut!"
      },
      {
        en: "Humpback whales sing complex songs that can last for hours!",
        tr: "Kambur balinalar saatlerce sürebilen karmaşık şarkılar söylerler!",
        pl: "Humbaki śpiewają złożone pieśni, które mogą trwać godzinami!"
      }
    ]
  },
  'octopus': {
    name: 'Octopus',
    facts: [
      {
        en: "Octopuses have three hearts and blue blood!",
        tr: "Ahtapotların üç kalbi ve mavi kanı vardır!",
        pl: "Ośmiornice mają trzy serca i niebieską krew!"
      },
      {
        en: "An octopus can squeeze through any hole larger than its beak!",
        tr: "Bir ahtapot gagasından büyük her delikten geçebilir!",
        pl: "Ośmiornica może przecisnąć się przez każdą dziurę większą od jej dziobu!"
      },
      {
        en: "Octopuses can change color in less than a second!",
        tr: "Ahtapotlar bir saniyeden kısa sürede renk değiştirebilirler!",
        pl: "Ośmiornice mogą zmieniać kolor w mniej niż sekundę!"
      },
      {
        en: "Octopuses can taste with their arms!",
        tr: "Ahtapotlar kollarıyla tat alabilirler!",
        pl: "Ośmiornice mogą smakować swoimi ramionami!"
      }
    ]
  },
  'turtle': {
    name: 'Sea Turtle',
    facts: [
      {
        en: "Sea turtles have been around for over 100 million years!",
        tr: "Deniz kaplumbağaları 100 milyon yıldan fazladır var!",
        pl: "Żółwie morskie istnieją od ponad 100 milionów lat!"
      },
      {
        en: "Female sea turtles return to the same beach where they were born to lay eggs!",
        tr: "Dişi deniz kaplumbağaları yumurtlamak için doğdukları kumsala geri dönerler!",
        pl: "Samice żółwi morskich wracają na tę samą plażę, na której się urodziły, aby złożyć jaja!"
      },
      {
        en: "Sea turtles can hold their breath for up to 7 hours while sleeping!",
        tr: "Deniz kaplumbağaları uyurken 7 saate kadar nefeslerini tutabilirler!",
        pl: "Żółwie morskie mogą wstrzymywać oddech przez 7 godzin podczas snu!"
      },
      {
        en: "Some sea turtles can live over 100 years!",
        tr: "Bazı deniz kaplumbağaları 100 yıldan fazla yaşayabilir!",
        pl: "Niektóre żółwie morskie mogą żyć ponad 100 lat!"
      }
    ]
  },
  'clownfish': {
    name: 'Clownfish',
    facts: [
      {
        en: "Clownfish are immune to sea anemone stings!",
        tr: "Palyaço balıkları denizanası sokmasından etkilenmez!",
        pl: "Błazenki są odporne na ukłucia ukwiałów!"
      },
      {
        en: "All clownfish are born male, but some change to female!",
        tr: "Tüm palyaço balıkları erkek doğar, ancak bazıları dişiye dönüşür!",
        pl: "Wszystkie błazenki rodzą się jako samce, ale niektóre zmieniają się w samice!"
      },
      {
        en: "Clownfish make clicking sounds to communicate!",
        tr: "Palyaço balıkları iletişim kurmak için tıklama sesleri çıkarır!",
        pl: "Błazenki wydają klikające dźwięki, aby się komunikować!"
      },
      {
        en: "Clownfish can live up to 10 years in the wild!",
        tr: "Palyaço balıkları doğada 10 yıla kadar yaşayabilir!",
        pl: "Błazenki mogą żyć do 10 lat na wolności!"
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
