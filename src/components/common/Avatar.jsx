import { useRef, useState, useEffect } from 'react';
import { User, Stethoscope, Camera } from 'lucide-react';
import './Avatar.css';

const STORAGE_KEY = 'medchain_avatar';
const MAX_SIZE = 200; // pixels - redimensiona para economizar localStorage
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB máx no arquivo original

function getStorageKey(userId) {
  return `${STORAGE_KEY}_${userId}`;
}

function loadAvatar(userId) {
  if (!userId) return null;
  try {
    return localStorage.getItem(getStorageKey(userId));
  } catch {
    return null;
  }
}

function saveAvatar(userId, dataUrl) {
  if (!userId || !dataUrl) return false;
  try {
    localStorage.setItem(getStorageKey(userId), dataUrl);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('Espaço no navegador insuficiente para salvar a foto.');
    }
    return false;
  }
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível processar a imagem.'));
    };

    img.src = url;
  });
}

export function Avatar({ userId, isDoctor = false, size = 48, editable = true, variant = 'sidebar' }) {
  const inputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    setAvatarUrl(loadAvatar(userId));
  }, [userId]);

  const handleStorageChange = (e) => {
    if (e.key === getStorageKey(userId) && e.newValue !== avatarUrl) {
      setAvatarUrl(e.newValue);
    }
  };

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId, avatarUrl]);

  const handleClick = () => {
    if (editable && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem (JPG, PNG ou GIF).');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    try {
      const dataUrl = await resizeImage(file);
      if (saveAvatar(userId, dataUrl)) {
        setAvatarUrl(dataUrl);
      } else {
        alert('Não foi possível salvar a foto. Tente uma imagem menor.');
      }
    } catch (err) {
      alert(err.message || 'Erro ao processar a imagem.');
    }

    e.target.value = '';
  };

  const Icon = isDoctor ? Stethoscope : User;

  return (
    <div
      className={`avatar avatar--${variant} ${editable ? 'avatar--editable' : ''}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      onClick={handleClick}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={editable ? (e) => e.key === 'Enter' && handleClick() : undefined}
      title={editable ? 'Clique para trocar a foto' : undefined}
      aria-label={editable ? 'Alterar foto do perfil' : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="avatar-input"
        aria-hidden
      />
      {avatarUrl ? (
        <img src={avatarUrl} alt="Foto do perfil" className="avatar-img" />
      ) : (
        <span className="avatar-icon">
          <Icon size={Math.round(size * 0.55)} strokeWidth={2} />
        </span>
      )}
      {editable && (
        <span className="avatar-overlay" aria-hidden>
          <Camera size={Math.round(size * 0.4)} strokeWidth={2} />
        </span>
      )}
    </div>
  );
}
