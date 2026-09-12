import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2 } from 'lucide-react';

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

  // Development/Admin detection: ONLY visible on localhost or with ?admin=true
  const isDevMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasAdminQuery = window.location.search.includes('admin=true');
    const hasAdminStorage = localStorage.getItem('kdb_is_admin') === 'true';
    return isLocal || hasAdminQuery || hasAdminStorage;
  }, []);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GitHub token stored ONLY in your private browser localStorage (never bundled or exposed)
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem('kdb_gh_token') || '';
  });

  // Track window resize to fluidly adjust columns
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard escape for lightbox & modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
        setIsUploadModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch all images from GitHub repository Visual-design folder
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

  // Handle direct in-browser commit to GitHub repository (Original Quality)
  const handleDirectGitHubUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadStatus('Reading original image data...');

    try {
      // 1. Read original file as base64 without ANY quality loss or recompression
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(uploadFile);
      });

      setUploadStatus('Committing directly to GitHub Visual-design...');

      // Clean filename
      const cleanName = uploadFile.name.replace(/\s+/g, '-');
      const filename = `${Date.now()}_${cleanName}`;
      const url = `https://api.github.com/repos/kevildesignn/kevils-design-board/contents/Visual-design/${filename}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: `Upload poster: ${filename}`,
          content: base64,
          branch: 'main',
          committer: {
            name: 'Kevil Darji',
            email: 'kevildesignn@gmail.com',
          },
          author: {
            name: 'Kevil Darji',
            email: 'kevildesignn@gmail.com',
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'GitHub API error.');
      }

      setUploadStatus('Committed! Generating CDN link...');

      // Save token for next time
      localStorage.setItem('kdb_gh_token', githubToken);

      const cdnUrl = `https://cdn.jsdelivr.net/gh/kevildesignn/kevils-design-board@main/Visual-design/${filename}`;
      
      const newImg: BoardImage = {
        id: `gh-${filename}`,
        url: cdnUrl,
      };

      // Add to board immediately
      setImages((prev) => [newImg, ...prev]);

      setUploadStatus('Successfully added to online board!');
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadPreview('');
        setUploadStatus('');
      }, 1000);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message || 'Upload failed'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Dev-Only Delete handler (Figma node 14:2121)
  const handleDeleteImage = async (imgToDelete: BoardImage, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't open lightbox

    const confirmed = window.confirm('Are you sure you want to delete this poster?');
    if (!confirmed) return;

    // 1. Remove from active UI state immediately
    setImages((prev) => prev.filter((img) => img.id !== imgToDelete.id));

    // 2. If it's a GitHub image and token is saved, delete from remote repo too
    try {
      const match = imgToDelete.url.match(/Visual-design\/([^?#]+)/);
      if (match && match[1] && githubToken) {
        const filename = match[1];
        const getFileRes = await fetch(
          `https://api.github.com/repos/kevildesignn/kevils-design-board/contents/Visual-design/${filename}`,
          { headers: { Authorization: `Bearer ${githubToken}` } }
        );
        if (getFileRes.ok) {
          const fileData = await getFileRes.json();
          await fetch(
            `https://api.github.com/repos/kevildesignn/kevils-design-board/contents/Visual-design/${filename}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${githubToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Delete poster: ${filename}`,
                sha: fileData.sha,
                branch: 'main',
              }),
            }
          );
        }
      }
    } catch (err) {
      console.warn('Could not delete from remote GitHub, removed from local view.', err);
    }
  };

  /**
   * Adaptive column count:
   * - Mobile (<680px): exactly 2 columns
   * - iPad portrait (<1000px): 3 columns
   * - Desktop & 27" screens: 5 columns
   */
  const columnCount = useMemo(() => {
    if (windowWidth < 680) return 2;
    if (windowWidth < 1000) return 3;
    return 5;
  }, [windowWidth]);

  /**
   * Smart Waterfall:
   * Natural heights, pure images, zero letterboxing or background.
   */
  const columns = useMemo(() => {
    const cols: BoardImage[][] = Array.from({ length: columnCount }, () => []);
    const heights = new Array(columnCount).fill(0);

    images.forEach((img) => {
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
      {/* Header with Title and Dev-Only Upload Button */}
      <header className="board-header">
        <h1 className="board-title">Kevil’s Visual board</h1>

        {/* Development side upload button (ONLY visible on your side / localhost) */}
        {isDevMode && (
          <div className="dev-upload-badge">
            <button
              className="dev-upload-btn"
              onClick={() => setIsUploadModalOpen(true)}
              title="Upload new poster directly to GitHub Visual-design"
            >
              + Upload Poster
            </button>
            <span className="dev-sync-status">● Dev Mode Active</span>
          </div>
        )}
      </header>

      {/* Full-width board with uniform edge-to-edge gap */}
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

                    {/* Dev-Only Hover Overlay with Delete Button (Figma node 14:2121) */}
                    {isDevMode && (
                      <div className="dev-card-overlay">
                        <button
                          className="dev-delete-btn"
                          onClick={(e) => handleDeleteImage(img, e)}
                          title="Delete poster"
                        >
                          <Trash2 size={18} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </main>

      {/* Dev-Only Direct GitHub Upload Modal */}
      {isUploadModalOpen && (
        <div className="upload-modal-backdrop" onClick={() => setIsUploadModalOpen(false)}>
          <div className="upload-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '18px' }}>
                  Upload Poster to GitHub
                </h3>
                <p style={{ fontSize: '12px', color: '#666666' }}>
                  Commits directly to <code>Visual-design/</code> in 100% original quality
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Dropzone */}
            <div
              className="upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const f = e.dataTransfer.files[0];
                  setUploadFile(f);
                  setUploadPreview(URL.createObjectURL(f));
                }
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const f = e.target.files[0];
                    setUploadFile(f);
                    setUploadPreview(URL.createObjectURL(f));
                  }
                }}
              />

              {uploadPreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    style={{ width: '70px', height: '90px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#000000' }}>
                      {uploadFile?.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#777777', marginTop: '4px' }}>
                      {uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Original Quality` : ''}
                    </p>
                    <span style={{ fontSize: '12px', color: '#0066cc', marginTop: '6px', display: 'inline-block' }}>
                      Click to choose another image
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 600, fontSize: '15px' }}>Click or drop your poster here</p>
                  <p style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>
                    PNG, JPG, WebP from Figma, Photoshop, Illustrator
                  </p>
                </div>
              )}
            </div>

            {/* Status / Feedback */}
            {uploadStatus && (
              <p style={{ fontSize: '13px', color: uploadStatus.startsWith('Error') ? '#ff3333' : '#009933', margin: '10px 0', fontWeight: 500 }}>
                {uploadStatus}
              </p>
            )}

            {!githubToken && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#444444', marginBottom: '6px' }}>
                  GitHub Personal Access Token (repo scope)
                </label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #dddddd',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                style={{
                  background: '#eeeeee',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'Poppins',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDirectGitHubUpload}
                disabled={!uploadFile || isUploading}
                style={{
                  background: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 22px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  cursor: uploadFile && !isUploading ? 'pointer' : 'not-allowed',
                  fontFamily: 'Poppins',
                  fontWeight: 600,
                  opacity: uploadFile && !isUploading ? 1 : 0.6,
                }}
              >
                {isUploading ? 'Uploading to GitHub...' : 'Upload & Publish Online'}
              </button>
            </div>
          </div>
        </div>
      )}

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
