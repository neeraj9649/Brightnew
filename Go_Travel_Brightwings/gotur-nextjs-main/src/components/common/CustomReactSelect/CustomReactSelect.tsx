import React from 'react';
import Select, { StylesConfig } from 'react-select';
import './custom-select.css';

interface OptionType {
  value: string;
  label: string;
}

interface CustomReactSelectProps {
  options: OptionType[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CustomReactSelect: React.FC<CustomReactSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
}) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const customStyles: StylesConfig<OptionType, false> = {
    control: (provided, state) => ({
      ...provided,
      height: '56px',
      backgroundColor: 'var(--gotur-white, #fff)',
      paddingLeft: '10px',
      paddingRight: '10px',
      fontFamily: 'var(--gotur-font, "Plus Jakarta Sans", sans-serif)',
      fontWeight: 500,
      fontSize: '14px',
      lineHeight: '171%',
      textTransform: 'capitalize',
      color: 'var(--gotur-text, #595959)',
      borderRadius: '8px',
      border: '1px solid var(--gotur-border-color, #e5e5e5)',
      boxShadow: state.isFocused ? '0 0 0 1px var(--gotur-border-color, #e5e5e5)' : 'none',
      '&:hover': {
        borderColor: 'var(--gotur-border-color, #e5e5e5)',
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 5,
    }),
    option: (provided, state) => ({
      ...provided,
      fontFamily: 'var(--gotur-font, "Plus Jakarta Sans", sans-serif)',
      fontWeight: 500,
      fontSize: '14px',
      textTransform: 'capitalize',
      color: state.isSelected || state.isFocused ? '#fff' : 'var(--gotur-text, #595959)',
      backgroundColor:
        state.isSelected || state.isFocused
          ? 'var(--gotur-base, #63AB45)'
          : 'transparent',
      '&:active': {
        backgroundColor: 'var(--gotur-base, #63AB45)',
        
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--gotur-text, #595959)',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'var(--gotur-black, #1d231f)',
      paddingRight: '10px',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
  };

  return (
    <div className="listing-from__control react-select-wrapper">
      <Select
        options={options}
        value={selectedOption}
        onChange={(opt) => onChange(opt?.value || '')}
        placeholder={placeholder}
        styles={customStyles}
        isSearchable
        isClearable={false}
      />
    </div>
  );
};

export default CustomReactSelect;
