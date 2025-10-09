'use client';

// Professional video storage system with memory management
class VideoStorageManager {
  private static instance: VideoStorageManager;
  private videoBlob: Blob | null = null;
  private videoURL: string | null = null;
  private metadata: {
    timestamp: number;
    size: number;
    type: string;
    approach: string;
  } | null = null;

  private constructor() {
    console.log('🏗️ VideoStorageManager initialized');
  }

  static getInstance(): VideoStorageManager {
    if (!VideoStorageManager.instance) {
      VideoStorageManager.instance = new VideoStorageManager();
    }
    return VideoStorageManager.instance;
  }

  // Store video with metadata
  storeVideo(blob: Blob, approach: string): string {
    console.log('💾 Storing video to memory:', {
      size: blob.size,
      type: blob.type,
      approach
    });

    // Clean up previous storage
    this.cleanup();

    // Store new video
    this.videoBlob = blob;
    this.videoURL = URL.createObjectURL(blob);
    this.metadata = {
      timestamp: Date.now(),
      size: blob.size,
      type: blob.type,
      approach
    };

    console.log('✅ Video stored successfully:', {
      url: this.videoURL,
      metadata: this.metadata
    });

    return this.videoURL;
  }

  // Retrieve stored video
  getVideo(): { blob: Blob | null; url: string | null; metadata: any } {
    if (this.videoBlob && this.videoURL) {
      console.log('📤 Retrieved video from memory:', this.metadata);
      return {
        blob: this.videoBlob,
        url: this.videoURL,
        metadata: this.metadata
      };
    }

    console.warn('⚠️ No video found in memory');
    return { blob: null, url: null, metadata: null };
  }

  // Check if video is available
  hasVideo(): boolean {
    return !!(this.videoBlob && this.videoURL);
  }

  // Get video size in KB
  getVideoSizeKB(): number {
    return this.metadata ? Math.round(this.metadata.size / 1024) : 0;
  }

  // Cleanup resources
  cleanup(): void {
    if (this.videoURL) {
      URL.revokeObjectURL(this.videoURL);
      console.log('🗑️ Cleaned up previous video URL');
    }
    this.videoBlob = null;
    this.videoURL = null;
    this.metadata = null;
  }

  // Force garbage collection helper
  forceCleanup(): void {
    this.cleanup();
    console.log('🧹 Forced cleanup completed');
  }
}

// Export singleton instance
export const videoStorage = VideoStorageManager.getInstance();

// Sea creature fun facts for loading screens
export const seaCreatureFacts = [
  {
    emoji: "🦈",
    fact: "Sharks have existed for over 400 million years - they're older than trees and dinosaurs!",
    creature: "shark"
  },
  {
    emoji: "🐙",
    fact: "Octopuses have 3 hearts and blue blood! Each arm can taste what it touches.",
    creature: "octopus"
  },
  {
    emoji: "🐢",
    fact: "Sea turtles can live over 100 years and always return to their birth beach to nest.",
    creature: "turtle"
  },
  {
    emoji: "🐋",
    fact: "Blue whales' hearts are so big, a human could crawl through their arteries!",
    creature: "whale"
  },
  {
    emoji: "🦀",
    fact: "Crabs can regenerate lost limbs and communicate by drumming their claws!",
    creature: "crab"
  },
  {
    emoji: "🪼",
    fact: "Jellyfish have been around for 650 million years with no brain, heart, or blood!",
    creature: "jellyfish"
  },
  {
    emoji: "🐬",
    fact: "Dolphins call each other by name using unique whistle signatures!",
    creature: "dolphin"
  },
  {
    emoji: "🦭",
    fact: "Seals can dive up to 600 meters deep and hold their breath for 2 hours!",
    creature: "seal"
  },
  {
    emoji: "🐠",
    fact: "Some fish can change gender during their lifetime to ensure reproduction!",
    creature: "fish"
  },
  {
    emoji: "🦑",
    fact: "Squid have the largest eyes in the animal kingdom - up to 10 inches across!",
    creature: "squid"
  }
];

// Get random sea creature fact
export const getRandomSeaFact = () => {
  const randomIndex = Math.floor(Math.random() * seaCreatureFacts.length);
  return seaCreatureFacts[randomIndex];
};

// Get fact for specific creature
export const getCreatureFact = (creatureType: string) => {
  return seaCreatureFacts.find(fact =>
    fact.creature === creatureType ||
    creatureType.includes(fact.creature)
  ) || getRandomSeaFact();
};