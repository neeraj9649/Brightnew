import React, { useState } from "react";
import Calendar, { CalendarProps } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./CalendarStyles.css";

const FullWidthCalendar: React.FC = () => {
  const [value, setValue] = useState<Date | null>(new Date());

  const handleChange: CalendarProps["onChange"] = (val) => {
    if (val instanceof Date) {
      setValue(val);
    }
  };

  return (
    <div className='w-100 max-w-100 '>
      <Calendar onChange={handleChange} value={value} />
    </div>
  );
};

export default FullWidthCalendar;
