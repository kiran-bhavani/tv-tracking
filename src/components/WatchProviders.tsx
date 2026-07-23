"use client";

import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface WatchProvidersProps {
  providersData?: any;
  countryCode?: string;
}

export default function WatchProviders({ providersData, countryCode = 'US' }: WatchProvidersProps) {
  if (!providersData || !providersData.results) return null;

  const countryData = providersData.results[countryCode];
  
  if (!countryData) return null;

  const { flatrate, rent, buy, link } = countryData;

  const hasAnyProviders = flatrate?.length > 0 || rent?.length > 0 || buy?.length > 0;

  if (!hasAnyProviders) return null;

  const renderProviderGroup = (title: string, providers: any[]) => {
    if (!providers || providers.length === 0) return null;
    
    // Deduplicate by provider_id just in case
    const uniqueProviders = Array.from(new Map(providers.map(p => [p.provider_id, p])).values());

    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="flex flex-wrap gap-3">
          {uniqueProviders.map((provider: any) => (
            <div 
              key={provider.provider_id} 
              className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm ring-1 ring-border"
              title={provider.provider_name}
            >
              <Image 
                src={getImageUrl(provider.logo_path, 'w92')} 
                alt={provider.provider_name}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-muted/50 rounded-2xl p-5 border border-border/50 backdrop-blur-sm mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground text-lg">Where to Watch</h3>
        {link && (
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-accent hover:text-accent/80 flex items-center transition-colors font-medium"
          >
            Powered by JustWatch <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        )}
      </div>
      
      <div className="flex flex-col gap-5">
        {renderProviderGroup("Stream", flatrate)}
        {renderProviderGroup("Rent", rent)}
        {renderProviderGroup("Buy", buy)}
      </div>
    </div>
  );
}
