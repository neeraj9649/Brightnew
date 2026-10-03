import React from "react";
import type { DatePickerProps } from "antd";
import { DatePicker, Space } from "antd";

import customParseFormat from "dayjs/plugin/customParseFormat";
import "./DateRangePicker.css";
dayjs.extend(customParseFormat);
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

const dateFormat = "DD MMM YY";
const weekFormat = "MM/DD";
const monthFormat = "YYYY/MM";

/** Manually entering any of the following formats will perform date parsing */
const dateFormatList = ["DD/MM/YYYY", "DD/MM/YY", "DD-MM-YYYY", "DD-MM-YY"];

const customFormat: DatePickerProps["format"] = (value) =>
  `custom format: ${value.format(dateFormat)}`;

const customWeekStartEndFormat: DatePickerProps["format"] = (value) =>
  `${dayjs(value).startOf("week").format(weekFormat)} ~ ${dayjs(value)
    .endOf("week")
    .format(weekFormat)}`;
interface DateRangePickerProps {
  dateRange: [Dayjs, Dayjs];
  setDateRange: (range: [Dayjs, Dayjs]) => void;
}
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  setDateRange,
}) => {
  return (
    <Space direction='vertical' size={12}>
      <RangePicker
        className='custom-range-picker'
        value={dateRange}
        onChange={(values) => {
          if (values) {
            setDateRange(values as [Dayjs, Dayjs]);
          }
        }}
        format={dateFormat}
        placeholder={["Start", "End"]}
      />
    </Space>
  );
};
export default DateRangePicker;
