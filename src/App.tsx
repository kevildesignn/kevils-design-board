import React, { useState, useEffect, useMemo, useRef } from 'react';

interface BoardImage {
  id: string;
  url: string;
  aspectRatio?: number; // width / height
  width?: number;
  height?: number;
}

const DEFAULT_IMAGES: BoardImage[] = [
  {
    id: '01',
    url: '/Visual-design/01.png',
    width: 2400,
    height: 1582,
    aspectRatio: 2400 / 1582, // 1.52 (Horizontal hero - spans 2 columns)
  },
  {
    id: '02',
    url: '/Visual-design/02.png',
    width: 1472,
    height: 1838,
    aspectRatio: 1472 / 1838, // 0.80 (Portrait)
  },
  {
    id: '03',
    url: '/Visual-design/03.png',
    width: 1472,
    height: 1650,
    aspectRatio: 1472 / 1650, // 0.89 (Portrait)
  },
  {
    id: '04',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1600,
  },
  {
    id: '05',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1800,
  },
  {
    id: '06',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1400 / 933, // 1.50 (Horizontal - spans 2 columns)
  },
  {
    id: '07',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1500,
  },
  {
    id: '08',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1600,
  },
  {
    id: '09',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1400 / 1050, // 1.33 (Horizontal - spans 2 columns)
  },
  {
    id: '10',
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1800,
  },
  {
    id: '11',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1500,
  },
  {
    id: '12',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1600,
  },
  {
    id: '13',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1700,
  },
  {
    id: '14',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1500,
  },
  {
    id: '15',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1400 / 1050, // 1.33 (Horizontal - spans 2 columns)
  },
  {
    id: '16',
    url: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1600,
  },
  {
    id: '17',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1500,
  },
  {
    id: '18',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1400 / 1000, // 1.40 (Horizontal - spans 2 columns)
  },
  {
    id: '19',
    url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1600,
  },
  {
    id: '20',
    url: 'https://images.unsplash.com/photo-1579783902258-23a3a2a6b2f4?auto=format&fit=crop&w=1400&q=85',
    aspectRatio: 1200 / 1500,
  }
];

interface PositionedItem {
  image: BoardImage;
  x: number;
  y: number;
  width: number;
  height: number;
  colSpan: number;
}

