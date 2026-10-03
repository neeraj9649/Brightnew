import React, { useState } from "react";
import Select from "react-select";
import './langusgeSelect.css'

const options = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Japanese", label: "Japanese" },
  { value: "Belarusian", label: "Belarusian" },
];

const LanguageSelector: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState(options[0]);

  return (
    <div className="top-one__language-sort">
      <Select
        classNamePrefix="custom-select"
        value={selectedOption}
        onChange={(option) => setSelectedOption(option!)}
        options={options}
        isSearchable={false}
        components={{
          IndicatorSeparator: () => null, // removes the separator
        }}
        
      />
    </div>
  );
};

export default LanguageSelector;
