import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2, Loader2, Eye, EyeOff, Lock, LogOut, ArrowLeft } from 'lucide-react';

interface BoardImage {
  id: string;
  url: string;
  aspectRatio?: number; // width / height
  width?: number;
  height?: number;
}

// Initial images starting with Kevil's Visual-design artifacts served via CDN
const DEFAULT_IMAGES: BoardImage[] = [
  {
    id: '01',
    url: 'https://cdn.jsdelivr.net/gh/kevildesignn/kevils-design-board@main/Visual-design/01.png',
    width: 2400,
    height: 1582,
    aspectRatio: 2400 / 1582,
  },
  {
    id: '02',
    url: 'https://cdn.jsdelivr.net/gh/kevildesignn/kevils-design-board@main/Visual-design/02.png',
    width: 1472,
    height: 1838,
    aspectRatio: 1472 / 1838,
  },
  {
    id: '03',
    url: 'https://cdn.jsdelivr.net/gh/kevildesignn/kevils-design-board@main/Visual-design/03.png',
    width: 1472,
    height: 1650,
    aspectRatio: 1472 / 1650,
  }
];

// Local helper functions for tracking deleted files across sessions
const getDeletedFiles = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('kdb_deleted_files') || '[]');
  } catch {
    return [];
  }
};

const recordDeletedFile = (filename: string) => {
  try {
    const list = getDeletedFiles();
    if (!list.includes(filename)) {
      localStorage.setItem('kdb_deleted_files', JSON.stringify([...list, filename]));
    }
  } catch {}
};

const unrecordDeletedFile = (filename: string) => {
  try {
    const list = getDeletedFiles();
    const updated = list.filter((f) => f !== filename);
    localStorage.setItem('kdb_deleted_files', JSON.stringify(updated));
  } catch {}
};

