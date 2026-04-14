import { useEffect, useState } from 'react';

export const useFadeIn = (delay = 0, duration = 300) => {
  const [style, setStyle] = useState({
    opacity: 0,
    transform: 'translateY(10px)',
    transition: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStyle({
        opacity: 1,
        transform: 'translateY(0)',
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration]);

  return style;
};

export const useSequentialFadeIn = (itemCount: number, baseDelay = 0, stepDelay = 50) => {
  const [styles, setStyles] = useState<Array<{ opacity: number; transform: string; transition: string }>>([]);

  useEffect(() => {
    const newStyles = Array.from({ length: itemCount }).map((_, i) => ({
      opacity: 0,
      transform: 'translateY(10px)',
      transition: ''
    }));
    setStyles(newStyles);

    const timers = newStyles.map((_, i) => {
      return setTimeout(() => {
        setStyles(prev => {
          const updated = [...prev];
          updated[i] = {
            opacity: 1,
            transform: 'translateY(0)',
            transition: `opacity 300ms ease, transform 300ms ease`,
          };
          return updated;
        });
      }, baseDelay + i * stepDelay);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [itemCount, baseDelay, stepDelay]);

  return styles;
};

export const useZoomIn = (delay = 0, duration = 300) => {
  const [style, setStyle] = useState({
    opacity: 0,
    transform: 'scale(0.95)',
    transition: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStyle({
        opacity: 1,
        transform: 'scale(1)',
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration]);

  return style;
};

export const useSlideIn = (direction: 'left' | 'right' | 'up' | 'down' = 'right', delay = 0, duration = 300) => {
  const getInitialTransform = () => {
    switch (direction) {
      case 'left': return 'translateX(-20px)';
      case 'right': return 'translateX(20px)';
      case 'up': return 'translateY(-20px)';
      case 'down': return 'translateY(20px)';
    }
  };

  const [style, setStyle] = useState({
    opacity: 0,
    transform: getInitialTransform(),
    transition: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStyle({
        opacity: 1,
        transform: 'translate(0)',
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, direction]);

  return style;
};
