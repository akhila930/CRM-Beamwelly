'use client';

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  value?: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({ value, onSearchChange, placeholder = 'Search...' }: SearchBarProps) => {
  return (
    <div className="relative max-w-[300px] w-full">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 rounded-lg"
      />
    </div>
  );
};

export default SearchBar; 