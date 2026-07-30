export interface SubtitleInfo {
  availableLanguages: string[];
  totalSubtitlesCount: number;
}

export async function fetchSubtitleLanguages(title: string, originalLanguage?: string): Promise<SubtitleInfo> {
  const defaultLangs = ['English', 'Spanish', 'French', 'German'];

  if (originalLanguage === 'tr') {
    // Turkish Dizi
    return {
      availableLanguages: ['English', 'Spanish', 'Turkish', 'Arabic', 'Italian', 'Portuguese'],
      totalSubtitlesCount: 142
    };
  }

  if (['ko', 'ja', 'zh'].includes(originalLanguage || '')) {
    // Asian Drama
    return {
      availableLanguages: ['English', 'Spanish', 'Korean', 'Japanese', 'Indonesian', 'Thai', 'Vietnamese'],
      totalSubtitlesCount: 210
    };
  }

  if (originalLanguage === 'es') {
    // Spanish / Telenovela
    return {
      availableLanguages: ['English', 'Spanish', 'Portuguese', 'French', 'Italian'],
      totalSubtitlesCount: 98
    };
  }

  return {
    availableLanguages: defaultLangs,
    totalSubtitlesCount: 45
  };
}
