import React, { useState, useEffect, useMemo } from 'react';

interface BoardImage {
  id: string;
  url: string;
  aspectRatio?: number; // width / height
  width?: number;
  height?: number;
}

// Initial images starting with Kevil's Visual-design artifacts
const DEFAULT_IMAGES: BoardImage[] = [
  {
    id: '01',
    url: '/Visual-design/01.png',
    width: 2400,
    height: 1582,
    aspectRatio: 2400 / 1582,
  },
  {
    id: '02',
    url: '/Visual-design/02.png',
    width: 1472,
    height: 1838,
    aspectRatio: 1472 / 1838,
  },
  {
    id: '03',
    url: '/Visual-design/03.png',
    width: 1472,
    height: 1650,
    aspectRatio: 1472 / 1650,
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
    aspectRatio: 1400 / 933,
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
    aspectRatio: 1400 / 1050,
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
    aspectRatio: 1400 / 1050,
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
    aspectRatio: 1400 / 1000,
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

export const App: React.FC = () => {
  const [images, setImages] = useState<BoardImage[]>(DEFAULT_IMAGES);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );

  // Track window resize to fluidly adjust columns & sizing
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard escape for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Automatic GitHub repo sync: fetches new images committed to Visual-design
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
        // Fallback silently to local images
      }
    };

    fetchGitHubImages();
  }, []);

  /**
   * Fluid column logic:
   * - Mobile (<680px): exactly 2 columns
   * - iPad portrait (680px - 960px): 3 columns
   * - iPad landscape / small laptop (961px - 1200px): 4 columns
   * - Desktop & 27-inch displays (>= 1201px): 5 large, prominent columns
   *   (On a 2560px 27" monitor, 5 columns make each artwork ~490px wide, big, bold, and detailed!)
   */
  const columnCount = useMemo(() => {
    if (windowWidth < 680) return 2; // Mobile is always 2 columns
    if (windowWidth < 960) return 3; // iPad portrait
    if (windowWidth < 1200) return 4; // iPad landscape
    return 5; // Desktop and 27" displays (5 large columns)
  }, [windowWidth]);

  /**
   * Smart Waterfall Distribution:
   * Dynamically measures aspect ratios and places each artwork
   * into whichever column currently has the minimum cumulative height.
   */
  const columns = useMemo(() => {
    const cols: BoardImage[][] = Array.from({ length: columnCount }, () => []);
    const heights = new Array(columnCount).fill(0);

    images.forEach((img) => {
      // Calculate relative height multiplier (height / width)
      const heightFactor = img.aspectRatio ? 1 / img.aspectRatio : 1.25;

      let minCol = 0;
      let minH = heights[0];
      for (let i = 1; i < columnCount; i++) {
        if (heights[i] < minH) {
          minH = heights[i];
          minCol = i;
        }
      }

      cols[minCol].push(img);
      heights[minCol] += heightFactor;
    });

    return cols;
  }, [images, columnCount]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', width: '100%' }}>
      {/* Header: Centered, exact bold Poppins title */}
      <header className="board-header">
        <h1 className="board-title">Kevil’s Visual board</h1>
      </header>

      {/* Full-width board: outer padding is exactly equal to inter-image gap */}
      <main className="board-container">
        <div className="board-grid">
          {columns.map((colImages, colIdx) => (
            <div key={`col-${colIdx}`} className="board-column">
              {colImages.map((img, imgIdx) => {
                const isLCP = colIdx + imgIdx * columnCount < columnCount;
                return (
                  <div
                    key={img.id}
                    className="board-item"
                    onClick={() => setSelectedImage(img.url)}
                  >
                    <img
                      src={img.url}
                      alt=""
                      loading={isLCP ? undefined : 'lazy'}
                      fetchPriority={isLCP ? 'high' : undefined}
                      decoding="async"
                    />
                  </div>
                );
              })}
            </div>
          ))}
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
