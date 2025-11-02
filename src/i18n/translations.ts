/**
 * Internationalization (i18n) Module
 * Comprehensive translation system for Aquarium AR application
 *
 * To add a new language:
 * 1. Add language code to Language type
 * 2. Create translation object implementing Translations interface
 * 3. Add creature names and hashtags for all creatures
 * 4. Add to translations record
 */

export type Language = 'en' | 'tr' | 'pl';

export const SUPPORTED_LANGUAGES: readonly Language[] = ['en', 'tr', 'pl'] as const;

/**
 * Complete translations interface
 * Every language must implement ALL these fields
 */
export interface Translations {
  // UI Elements
  search: string;
  gallery: string;
  startAR: string;
  loading: string;
  home: string;
  close: string;
  species: string;
  back: string;

  // AR & Recording
  arExperience: string;
  record: string;
  tapToRecord: string;
  recording: string;
  cameraNotReady: string;
  active: string;
  tapToInteract: string;
  cameraRequired: string;
  retryCameraAccess: string;
  initializingCamera: string;
  allowCameraAccess: string;
  experienceCreatureInAR: (creatureName: string) => string;

  // Share Panel
  yourARVideo: string;
  downloadVideo: string;
  downloading: string;
  shareExperience: string;
  noVideo: string;
  recordFirst: string;
  showSocial: string;
  hideSocial: string;

  // Settings
  settings: string;
  language: string;
  theme: string;
  lightMode: string;
  darkMode: string;

  // Video Animation (PhotoPreviewPanel)
  aiVideoCreator: string;
  createShareFilm: string;
  chooseAnimationStyle: string;
  cinematic: string;
  cinematicDesc: string;
  documentary: string;
  documentaryDesc: string;
  anime: string;
  animeDesc: string;
  cartoon: string;
  cartoonDesc: string;
  realistic: string;
  realisticDesc: string;
  aiPoweredVideo: string;
  videoReady: string;
  videoReadyDesc: string;
  selectStyleDesc: string;
  generateVideoAnimation: string;
  generating: string;
  creatingMasterpiece: string;
  aiGeneratingVideo: string;
  percentComplete: string;
  download: string;
  share: string;

  // Privacy Modal
  privacyTitle: string;
  privacyMessage: string;
  privacyKVKK: string;
  privacyAccept: string;
  privacyDecline: string;

  // Categories
  categories: {
    fish: { name: string; description: string };
    mammals: { name: string; description: string };
    shellfish: { name: string; description: string };
    mollusks: { name: string; description: string };
    jellyfish: { name: string; description: string };
    reptiles: { name: string; description: string };
    baltic: { name: string; description: string };
    custom: { name: string; description: string };
  };

  // Creatures
  creatures: {
    [key: string]: {
      name: string;
      hashtags: string[];
    };
  };
}

/**
 * ENGLISH TRANSLATIONS
 */