export const App: React.FC = () => {
  const [images, setImages] = useState<BoardImage[]>(DEFAULT_IMAGES);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1920;
  });

  // Track container width precisely
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      } else {
        setContainerWidth(window.innerWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Keyboard escape for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync new images from GitHub
  useEffect(() => {
    const fetchGitHubImages = async () => {
      try {
        const res = await fetch(
          'https://api.github.com/repos/kevildesignn/kevils-design-board/contents/Visual-design'
        );
        if (!res.ok) return;
        const files = await res.json();
        if (!Array.isArray(files)) return;

        const remoteImages: BoardImage[] = files
          .filter((file: any) => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            return file.type === 'file' && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
          })
          .map((file: any) => ({
            id: file.sha || file.name,
            url: `https://cdn.jsdelivr.net/gh/kevildesignn/kevils-design-board@main/Visual-design/${file.name}`,
          }));

        if (remoteImages.length > 0) {
          setImages((prev) => {
            const existingUrls = new Set(prev.map((img) => img.url));
            const newOnes = remoteImages.filter((img) => !existingUrls.has(img.url));
            return [...newOnes, ...prev];
          });
        }
      } catch (err) {
        // Fallback silently
      }
    };

    fetchGitHubImages();
  }, []);

  const handleImageLoaded = (id: string, ratio: number) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id && !img.aspectRatio ? { ...img, aspectRatio: ratio } : img))
    );
  };

  // Determine column count:
  // Mobile (<680px): 2 columns
  // iPad portrait (<960px): 3 columns
  // iPad landscape (<1200px): 4 columns
  // Desktop & 27" screens: 5 columns
  const columnCount = useMemo(() => {
    if (containerWidth < 680) return 2;
    if (containerWidth < 960) return 3;
    if (containerWidth < 1200) return 4;
    return 5;
  }, [containerWidth]);

  const gap = containerWidth < 680 ? 10 : 14;

  /**
   * Smart Multi-Column Packery Layout:
   * - Horizontal posters (aspectRatio >= 1.25, e.g. 3:2, 16:9, 01.png) span 2 columns!
   * - Because horizontal ones span 2 columns, their width is ~2x and their height matches
   *   the vertical posters perfectly (~500-600px tall), completely eliminating the "smaller" look!
   * - Single-column posters fit into the shortest column.
   */
  const { positionedItems, totalHeight } = useMemo(() => {
    const colHeights = new Array(columnCount).fill(0);
    const colWidth = (containerWidth - (columnCount - 1) * gap) / columnCount;

    const items: PositionedItem[] = [];

    images.forEach((img) => {
      const ratio = img.aspectRatio || 1.25;
      // Allow horizontal / landscape posters to span 2 columns
      const isWide = ratio >= 1.25 && columnCount >= 2;
      const colSpan = isWide ? 2 : 1;

      if (colSpan === 2) {
        // Find adjacent pair of columns [i, i+1] that has the minimum peak height
        let bestCol = 0;
        let minPeak = Math.max(colHeights[0], colHeights[1]);

        for (let i = 1; i <= columnCount - 2; i++) {
          const peak = Math.max(colHeights[i], colHeights[i + 1]);
          if (peak < minPeak) {
            minPeak = peak;
            bestCol = i;
          }
        }

        const width = colWidth * 2 + gap;
        const height = width / ratio;
        const x = bestCol * (colWidth + gap);
        const y = minPeak;

        items.push({
          image: img,
          x,
          y,
          width,
          height,
          colSpan: 2,
        });

        // Update column heights for both occupied columns
        const newH = y + height + gap;
        colHeights[bestCol] = newH;
        colHeights[bestCol + 1] = newH;
      } else {
        // Single column: find shortest column
        let minCol = 0;
        let minH = colHeights[0];

        for (let i = 1; i < columnCount; i++) {
          if (colHeights[i] < minH) {
            minH = colHeights[i];
            minCol = i;
          }
        }

        const width = colWidth;
        const height = width / ratio;
        const x = minCol * (colWidth + gap);
        const y = minH;

        items.push({
          image: img,
          x,
          y,
          width,
          height,
          colSpan: 1,
        });

        colHeights[minCol] = y + height + gap;
      }
    });

    const maxColHeight = Math.max(...colHeights);
    return { positionedItems: items, totalHeight: maxColHeight > 0 ? maxColHeight - gap : 0 };
  }, [images, columnCount, containerWidth, gap]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', width: '100%' }}>
      {/* Header: Centered bold Poppins title */}
      <header className="board-header">
        <h1 className="board-title">Kevil’s Visual board</h1>
      </header>

      {/* Full-width board with edge-to-edge padding equal to image gap */}
      <main className="board-container">
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            height: `${totalHeight}px`,
            minHeight: '400px',
          }}
        >
          {positionedItems.map((item, idx) => {
            const isLCP = idx < columnCount;
            return (
              <div
                key={item.image.id}
                className="board-item"
                style={{
                  position: 'absolute',
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${item.width}px`,
                  height: `${item.height}px`,
                  transition: 'transform 0.25s ease, opacity 0.25s ease',
                }}
                onClick={() => setSelectedImage(item.image.url)}
              >
                <img
                  src={item.image.url}
                  alt=""
                  loading={isLCP ? undefined : 'lazy'}
                  fetchPriority={isLCP ? 'high' : undefined}
                  decoding="async"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onLoad={(e) => {
                    const { naturalWidth, naturalHeight } = e.currentTarget;
                    if (naturalWidth && naturalHeight) {
                      handleImageLoaded(item.image.id, naturalWidth / naturalHeight);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      </main>

      {/* Minimalist Fullscreen Lightbox */}
      {selectedImage && (
        <div className="lightbox-backdrop" onClick={() => setSelectedImage(null)}>
          <button
            className="lightbox-close-btn"
            onClick={() => setSelectedImage(null)}
            aria-label="Close"
          >
            ✕
          </button>
          <div className="lightbox-image-wrapper" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="" className="lightbox-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
