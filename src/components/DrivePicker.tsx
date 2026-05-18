import React, { useEffect, useState, useCallback } from 'react';
import { getGoogleAccessToken, googleSignIn } from '../lib/googleAuth';
import { Database, FileText, Loader2, Cloud } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface DrivePickerProps {
  onFileSelect: (file: any) => void;
  buttonLabel?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const DrivePicker: React.FC<DrivePickerProps> = ({ 
  onFileSelect, 
  buttonLabel = "Seleccionar de Drive",
  className = "" 
}) => {
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load the Google Picker API script
  useEffect(() => {
    const loadScripts = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', () => {
          setPickerApiLoaded(true);
        });
      };
      document.body.appendChild(script);
    };

    if (!window.gapi) {
      loadScripts();
    } else if (!window.gapi.picker) {
      window.gapi.load('picker', () => {
        setPickerApiLoaded(true);
      });
    } else {
      setPickerApiLoaded(true);
    }
  }, []);

  const createPicker = useCallback((token: string) => {
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    view.setIncludeFolders(true);
    
    const picker = new window.google.picker.PickerBuilder()
      .setAppId(firebaseConfig.projectId)
      .setOAuthToken(token)
      .setDeveloperKey(firebaseConfig.apiKey)
      .addView(view)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          onFileSelect(file);
        }
      })
      .build();
    
    picker.setVisible(true);
  }, [onFileSelect]);

  const handleOpenPicker = async () => {
    if (!pickerApiLoaded) return;
    
    setIsLoading(true);
    try {
      let token = getGoogleAccessToken();
      if (!token) {
        const result = await googleSignIn();
        token = result?.accessToken || null;
      }
      
      if (token) {
        createPicker(token);
      } else {
        console.error('No se pudo obtener el token de acceso');
      }
    } catch (error) {
      console.error('Error al abrir el picker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleOpenPicker}
      disabled={!pickerApiLoaded || isLoading}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <Cloud size={16} />
      )}
      {buttonLabel}
    </button>
  );
};

export default DrivePicker;
