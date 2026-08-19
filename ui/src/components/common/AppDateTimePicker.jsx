import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

/**
 * Reusable DateTimePicker wrapper that handles string ↔ dayjs conversion.
 *
 * Accepts and emits plain string values (ISO / datetime-local format) so
 * consuming components don't need to depend on dayjs directly.
 *
 * @param {string}   value    – date string (ISO or YYYY-MM-DDTHH:mm)
 * @param {function} onChange – called with the formatted string (or '' when cleared)
 * @param {string}   format   – dayjs output format, defaults to datetime-local compatible
 * @param {object}   slotProps – forwarded to DateTimePicker slotProps
 */
export default function AppDateTimePicker({
  value,
  onChange,
  label,
  format = 'YYYY-MM-DDTHH:mm',
  slotProps = {},
  ...rest
}) {
  const handleChange = (newValue) => {
    if (!newValue || !newValue.isValid()) {
      onChange('');
      return;
    }
    onChange(newValue.format(format));
  };

  return (
    <DateTimePicker
      label={label}
      value={value ? dayjs(value) : null}
      onChange={handleChange}
      slotProps={slotProps}
      {...rest}
    />
  );
}
