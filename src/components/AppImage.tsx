import { useEffect, useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react';

interface AppImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackSrc: string;
}

export function AppImage({ src, fallbackSrc, alt, className, onError, loading = 'lazy', decoding = 'async', ...props }: AppImageProps) {
  const initialSource = src || fallbackSrc;
  const [currentSource, setCurrentSource] = useState(initialSource);

  useEffect(() => {
    setCurrentSource(src || fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    onError?.(event);
    if (currentSource !== fallbackSrc) setCurrentSource(fallbackSrc);
  };

  return (
    <img
      {...props}
      src={currentSource}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={handleError}
    />
  );
}
