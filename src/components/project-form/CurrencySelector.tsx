
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CurrencySelectorProps {
  currency: 'USD' | 'HNL' | 'EUR';
  onCurrencyChange: (currency: 'USD' | 'HNL' | 'EUR') => void;
}

const CurrencySelector = ({ currency, onCurrencyChange }: CurrencySelectorProps) => {
  return (
    <div className="mb-4">
      <Label htmlFor="currency">Moneda del Proyecto</Label>
      <Select value={currency} onValueChange={onCurrencyChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="HNL">Lempiras (L)</SelectItem>
          <SelectItem value="USD">Dólares ($)</SelectItem>
          <SelectItem value="EUR">Euros (€)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CurrencySelector;