const getInitialImages = (): BoardImage[] => {
  const deleted = getDeletedFiles();
  return DEFAULT_IMAGES.filter((img) => {
    const match = img.url.match(/Visual-design\/([^?#]+)/);
    if (match) {
      const filename = decodeURIComponent(match[1]);
      return !deleted.includes(filename);
    }
    return true;
  });
};

const KNOWN_RATIOS: Record<string, number> = {
  '01.png': 2400 / 1582,
  '02.png': 1472 / 1838,
  '03.png': 1472 / 1650,
};

const getImageRatio = (filename: string): number | undefined => {
  if (KNOWN_RATIOS[filename]) return KNOWN_RATIOS[filename];
  try {
    const saved = JSON.parse(localStorage.getItem('kdb_image_ratios') || '{}');
    if (saved[filename]) return saved[filename];
  } catch {}
  return undefined;
};

const saveImageRatio = (filename: string, ratio: number) => {
  try {
    const saved = JSON.parse(localStorage.getItem('kdb_image_ratios') || '{}');
    saved[filename] = ratio;
    localStorage.setItem('kdb_image_ratios', JSON.stringify(saved));
  } catch {}
};

interface BoardCardProps {
  img: BoardImage;
  isLCP: boolean;
  isDevMode: boolean;
  deletingId: string | null;
  onSelect: (url: string) => void;
  onDelete: (img: BoardImage, e: React.MouseEvent) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({
  img,
  isLCP,
  isDevMode,
  deletingId,
  onSelect,
  onDelete,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(img.aspectRatio);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if browser already has the image in memory/cache
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      const natural = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
      if (!aspectRatio && natural) {
        setAspectRatio(natural);
      }
    }
  }, [img.url, aspectRatio]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    const natural = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight;
    if (natural) {
      setAspectRatio(natural);
      const match = img.url.match(/Visual-design\/([^?#]+)/);
      if (match) {
        saveImageRatio(decodeURIComponent(match[1]), natural);
      }
    }
  };

  return (
    <div
      className="board-item"
      style={{
        aspectRatio: aspectRatio ? `${aspectRatio}` : '0.8',
      }}
      onClick={() => onSelect(img.url)}
    >
      {/* Individual Skeleton Loader tailored to this image's aspect ratio */}
      {!isLoaded && (
        <div className="card-skeleton" aria-hidden="true">
          <div className="skeleton-shimmer" />
        </div>
      )}

      <img
        ref={imgRef}
        src={img.url}
        alt=""
        className={`board-img ${isLoaded ? 'img-loaded' : 'img-loading'}`}
        loading={isLCP ? undefined : 'lazy'}
        fetchPriority={isLCP ? 'high' : undefined}
        decoding="async"
        onLoad={handleLoad}
      />

      {/* Dev-Only Hover Overlay with Delete Button (Figma node 14:2121) */}
      {isDevMode && (
        <div className="dev-card-overlay">
          <button
            className="dev-delete-btn"
            onClick={(e) => onDelete(img, e)}
            title="Delete poster from GitHub"
            disabled={deletingId === img.id}
          >
            {deletingId === img.id ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={18} />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const ADMIN_EMAIL_HASH = '3ec65ef31f52e274cc37d602050638a65eb9511dee217ee26bdbb4ef0e95ad6f';
const ADMIN_PASSWORD_HASH = '29242264f210efaeed7c7a149670431c38cbe813b775748f9d355d08d4af9f5a';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const emailH = await sha256(email.trim().toLowerCase());
      const passH = await sha256(password);

      if (emailH === ADMIN_EMAIL_HASH && passH === ADMIN_PASSWORD_HASH) {
        localStorage.setItem('kdb_admin_authenticated', 'true');
        onLoginSuccess();
      } else {
        setError('Incorrect email address or password.');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-badge">
            <Lock size={12} />
            <span>Admin Portal</span>
          </div>
          <h2 className="admin-login-title">Kevil’s Visual board</h2>
          <p className="admin-login-desc">Sign in to manage visual posters and upload designs</p>
        </div>

        {error && <div className="admin-error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-label">Email Address</label>
            <input
              type="email"
              className="admin-input"
              placeholder="kevildesignn@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Password</label>
            <div className="admin-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="admin-input admin-input-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="admin-submit-btn" disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Sign In to Admin</span>
            )}
          </button>
        </form>

        <button type="button" className="admin-back-btn" onClick={onBackToHome}>
          <ArrowLeft size={14} />
          <span>Back to Public Portfolio</span>
        </button>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [images, setImages] = useState<BoardImage[]>(getInitialImages);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: 'loading' | 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (type: 'loading' | 'success' | 'error' | 'info', message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast({ type, message });
    if (type !== 'loading') {
      toastTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
      }, 4000);
    }
  };

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );

  // Path tracking: recognizes /admin directly
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname;
  });

  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('kdb_admin_authenticated') === 'true';
  });

  // Admin route active if pathname starts with /admin or is /admin
  const isAdminRoute = currentPath.toLowerCase().startsWith('/admin');

  // Dev/Admin mode controls are active ONLY when user is authenticated on the admin route
  const isDevMode = isAdminRoute && isAdminAuthenticated;

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kdb_admin_authenticated');
    setIsAdminAuthenticated(false);
    navigateTo('/');
    showToast('info', 'Logged out of Admin.');
  };

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
        const headers: Record<string, string> = {
          Accept: 'application/vnd.github.v3+json',
        };
        const token = localStorage.getItem('kdb_gh_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(
          'https://api.github.com/repos/kevildesignn/kevils-design-board/contents/Visual-design',
          { headers }
        );
        if (!res.ok) return;
        const files = await res.json();
        if (!Array.isArray(files)) return;

        const deleted = getDeletedFiles();

        const remoteImages: BoardImage[] = files
          .filter((file: any) => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            return (
              file.type === 'file' &&
              ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) &&
              !deleted.includes(file.name)
            );
          })
          .map((file: any) => ({
            id: `gh-${file.name}`,
            url: `https://cdn.jsdelivr.net/gh/kevildesignn/kevils-design-board@main/Visual-design/${file.name}?v=${file.sha?.slice(0, 7) || Date.now()}`,
            aspectRatio: getImageRatio(file.name),
          }));

        setImages(remoteImages);
      } catch (err) {
        // Fallback silently
      }
    };

    fetchGitHubImages();
  }, []);

  // Handle direct in-browser commit to GitHub repository (Original Quality)
  const handleDirectGitHubUpload = async () => {
    if (!uploadFile) return;

    let token = githubToken || localStorage.getItem('kdb_gh_token') || '';
    if (!token) {
      const enteredToken = window.prompt(
        'Please enter your GitHub Personal Access Token (repo scope) to upload directly to GitHub:'
      );
      if (!enteredToken || !enteredToken.trim()) {
        showToast('error', 'Upload cancelled: GitHub token required.');
        return;
      }
      token = enteredToken.trim();
      setGithubToken(token);
      localStorage.setItem('kdb_gh_token', token);
    }

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
          Authorization: `Bearer ${token}`,
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

      // Ensure this filename is not marked as deleted
      unrecordDeletedFile(filename);

      // Measure natural dimensions so skeleton and layout are instantly exact
      const dims = await new Promise<{ width: number; height: number; aspectRatio: number }>((resolve) => {
        const i = new window.Image();
        i.onload = () =>
          resolve({
            width: i.naturalWidth,
            height: i.naturalHeight,
            aspectRatio: i.naturalWidth / i.naturalHeight,
          });
        i.onerror = () => resolve({ width: 1200, height: 1500, aspectRatio: 0.8 });
        i.src = uploadPreview || URL.createObjectURL(uploadFile);
      });

      saveImageRatio(filename, dims.aspectRatio);

      const cdnUrl = `https://cdn.jsdelivr.net/gh/kevildesignn/kevils-design-board@main/Visual-design/${filename}`;

      const newImg: BoardImage = {
        id: `gh-${filename}`,
        url: cdnUrl,
        width: dims.width,
        height: dims.height,
        aspectRatio: dims.aspectRatio,
      };

      // Add to board immediately
      setImages((prev) => [newImg, ...prev]);

      setUploadStatus('Successfully added to online board!');
      showToast('success', `"${filename}" uploaded to GitHub!`);
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadPreview('');
        setUploadStatus('');
      }, 1000);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message || 'Upload failed'}`);
      showToast('error', `Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Dev-Only Delete handler (Figma node 14:2121) - Deletes directly from GitHub repository
  const handleDeleteImage = async (imgToDelete: BoardImage, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't open lightbox
    if (deletingId) return; // Prevent concurrent deletes

    // Extract filename if it's a Visual-design image
    const match = imgToDelete.url.match(/Visual-design\/([^?#]+)/);
    const filename = match ? decodeURIComponent(match[1]) : null;

    const confirmMsg = filename
      ? `Are you sure you want to permanently delete "${filename}"?\n\nThis will remove the file from your GitHub repository (Visual-design/${filename}).`
      : 'Are you sure you want to remove this poster from the board?';

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    // If it's a demo card not in Visual-design on GitHub, just remove from view
    if (!filename) {
      setImages((prev) => prev.filter((img) => img.id !== imgToDelete.id));
      showToast('info', 'Demo poster removed from board.');
      return;
    }

    // It's a GitHub file in Visual-design/
    let token = githubToken || localStorage.getItem('kdb_gh_token') || '';
    if (!token) {
      const enteredToken = window.prompt(
        `To delete "${filename}" from GitHub, please enter your GitHub Personal Access Token (repo scope):`
      );
      if (!enteredToken || !enteredToken.trim()) {
        showToast('error', 'Deletion cancelled: GitHub token required.');
        return;
      }
      token = enteredToken.trim();
      setGithubToken(token);
      localStorage.setItem('kdb_gh_token', token);
    }

    setDeletingId(imgToDelete.id);
    showToast('loading', `Deleting "${filename}" from GitHub repository...`);

    try {
      // 1. Fetch file SHA from GitHub repository on main branch
      const getFileRes = await fetch(
        `https://api.github.com/repos/kevildesignn/kevils-design-board/contents/Visual-design/${encodeURIComponent(filename)}?ref=main`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (getFileRes.status === 404) {
        // File already absent from GitHub
        recordDeletedFile(filename);
        setImages((prev) => prev.filter((img) => img.id !== imgToDelete.id));
        showToast('info', `"${filename}" was already removed from GitHub. Removed from board.`);
        return;
      }

      if (getFileRes.status === 401 || getFileRes.status === 403) {
        const errJson = await getFileRes.json().catch(() => ({}));
        showToast('error', `GitHub Token Error: ${errJson.message || 'Token lacks repo permissions or is invalid.'}`);
        return;
      }

      if (!getFileRes.ok) {
        const errJson = await getFileRes.json().catch(() => ({}));
        showToast('error', `GitHub Error (${getFileRes.status}): ${errJson.message || 'Could not locate file.'}`);
        return;
      }

      const fileData = await getFileRes.json();
      const fileSha = fileData.sha;

      // 2. Send DELETE request to GitHub API contents endpoint
      const deleteRes = await fetch(
        `https://api.github.com/repos/kevildesignn/kevils-design-board/contents/Visual-design/${encodeURIComponent(filename)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            message: `Delete poster: ${filename}`,
            sha: fileSha,
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
        }
      );

      if (!deleteRes.ok) {
        const errJson = await deleteRes.json().catch(() => ({}));
        showToast('error', `GitHub Delete Failed: ${errJson.message || 'Could not delete file from repository.'}`);
        return;
      }

      // 3. Deletion verified on GitHub! Record deletion and remove from board
      recordDeletedFile(filename);
      setImages((prev) => prev.filter((img) => img.id !== imgToDelete.id));
      showToast('success', `"${filename}" deleted from GitHub repository!`);
    } catch (err: any) {
      showToast('error', `Network error during delete: ${err.message || 'Please try again.'}`);
    } finally {
      setDeletingId(null);
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

  // If on /admin and not yet authenticated, render the password-protected AdminLogin screen
  if (isAdminRoute && !isAdminAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setIsAdminAuthenticated(true);
          showToast('success', 'Welcome, Kevil!');
        }}
        onBackToHome={() => navigateTo('/')}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', width: '100%' }}>
      {/* Header with Title and Dev/Admin Controls */}
      <header className="board-header">
        <h1 className="board-title">Kevil’s Visual board</h1>

        {/* Admin Header Controls: visible only when authenticated on /admin */}
        {isDevMode ? (
          <div className="dev-upload-badge">
            <button
              className="dev-upload-btn"
              onClick={() => setIsUploadModalOpen(true)}
              title="Upload new poster directly to GitHub Visual-design"
            >
              + Upload Poster
            </button>
            <button
              className="dev-token-btn"
              onClick={() => {
                const current = localStorage.getItem('kdb_gh_token') || '';
                const entered = window.prompt(
                  'GitHub Personal Access Token (repo scope):\nUsed to commit uploads and delete posters directly on GitHub.',
                  current
                );
                if (entered !== null) {
                  const cleaned = entered.trim();
                  localStorage.setItem('kdb_gh_token', cleaned);
                  setGithubToken(cleaned);
                  showToast('success', cleaned ? 'GitHub token saved!' : 'GitHub token cleared.');
                }
              }}
              title="Manage GitHub Token"
            >
              <span className={`dev-token-dot ${githubToken ? 'connected' : 'disconnected'}`} />
              <span>{githubToken ? 'GitHub Connected' : 'Connect GitHub'}</span>
            </button>
            <button
              className="dev-preview-toggle-btn"
              onClick={() => navigateTo('/')}
              title="View Public Portfolio"
            >
              👁 Public Portfolio
            </button>
            <button
              className="dev-preview-toggle-btn"
              onClick={handleLogout}
              title="Log out of Admin"
            >
              <LogOut size={12} />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          isAdminAuthenticated && (
            <div className="dev-upload-badge">
              <button
                className="dev-preview-toggle-btn"
                onClick={() => navigateTo('/admin')}
                title="Go to Admin Panel"
              >
                <Lock size={12} />
                <span>Admin Dashboard</span>
              </button>
            </div>
          )
        )}
      </header>

      {/* Full-width board with uniform edge-to-edge gap */}
      <main className="board-container">
        {images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#888888' }}>
            <p style={{ fontSize: '16px', fontWeight: 500, fontFamily: 'Poppins', color: '#111111' }}>
              No posters on the board yet
            </p>
            {isDevMode && (
              <p style={{ fontSize: '13px', marginTop: '8px', color: '#777777' }}>
                Click <strong>+ Upload Poster</strong> above to add designs directly to your repository.
              </p>
            )}
          </div>
        ) : (
          <div className="board-grid">
          {columns.map((colImages, colIdx) => (
            <div key={`col-${colIdx}`} className="board-column">
              {colImages.map((img, imgIdx) => {
                const isLCP = colIdx + imgIdx * columnCount < columnCount;

                return (
                  <BoardCard
                    key={img.id}
                    img={img}
                    isLCP={isLCP}
                    isDevMode={isDevMode}
                    deletingId={deletingId}
                    onSelect={setSelectedImage}
                    onDelete={handleDeleteImage}
                  />
                );
              })}
            </div>
          ))}
          </div>
        )}
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

      {/* Dev-Only Toast Notification */}
      {isDevMode && toast && (
        <div className={`dev-toast toast-${toast.type}`}>
          {toast.type === 'loading' && <Loader2 size={16} className="spin-icon" />}
          {toast.type === 'success' && <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>}
          {toast.type === 'error' && <span style={{ color: '#ef4444', fontWeight: 700 }}>✕</span>}
          {toast.type === 'info' && <span style={{ color: '#9ca3af', fontWeight: 700 }}>ℹ</span>}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