const englishTranslations: Translations = {
  search: 'Search',
  gallery: 'Gallery',
  startAR: 'Start AR',
  loading: 'Loading...',
  home: 'Home',
  close: 'Close',
  species: 'species',
  back: 'Back',

  arExperience: 'AR Experience Live',
  record: 'Record',
  tapToRecord: 'Tap to record',
  recording: 'Recording...',
  cameraNotReady: 'Camera not ready',
  active: 'Active',
  tapToInteract: 'Tap anywhere to interact',
  cameraRequired: 'Camera Required',
  retryCameraAccess: 'Retry Camera Access',
  initializingCamera: 'Initializing Camera',
  allowCameraAccess: 'Please allow camera access when prompted',
  experienceCreatureInAR: (creatureName: string) => `Experience the amazing ${creatureName} in AR!`,

  yourARVideo: 'Your AR Video',
  downloadVideo: 'Download Video',
  downloading: 'Downloading',
  shareExperience: 'Share Your Experience',
  noVideo: 'No Video Available',
  recordFirst: 'Record a video first to see it here',
  showSocial: 'Show Social',
  hideSocial: 'Hide Social',

  settings: 'Settings',
  language: 'Language',
  theme: 'Theme',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',

  aiVideoCreator: 'AI Video Creator',
  createShareFilm: 'Create & Share Your Short Film',
  chooseAnimationStyle: 'Choose Animation Style',
  cinematic: 'Cinematic',
  cinematicDesc: 'Hollywood-style underwater masterpiece',
  documentary: 'Documentary',
  documentaryDesc: 'BBC nature documentary style',
  anime: 'Anime',
  animeDesc: 'Studio Ghibli magical animation',
  cartoon: 'Cartoon',
  cartoonDesc: 'Disney/Pixar playful style',
  realistic: 'Realistic',
  realisticDesc: 'Ultra-realistic IMAX quality',
  aiPoweredVideo: 'AI-Powered Video Animation',
  videoReady: 'Video Ready!',
  videoReadyDesc: 'Your 6-second cinematic animation is ready! Download and share your creation with the world.',
  selectStyleDesc: 'Select a style and click "Generate Video" to transform your AR photo into a stunning 6-second animation.',
  generateVideoAnimation: 'Generate Video Animation',
  generating: 'Generating...',
  creatingMasterpiece: 'Creating Your Masterpiece...',
  aiGeneratingVideo: 'AI is generating a 6-second cinematic animation',
  percentComplete: 'Complete',
  download: 'Download',
  share: 'Share',

  privacyTitle: 'Privacy & Data Protection',
  privacyMessage: 'Videos and photos are not stored on our servers. All content is processed locally on your device and deleted after you close the app.',
  privacyKVKK: 'By continuing, you agree to our terms of service and privacy policy (KVKK compliance). Your data is protected and never shared with third parties.',
  privacyAccept: 'Accept & Continue',
  privacyDecline: 'Decline',

  categories: {
    fish: {
      name: 'Fish',
      description: 'Various fish species from around the world'
    },
    mammals: {
      name: 'Marine Mammals',
      description: 'Whales, dolphins and other marine mammals'
    },
    shellfish: {
      name: 'Shellfish',
      description: 'Crabs, lobsters, and other crustaceans'
    },
    mollusks: {
      name: 'Mollusks',
      description: 'Octopus, squid, and other mollusks'
    },
    jellyfish: {
      name: 'Jellyfish',
      description: 'Various jellyfish and similar species'
    },
    reptiles: {
      name: 'Sea Reptiles',
      description: 'Sea turtles and marine reptiles'
    },
    baltic: {
      name: 'Baltic Species',
      description: 'Native species from the Baltic Sea'
    },
    custom: {
      name: 'Custom Creatures',
      description: 'Your custom uploaded creatures'
    }
  },

  creatures: {
    shark: { name: 'Great White Shark', hashtags: ['#GreatWhite', '#Shark', '#Predator', '#Ocean'] },
    angelfish: { name: 'Angelfish', hashtags: ['#Angelfish', '#Tropical', '#Colorful', '#Aquarium'] },
    tuna: { name: 'Bluefin Tuna', hashtags: ['#Tuna', '#Bluefin', '#FastSwimmer', '#Ocean'] },
    whale: { name: 'Humpback Whale', hashtags: ['#Whale', '#Humpback', '#Giant', '#Songs'] },
    dolphin: { name: 'Bottlenose Dolphin', hashtags: ['#Dolphin', '#Intelligent', '#Playful', '#Marine'] },
    seal: { name: 'Harbor Seal', hashtags: ['#Seal', '#Harbor', '#Cute', '#Marine'] },
    crab: { name: 'Red Crab', hashtags: ['#Crab', '#Red', '#Claws', '#Shellfish'] },
    lobster: { name: 'European Lobster', hashtags: ['#Lobster', '#European', '#Claws', '#Delicious'] },
    shrimp: { name: 'Giant Shrimp', hashtags: ['#Shrimp', '#Giant', '#Pink', '#Tasty'] },
    octopus: { name: 'Giant Pacific Octopus', hashtags: ['#Octopus', '#Giant', '#EightArms', '#Smart'] },
    squid: { name: 'Giant Squid', hashtags: ['#Squid', '#Giant', '#DeepSea', '#Tentacles'] },
    jellyfish: { name: 'Moon Jellyfish', hashtags: ['#Jellyfish', '#Moon', '#Graceful', '#Transparent'] },
    medusa: { name: 'Blue Blubber', hashtags: ['#BlueBlubber', '#Jellyfish', '#Beautiful', '#Floating'] },
    turtle: { name: 'Green Sea Turtle', hashtags: ['#SeaTurtle', '#Green', '#Ancient', '#Endangered'] },
    'sea-snake': { name: 'Sea Snake', hashtags: ['#SeaSnake', '#Venomous', '#Rare', '#Marine'] },
    herring: { name: 'Baltic Herring', hashtags: ['#Herring', '#Baltic', '#Local', '#Fish'] },
    cod: { name: 'Baltic Cod', hashtags: ['#Cod', '#Baltic', '#Important', '#Fish'] },
    flounder: { name: 'European Flounder', hashtags: ['#Flounder', '#European', '#Flatfish', '#Baltic'] },
    'baltic-seal': { name: 'Baltic Grey Seal', hashtags: ['#BalticSeal', '#Grey', '#Protected', '#Baltic'] },
  }
};

