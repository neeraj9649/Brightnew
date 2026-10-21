import React, { useEffect, useState } from "react";
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
  // react-select renders a different aria-activedescendant on server vs client; render it client-side only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="top-one__language-sort">
      {mounted && (
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
      )}
    </div>
  );
};

export default LanguageSelector;
