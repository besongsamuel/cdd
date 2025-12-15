import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import { supabase } from '../../services/supabase';

interface ImageUploadProps {
  mode: 'single' | 'multiple';
  bucket: string;
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  label?: string;
  maxFiles?: number;
  accept?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export const ImageUpload = ({
  mode,
  bucket,
  value,
  onChange,
  label,
  maxFiles = 10,
  accept = 'image/*',
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    },
    [bucket]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (mode === 'single') {
      const file = files[0];
      setUploading(true);
      setUploadProgress([{ file, progress: 0 }]);

      try {
        const url = await uploadFile(file);
        onChange(url);
        setUploadProgress([]);
      } catch (error) {
        console.error('Error uploading image:', error);
        setUploadProgress([{ file, progress: 0, error: 'Upload failed' }]);
        alert('Failed to upload image');
      } finally {
        setUploading(false);
        // Reset input
        e.target.value = '';
      }
    } else {
      // Multiple mode
      const filesToUpload = files.slice(0, maxFiles);
      setUploading(true);

      const initialProgress: UploadProgress[] = filesToUpload.map((file) => ({
        file,
        progress: 0,
      }));
      setUploadProgress(initialProgress);

      try {
        const urls: string[] = [];
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          try {
            const url = await uploadFile(file);
            urls.push(url);
            setUploadProgress((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, progress: 100, url } : p
              )
            );
          } catch (error) {
            console.error('Error uploading image:', error);
            setUploadProgress((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, error: 'Upload failed' } : p
              )
            );
          }
        }

        const currentUrls = Array.isArray(value) ? value : [];
        onChange([...currentUrls, ...urls]);
        setUploadProgress([]);
      } catch (error) {
        console.error('Error uploading images:', error);
        alert('Failed to upload some images');
      } finally {
        setUploading(false);
        // Reset input
        e.target.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    if (mode === 'single') {
      onChange('');
    } else {
      const currentUrls = Array.isArray(value) ? value : [];
      const newUrls = currentUrls.filter((_, i) => i !== index);
      onChange(newUrls);
    }
  };

  const currentUrls: string[] =
    mode === 'single'
      ? (typeof value === 'string' && value ? [value] : [])
      : Array.isArray(value)
      ? value
      : [];

  return (
    <Box>
      {label && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}

      <Box sx={{ mb: 2 }}>
        <input
          accept={accept}
          style={{ display: 'none' }}
          id={`image-upload-${mode}`}
          type="file"
          multiple={mode === 'multiple'}
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <label htmlFor={`image-upload-${mode}`}>
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            disabled={uploading}
            fullWidth
          >
            {uploading ? 'Uploading...' : `Upload ${mode === 'single' ? 'Image' : 'Images'}`}
          </Button>
        </label>
      </Box>

      {uploadProgress.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {uploadProgress.map((progress, idx) => (
            <Box key={idx} sx={{ mb: 1 }}>
              <Typography variant="caption" display="block" gutterBottom>
                {progress.file.name}
              </Typography>
              {progress.error ? (
                <Typography variant="caption" color="error">
                  {progress.error}
                </Typography>
              ) : (
                <LinearProgress
                  variant={progress.progress === 100 ? 'determinate' : 'indeterminate'}
                  value={progress.progress}
                />
              )}
            </Box>
          ))}
        </Box>
      )}

      {currentUrls.length > 0 && (
        <Stack spacing={2}>
          {currentUrls.map((url, index) => (
            <Paper
              key={index}
              sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                {url ? (
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <ImageIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                )}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" noWrap>
                  {url}
                </Typography>
              </Box>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemove(index)}
                disabled={uploading}
              >
                <DeleteIcon />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      )}

      {mode === 'multiple' && currentUrls.length >= maxFiles && (
        <Typography variant="caption" color="text.secondary">
          Maximum {maxFiles} images reached
        </Typography>
      )}
    </Box>
  );
};