/**
 * TURKISH TRANSLATIONS (Türkçe)
 */
const turkishTranslations: Translations = {
  search: 'Ara',
  gallery: 'Galeri',
  startAR: 'AR Başlat',
  loading: 'Yükleniyor...',
  home: 'Ana Sayfa',
  close: 'Kapat',
  species: 'tür',
  back: 'Geri',

  arExperience: 'Canlı AR Deneyimi',
  record: 'Kaydet',
  tapToRecord: 'Kaydetmek için dokun',
  recording: 'Kaydediliyor...',
  cameraNotReady: 'Kamera hazır değil',
  active: 'Aktif',
  tapToInteract: 'Etkileşim için herhangi bir yere dokunun',
  cameraRequired: 'Kamera Gerekli',
  retryCameraAccess: 'Kamera Erişimini Yeniden Dene',
  initializingCamera: 'Kamera Başlatılıyor',
  allowCameraAccess: 'Lütfen istendiğinde kamera erişimine izin verin',
  experienceCreatureInAR: (creatureName: string) => `Harika ${creatureName} deneyimini AR'de yaşayın!`,

  yourARVideo: 'AR Videonuz',
  downloadVideo: 'Videoyu İndir',
  downloading: 'İndiriliyor',
  shareExperience: 'Deneyiminizi Paylaşın',
  noVideo: 'Video Yok',
  recordFirst: 'Görmek için önce bir video kaydedin',
  showSocial: 'Sosyal Medyayı Göster',
  hideSocial: 'Sosyal Medyayı Gizle',

  settings: 'Ayarlar',
  language: 'Dil',
  theme: 'Tema',
  lightMode: 'Açık Mod',
  darkMode: 'Koyu Mod',

  aiVideoCreator: 'AI Video Oluşturucu',
  createShareFilm: 'Kısa Filminizi Oluşturun ve Paylaşın',
  chooseAnimationStyle: 'Animasyon Stili Seçin',
  cinematic: 'Sinematik',
  cinematicDesc: 'Hollywood tarzı sualtı şaheseri',
  documentary: 'Belgesel',
  documentaryDesc: 'BBC doğa belgeseli tarzı',
  anime: 'Anime',
  animeDesc: 'Studio Ghibli sihirli animasyon',
  cartoon: 'Çizgi Film',
  cartoonDesc: 'Disney/Pixar eğlenceli tarz',
  realistic: 'Gerçekçi',
  realisticDesc: 'Ultra gerçekçi IMAX kalitesi',
  aiPoweredVideo: 'AI Destekli Video Animasyonu',
  videoReady: 'Video Hazır!',
  videoReadyDesc: '6 saniyelik sinematik animasyonunuz hazır! Kreasyonunuzu indirin ve dünyayla paylaşın.',
  selectStyleDesc: 'Bir stil seçin ve AR fotoğrafınızı muhteşem 6 saniyelik bir animasyona dönüştürmek için "Video Oluştur"a tıklayın.',
  generateVideoAnimation: 'Video Animasyonu Oluştur',
  generating: 'Oluşturuluyor...',
  creatingMasterpiece: 'Şaheseriniz Oluşturuluyor...',
  aiGeneratingVideo: 'AI 6 saniyelik sinematik animasyon oluşturuyor',
  percentComplete: 'Tamamlandı',
  download: 'İndir',
  share: 'Paylaş',

  privacyTitle: 'Gizlilik ve Veri Koruma',
  privacyMessage: 'Videolar ve fotoğraflar sunucularımızda saklanmaz. Tüm içerik cihazınızda yerel olarak işlenir ve uygulamayı kapattıktan sonra silinir.',
  privacyKVKK: 'Devam ederek, hizmet şartlarımızı ve gizlilik politikamızı (KVKK uyumluluğu) kabul ediyor sunuz. Verileriniz korunur ve asla üçüncü taraflarla paylaşılmaz.',
  privacyAccept: 'Kabul Et ve Devam Et',
  privacyDecline: 'Reddet',

  categories: {
    fish: {
      name: 'Balıklar',
      description: 'Dünyanın dört bir yanından çeşitli balık türleri'
    },
    mammals: {
      name: 'Deniz Memelileri',
      description: 'Balinalar, yunuslar ve diğer deniz memelileri'
    },
    shellfish: {
      name: 'Kabuklu Deniz Ürünleri',
      description: 'Yengeçler, ıstakozlar ve diğer kabuklular'
    },
    mollusks: {
      name: 'Yumuşakçalar',
      description: 'Ahtapotlar, kalamarlar ve diğer yumuşakçalar'
    },
    jellyfish: {
      name: 'Denizanaları',
      description: 'Çeşitli denizanası ve benzer türler'
    },
    reptiles: {
      name: 'Deniz Sürüngenleri',
      description: 'Deniz kaplumbağaları ve deniz sürüngenleri'
    },
    baltic: {
      name: 'Baltık Türleri',
      description: 'Baltık Denizi\'ne özgü türler'
    },
    custom: {
      name: 'Özel Canlılar',
      description: 'Yüklediğiniz özel canlılar'
    }
  },

  creatures: {
    shark: { name: 'Büyük Beyaz Köpekbalığı', hashtags: ['#BüyükBeyaz', '#Köpekbalığı', '#Yırtıcı', '#Okyanus'] },
    angelfish: { name: 'Melek Balığı', hashtags: ['#MelekBalığı', '#Tropikal', '#Renkli', '#Akvaryum'] },
    tuna: { name: 'Mavi Yüzgeçli Orkinos', hashtags: ['#Orkinos', '#MaviYüzgeç', '#HızlıYüzücü', '#Okyanus'] },
    whale: { name: 'Kambur Balina', hashtags: ['#Balina', '#Kambur', '#Dev', '#Şarkılar'] },
    dolphin: { name: 'Şişeburun Yunus', hashtags: ['#Yunus', '#Zeki', '#Eğlenceli', '#Deniz'] },
    seal: { name: 'Liman Foku', hashtags: ['#Fok', '#Liman', '#Sevimli', '#Deniz'] },
    crab: { name: 'Kırmızı Yengeç', hashtags: ['#Yengeç', '#Kırmızı', '#Kıskaçlar', '#Kabuklu'] },
    lobster: { name: 'Avrupa Istakoz', hashtags: ['#Istakoz', '#Avrupa', '#Kıskaçlar', '#Lezzetli'] },
    shrimp: { name: 'Dev Karides', hashtags: ['#Karides', '#Dev', '#Pembe', '#Lezzetli'] },
    octopus: { name: 'Dev Pasifik Ahtapot', hashtags: ['#Ahtapot', '#Dev', '#SekizKol', '#Akıllı'] },
    squid: { name: 'Dev Kalamar', hashtags: ['#Kalamar', '#Dev', '#DerinDeniz', '#Dokunaçlar'] },
    jellyfish: { name: 'Ay Denizanası', hashtags: ['#Denizanası', '#Ay', '#Zarif', '#Şeffaf'] },
    medusa: { name: 'Mavi Denizanası', hashtags: ['#MaviDenizanası', '#Güzel', '#Yüzen'] },
    turtle: { name: 'Yeşil Deniz Kaplumbağası', hashtags: ['#DenizKaplumbağası', '#Yeşil', '#Antik', '#Tehlike'] },
    'sea-snake': { name: 'Deniz Yılanı', hashtags: ['#DenizYılanı', '#Zehirli', '#Nadir', '#Deniz'] },
    herring: { name: 'Baltık Ringa Balığı', hashtags: ['#Ringa', '#Baltık', '#Yerel', '#Balık'] },
    cod: { name: 'Baltık Morina', hashtags: ['#Morina', '#Baltık', '#Önemli', '#Balık'] },
    flounder: { name: 'Avrupa Pisi Balığı', hashtags: ['#Pisi', '#Avrupa', '#YassıBalık', '#Baltık'] },
    'baltic-seal': { name: 'Baltık Gri Foku', hashtags: ['#BaltıkFok', '#Gri', '#Korumalı', '#Baltık'] },
  }
};

