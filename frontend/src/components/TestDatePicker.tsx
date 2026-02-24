/**
 * TEST-ONLY FEATURE: Date Picker for Routine Testing
 * 
 * This component provides a dropdown to select a test date for routine system debugging.
 * It displays the last 31 days (today and previous 30 days) in a user-friendly format.
 * 
 * Visual design clearly indicates this is a testing feature with distinctive styling
 * and a "TEST" label to prevent confusion with production features.
 */

import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TestDatePickerProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
}

export default function TestDatePicker({ selectedDate, onDateChange }: TestDatePickerProps) {
  // Generate last 31 days (today + previous 30 days)
  const generateDateOptions = (): { value: string; label: string; date: Date }[] => {
    const options: { value: string; label: string; date: Date }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 31; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      let label: string;
      if (i === 0) {
        label = 'Today';
      } else if (i === 1) {
        label = 'Yesterday';
      } else {
        label = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }

      options.push({
        value: date.toISOString(),
        label,
        date,
      });
    }

    return options;
  };

  const dateOptions = generateDateOptions();

  const handleValueChange = (value: string) => {
    if (value === 'real-date') {
      onDateChange(null);
    } else {
      const option = dateOptions.find(opt => opt.value === value);
      if (option) {
        onDateChange(option.date);
      }
    }
  };

  const selectedValue = selectedDate 
    ? dateOptions.find(opt => 
        new Date(opt.value).toDateString() === selectedDate.toDateString()
      )?.value || 'real-date'
    : 'real-date';

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-md border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/30">
      <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
        TEST
      </span>
      <Select value={selectedValue} onValueChange={handleValueChange}>
        <SelectTrigger className="h-7 w-[140px] text-xs border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-900">
          <Calendar className="h-3 w-3 mr-1 text-orange-600 dark:text-orange-400" />
          <SelectValue placeholder="Select date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="real-date" className="text-xs font-semibold text-green-600 dark:text-green-400">
            Real Date (Live)
          </SelectItem>
          {dateOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
