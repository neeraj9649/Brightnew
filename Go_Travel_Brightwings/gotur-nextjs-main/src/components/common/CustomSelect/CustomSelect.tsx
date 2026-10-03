"use client";

import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import styles from "./CustomSelect.module.css"; // We'll create this CSS module

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
}

export default function CustomSelect({
  options,
  placeholder = "Select...",
  onChange,
}: CustomSelectProps) {
  const [selected, setSelected] = useState<Option | null>(null);

  const handleSelect = (value: string | null) => {
    const option = options.find((opt) => opt.value === value);
    if (option) {
      setSelected(option);
      onChange(option.value);
    }
  };

  return (
    <div className={`banner-form`}>
      <Dropdown onSelect={handleSelect}>
        <Dropdown.Toggle
          variant='light'
          id='dropdown-basic'
          className={styles.dropdownSelect}
        >
          {selected ? selected.label : placeholder}
        </Dropdown.Toggle>

        <Dropdown.Menu className='w-100'>
          {options.map((option) => (
            <Dropdown.Item
              key={option.value}
              eventKey={option.value}
              className={styles.dropdownOption}
            >
              {option.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
