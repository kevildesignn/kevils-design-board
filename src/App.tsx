import React, { useState, useEffect, useMemo } from 'react';

interface BoardImage {
  id: string;
  url: string;
  aspectRatio?: number; // width / height
  width?: number;
  height?: number;
}

// Built-in initial images from Kevil's Visual-design folder
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
  // Additional high-grade graphic design placeholders matching Figma board until user uploads more
  {
    id: '04',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1200 / 1600,
  },
  {
    id: '05',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1200 / 1800,
  },
  {
    id: '06',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1400 / 933,
  },
  {
    id: '07',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1200 / 1500,
  },
  {
    id: '08',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1200 / 1600,
  },
  {
    id: '09',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1400 / 1050,
  },
  {
    id: '10',
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1200 / 1800,
  },
  {
    id: '11',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1200 / 1500,
  },
  {
    id: '12',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1200 / 1600,
  },
  {
    id: '13',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1200 / 1700,
  },
  {
    id: '14',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1200 / 1500,
  },
  {
    id: '15',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85',
    aspectRatio: 1400 / 1050,
  }
];

export const App: React.FC = () => {
  const [images, setImages] = useState<BoardImage[]>(DEFAULT_IMAGES);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  // Track window resize for responsive columns
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle escape key for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync with GitHub repository if available
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

  // Determine number of columns (5 on desktop as in Figma)
  const columnCount = useMemo(() => {
    if (windowWidth < 520) return 1;
    if (windowWidth < 768) return 2;
    if (windowWidth < 1024) return 3;
    if (windowWidth < 1280) return 4;
    return 5; // Exact 5 columns as specified in Figma node-id 10:41
  }, [windowWidth]);

  // Smart Waterfall Distribution:
  // Places each image in the column that currently has the shortest height
  const columns = useMemo(() => {
    const cols: BoardImage[][] = Array.from({ length: columnCount }, () => []);
    const heights = new Array(columnCount).fill(0);

    images.forEach((img) => {
      // Calculate height multiplier (height / width)
      const heightFactor = img.aspectRatio ? 1 / img.aspectRatio : 1.25;

      // Find the column with the minimum cumulative height
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
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Header: Pure, bold, exact to Figma */}
      <header className="board-header">
        <h1 className="board-title">Kevil’s Visual board</h1>
      </header>

      {/* 5-Column Masonry Grid: Pure artwork, no titles, no 3-dots, no filters */}
      <main className="board-container">
        <div className="board-grid">
          {columns.map((colImages, colIdx) => (
            <div key={`col-${colIdx}`} className="board-column">
              {colImages.map((img, imgIdx) => {
                const isLCP = colIdx + imgIdx * columnCount < 5;
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

      {/* Clean Fullscreen Image Lightbox on click */}
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