/**
 * POLISH TRANSLATIONS (Polski)
 */
const polishTranslations: Translations = {
  search: 'Szukaj',
  gallery: 'Galeria',
  startAR: 'Uruchom AR',
  loading: 'Ładowanie...',
  home: 'Strona główna',
  close: 'Zamknij',
  species: 'gatunki',
  back: 'Wstecz',

  arExperience: 'Doświadczenie AR na żywo',
  record: 'Nagraj',
  tapToRecord: 'Dotknij, aby nagrać',
  recording: 'Nagrywanie...',
  cameraNotReady: 'Kamera nie jest gotowa',
  active: 'Aktywny',
  tapToInteract: 'Dotknij w dowolnym miejscu, aby wchodzić w interakcje',
  cameraRequired: 'Wymagana kamera',
  retryCameraAccess: 'Ponów dostęp do kamery',
  initializingCamera: 'Inicjalizacja kamery',
  allowCameraAccess: 'Zezwól na dostęp do kamery, gdy zostaniesz o to poproszony',
  experienceCreatureInAR: (creatureName: string) => `Doświadcz niesamowitego ${creatureName} w AR!`,

  yourARVideo: 'Twój film AR',
  downloadVideo: 'Pobierz wideo',
  downloading: 'Pobieranie',
  shareExperience: 'Podziel się swoim doświadczeniem',
  noVideo: 'Brak wideo',
  recordFirst: 'Najpierw nagraj film, aby go tu zobaczyć',
  showSocial: 'Pokaż Social Media',
  hideSocial: 'Ukryj Social Media',

  settings: 'Ustawienia',
  language: 'Język',
  theme: 'Motyw',
  lightMode: 'Jasny Motyw',
  darkMode: 'Ciemny Motyw',

  aiVideoCreator: 'Kreator Wideo AI',
  createShareFilm: 'Stwórz i udostępnij swój krótki film',
  chooseAnimationStyle: 'Wybierz styl animacji',
  cinematic: 'Kinematyczny',
  cinematicDesc: 'Hollywoodzie podwodne arcydzieło',
  documentary: 'Dokumentalny',
  documentaryDesc: 'Styl dokumentu przyrodniczego BBC',
  anime: 'Anime',
  animeDesc: 'Magiczna animacja Studio Ghibli',
  cartoon: 'Kreskówka',
  cartoonDesc: 'Zabawny styl Disney/Pixar',
  realistic: 'Realistyczny',
  realisticDesc: 'Ultra-realistyczna jakość IMAX',
  aiPoweredVideo: 'Animacja wideo zasilana AI',
  videoReady: 'Wideo gotowe!',
  videoReadyDesc: 'Twoja 6-sekundowa kinematyczna animacja jest gotowa! Pobierz i udostępnij swoje dzieło światu.',
  selectStyleDesc: 'Wybierz styl i kliknij "Generuj wideo", aby przekształcić swoje zdjęcie AR w oszałamiającą 6-sekundową animację.',
  generateVideoAnimation: 'Generuj animację wideo',
  generating: 'Generowanie...',
  creatingMasterpiece: 'Tworzenie Twojego arcydzieła...',
  aiGeneratingVideo: 'AI generuje 6-sekundową kinematyczną animację',
  percentComplete: 'Ukończono',
  download: 'Pobierz',
  share: 'Udostępnij',

  privacyTitle: 'Prywatność i ochrona danych',
  privacyMessage: 'Filmy i zdjęcia nie są przechowywane na naszych serwerach. Cała zawartość jest przetwarzana lokalnie na Twoim urządzeniu i usuwana po zamknięciu aplikacji.',
  privacyKVKK: 'Kontynuując, zgadzasz się z naszymi warunkami usługi i polityką prywatności (zgodność z RODO). Twoje dane są chronione i nigdy nie są udostępniane stronom trzecim.',
  privacyAccept: 'Akceptuj i kontynuuj',
  privacyDecline: 'Odrzuć',

  categories: {
    fish: {
      name: 'Ryby',
      description: 'Różne gatunki ryb z całego świata'
    },
    mammals: {
      name: 'Ssaki Morskie',
      description: 'Wieloryby, delfiny i inne ssaki morskie'
    },
    shellfish: {
      name: 'Skorupiaki',
      description: 'Kraby, homary i inne skorupiaki'
    },
    mollusks: {
      name: 'Mięczaki',
      description: 'Ośmiornice, kałamarnice i inne mięczaki'
    },
    jellyfish: {
      name: 'Meduzy',
      description: 'Różne meduzy i podobne gatunki'
    },
    reptiles: {
      name: 'Gady Morskie',
      description: 'Żółwie morskie i gady morskie'
    },
    baltic: {
      name: 'Gatunki Bałtyckie',
      description: 'Rodzime gatunki z Morza Bałtyckiego'
    },
    custom: {
      name: 'Niestandardowe Stworzenia',
      description: 'Twoje niestandardowe stworzenia'
    }
  },

  creatures: {
    shark: { name: 'Wielki Biały Rekin', hashtags: ['#WielkiBiały', '#Rekin', '#Drapieżnik', '#Ocean'] },
    angelfish: { name: 'Skalar', hashtags: ['#Skalar', '#Tropikalna', '#Kolorowa', '#Akwarium'] },
    tuna: { name: 'Tuńczyk Błękitnopłetwy', hashtags: ['#Tuńczyk', '#Błękitnopłetwy', '#SzybkiPływak', '#Ocean'] },
    whale: { name: 'Wieloryb Humbak', hashtags: ['#Wieloryb', '#Humbak', '#Olbrzym', '#Pieśni'] },
    dolphin: { name: 'Delfin Butlonos', hashtags: ['#Delfin', '#Inteligentny', '#Zabawny', '#Morski'] },
    seal: { name: 'Foka Pospolita', hashtags: ['#Foka', '#Pospolita', '#Urocza', '#Morska'] },
    crab: { name: 'Krab Czerwony', hashtags: ['#Krab', '#Czerwony', '#Szczypce', '#Skorupiak'] },
    lobster: { name: 'Homar Europejski', hashtags: ['#Homar', '#Europejski', '#Szczypce', '#Pyszny'] },
    shrimp: { name: 'Krewetka Olbrzymia', hashtags: ['#Krewetka', '#Olbrzymia', '#Różowa', '#Smaczna'] },
    octopus: { name: 'Ośmiornica Pacyficzna', hashtags: ['#Ośmiornica', '#Olbrzymia', '#OśmiuRamion', '#Mądra'] },
    squid: { name: 'Kałamarnica Olbrzymia', hashtags: ['#Kałamarnica', '#Olbrzymia', '#GłębokowodnA', '#Macki'] },
    jellyfish: { name: 'Meduza Księżycowa', hashtags: ['#Meduza', '#Księżycowa', '#Pełna Wdzięku', '#Przezroczysta'] },
    medusa: { name: 'Meduza Niebieska', hashtags: ['#MeduzaNiebieska', '#Piękna', '#Pływająca'] },
    turtle: { name: 'Żółw Zielony', hashtags: ['#ŻółwMorski', '#Zielony', '#Starożytny', '#Zagrożony'] },
    'sea-snake': { name: 'Wąż Morski', hashtags: ['#WążMorski', '#Jadowity', '#Rzadki', '#Morski'] },
    herring: { name: 'Śledź Bałtycki', hashtags: ['#Śledź', '#Bałtycki', '#Lokalny', '#Ryba'] },
    cod: { name: 'Dorsz Bałtycki', hashtags: ['#Dorsz', '#Bałtycki', '#Ważny', '#Ryba'] },
    flounder: { name: 'Stornia Europejska', hashtags: ['#Stornia', '#Europejska', '#Płastuga', '#Bałtycka'] },
    'baltic-seal': { name: 'Foka Szara Bałtycka', hashtags: ['#FokaBałtycka', '#Szara', '#Chroniona', '#Bałtyk'] },
  }
};

export const translations: Record<Language, Translations> = {
  en: englishTranslations,
  tr: turkishTranslations,
  pl: polishTranslations,
};

export class TranslationService {
  static getTranslation(language: Language): Translations {
    return translations[language] || translations.en;
  }

  static isLanguageSupported(language: string): language is Language {
    return SUPPORTED_LANGUAGES.includes(language as Language);
  }

  static getSupportedLanguages(): readonly Language[] {
    return SUPPORTED_LANGUAGES;
  }
}
