
'use client';

import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { QrCode, Loader2 } from 'lucide-react';
import * as QRCode from 'qrcode';

interface ProjectQRCodeProps {
  url: string;
  title: string;
  description: string;
}

export default function ProjectQRCode({ url, title, description }: ProjectQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateQRCode = async () => {
    if (!url) {
      setQrCodeUrl(null);
      return;
    }
    setIsLoading(true);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        margin: 2,
        scale: 6,
        color: {
          dark: '#1F2937', // foreground
          light: '#FFFFFF00', // transparent background
        },
      });
      setQrCodeUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR code', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Re-generate QR code if the URL changes
  useEffect(() => {
    // Only generate if the popover is open (which would have already set the initial one)
    // or if the component is just used standalone and url changes.
    // In our case it is always in a Popover, so it is fine to only check for url
    generateQRCode();
  }, [url]);


  return (
    <Popover onOpenChange={(open) => {
        if (open) {
            generateQRCode();
        } else {
            setQrCodeUrl(null); // Clear QR code when closing to ensure it's fresh next time
        }
    }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <QrCode className="h-5 w-5" />
          <span className="sr-only">Mostrar código QR</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex flex-col items-center gap-4">
          <h4 className="font-semibold text-center">{title}</h4>
          <div className="w-48 h-48 flex items-center justify-center">
            {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {qrCodeUrl && !isLoading && (
              <img src={qrCodeUrl} alt={`QR Code for ${title}`} className="rounded-lg" />
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-[200px]">
            {description}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
