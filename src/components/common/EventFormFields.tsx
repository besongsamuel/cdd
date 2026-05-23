import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Department, Ministry } from '../../types';
import { slugify } from '../../utils/slugify';
import { ImageUpload } from './ImageUpload';

export interface EventFormValues {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  slug: string;
  image_url: string;
  ministry_id: string;
  department_id: string;
}

export const emptyEventFormValues = (): EventFormValues => ({
  title: '',
  description: '',
  event_date: '',
  event_time: '',
  location: '',
  slug: '',
  image_url: '',
  ministry_id: '',
  department_id: '',
});

interface EventFormFieldsProps {
  value: EventFormValues;
  onChange: (value: EventFormValues) => void;
  ministries: Ministry[];
  departments: Department[];
  slugError?: string | null;
  isNewEvent?: boolean;
  slugManual?: boolean;
  onSlugManualEdit?: () => void;
}

export const EventFormFields = ({
  value,
  onChange,
  ministries,
  departments,
  slugError,
  isNewEvent = false,
  slugManual = false,
  onSlugManualEdit,
}: EventFormFieldsProps) => {
  const { t } = useTranslation('events');

  const update = (patch: Partial<EventFormValues>) => {
    const next = { ...value, ...patch };
    if (!slugManual && patch.title !== undefined) {
      next.slug = slugify(patch.title);
    }
    onChange(next);
  };

  return (
    <>
      <TextField
        fullWidth
        label="Title"
        value={value.title}
        onChange={(e) => update({ title: e.target.value })}
        margin="normal"
        required
      />
      <TextField
        fullWidth
        label={t('form.slug')}
        value={value.slug}
        onChange={(e) => {
          onSlugManualEdit?.();
          onChange({ ...value, slug: slugify(e.target.value) });
        }}
        onFocus={() => onSlugManualEdit?.()}
        margin="normal"
        required
        error={!!slugError}
        helperText={slugError || t('form.slugHelp')}
      />
      <ImageUpload
        mode="single"
        bucket="event-images"
        label={t('form.image')}
        value={value.image_url || undefined}
        onChange={(url) =>
          onChange({ ...value, image_url: typeof url === 'string' ? url : '' })
        }
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>{t('form.ministry')}</InputLabel>
        <Select
          value={value.ministry_id}
          label={t('form.ministry')}
          onChange={(e) => onChange({ ...value, ministry_id: e.target.value })}
        >
          <MenuItem value="">{t('form.none')}</MenuItem>
          {ministries.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>{t('form.department')}</InputLabel>
        <Select
          value={value.department_id}
          label={t('form.department')}
          onChange={(e) =>
            onChange({ ...value, department_id: e.target.value })
          }
        >
          <MenuItem value="">{t('form.none')}</MenuItem>
          {departments.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label="Description"
        value={value.description}
        onChange={(e) => update({ description: e.target.value })}
        margin="normal"
        multiline
        rows={4}
      />
      <TextField
        fullWidth
        label="Date"
        type="date"
        value={value.event_date}
        onChange={(e) => update({ event_date: e.target.value })}
        margin="normal"
        required
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        fullWidth
        label="Time"
        type="time"
        value={value.event_time}
        onChange={(e) => update({ event_time: e.target.value })}
        margin="normal"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        fullWidth
        label="Location"
        value={value.location}
        onChange={(e) => update({ location: e.target.value })}
        margin="normal"
      />
      {slugError && (
        <FormHelperText error sx={{ mx: 2 }}>
          {slugError}
        </FormHelperText>
      )}
    </>
  );
};

export function eventToFormValues(event: {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  slug?: string;
  image_url?: string;
  ministry_id?: string;
  department_id?: string;
}): EventFormValues {
  return {
    title: event.title,
    description: event.description || '',
    event_date: event.event_date,
    event_time: event.event_time || '',
    location: event.location || '',
    slug: event.slug || '',
    image_url: event.image_url || '',
    ministry_id: event.ministry_id || '',
    department_id: event.department_id || '',
  };
}

export function formValuesToEventPayload(values: EventFormValues) {
  return {
    title: values.title,
    description: values.description || undefined,
    event_date: values.event_date,
    event_time: values.event_time || undefined,
    location: values.location || undefined,
    slug: values.slug,
    image_url: values.image_url || undefined,
    ministry_id: values.ministry_id || undefined,
    department_id: values.department_id || undefined,
  };
}
