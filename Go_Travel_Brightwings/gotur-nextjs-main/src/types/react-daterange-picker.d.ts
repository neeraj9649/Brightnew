declare module 'react-daterange-picker' {
    import * as React from 'react';
  
    export interface DateRangePickerProps {
      onChange: (value: [Date, Date]) => void;
      value: [Date, Date] | null;
      calendarIcon?: React.ReactNode;
      clearIcon?: React.ReactNode;
      format?: string;
      className?: string;
      // Add any other props as needed
    }
  
    const DateRangePicker: React.FC<DateRangePickerProps>;
  
    export default DateRangePicker;
  }
  