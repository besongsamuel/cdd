import { Autocomplete, Chip, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { membersService } from "../../services/membersService";

interface PassionsAutocompleteProps {
  value: string[];
  onChange: (passions: string[]) => void;
  label?: string;
  placeholder?: string;
}

export const PassionsAutocomplete: React.FC<PassionsAutocompleteProps> = ({
  value,
  onChange,
  label = "Passions",
  placeholder = "Select or type passions (1-2 words each)",
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const members = await membersService.getAll();
        const allPassions = new Set<string>();
        members.forEach((member) => {
          if (member.passions) {
            member.passions.forEach((passion) => {
              if (passion && passion.trim()) {
                allPassions.add(passion.trim());
              }
            });
          }
        });
        setSuggestions(Array.from(allPassions).sort());
      } catch (error) {
        console.error("Error loading passions suggestions:", error);
      }
    };

    loadSuggestions();
  }, []);

  const validatePassion = (passion: string): boolean => {
    const trimmed = passion.trim();
    if (!trimmed) return false;
    // Check if it's 1-2 words
    const words = trimmed.split(/\s+/);
    return words.length >= 1 && words.length <= 2;
  };

  const handleChange = (_event: any, newValue: string[]) => {
    // Filter out invalid passions
    const validPassions = newValue.filter(validatePassion);
    onChange(validPassions);
  };

  const handleInputChange = (_event: any, newInputValue: string) => {
    setInputValue(newInputValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && inputValue.trim()) {
      event.preventDefault();
      const trimmed = inputValue.trim();
      if (validatePassion(trimmed) && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
        setInputValue("");
      }
    }
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      options={suggestions}
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={option}
            {...getTagProps({ index })}
            key={option}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText="Press Enter to add a passion (1-2 words)"
        />
      )}
      filterOptions={(options, params) => {
        const filtered = options.filter((option) =>
          option.toLowerCase().includes(params.inputValue.toLowerCase())
        );

        // Add custom input if it's valid and not already in the list
        if (params.inputValue !== "") {
          const trimmed = params.inputValue.trim();
          if (
            validatePassion(trimmed) &&
            !filtered.includes(trimmed) &&
            !value.includes(trimmed)
          ) {
            filtered.push(trimmed);
          }
        }

        return filtered;
      }}
    />
  );
};




