import { useRef, useState, useEffect } from 'react';
import { User, Stethoscope, Camera } from 'lucide-react';
import './Avatar.css';

const STORAGE_KEY = 'medchain_avatar';
const MAX_SIZE = 120; // pixels - menor para evitar estourar quota do localStorage
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB máx no arquivo original

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
  if (!userId || !dataUrl) return { ok: false, reason: 'no_user' };
  try {
    localStorage.setItem(getStorageKey(userId), dataUrl);
    return { ok: true };
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      return { ok: false, reason: 'quota' };
    }
    return { ok: false, reason: 'unknown' };
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

      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível processar a imagem.'));
    };

    img.src = url;
  });
}

export function Avatar({ userId, isDoctor = false, size = 48, editable = true, variant = 'sidebar', initials }) {
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
      if (!userId) {
        alert('Não foi possível salvar a foto. Faça login novamente.');
        return;
      }
      const dataUrl = await resizeImage(file);
      const result = saveAvatar(userId, dataUrl);
      if (result.ok) {
        setAvatarUrl(dataUrl);
      } else if (result.reason === 'quota') {
        alert('Espaço no navegador insuficiente. Tente uma imagem menor ou limpe dados do site.');
      } else {
        alert('Não foi possível salvar a foto. Tente novamente.');
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
      style={{ width: size, height: size, minWidth: size, minHeight: size, '--avatar-size': `${size}px` }}
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
      ) : initials ? (
        <span className="avatar-initials">{initials}</span>
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
