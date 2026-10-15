
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, DollarSign, Info } from "lucide-react";
import { MonthlyExpense } from "@/types/project";
import { formatCurrency, getCurrentExchangeRates, formatNumber } from "@/utils/currencyUtils";

interface MonthlyExpensesManagerProps {
  expenses: MonthlyExpense[];
  onExpensesChange: (expenses: MonthlyExpense[]) => void;
  currency: 'USD' | 'HNL' | 'EUR';
}

const MonthlyExpensesManager = ({ expenses, onExpensesChange, currency }: MonthlyExpensesManagerProps) => {
  const [newExpense, setNewExpense] = useState<MonthlyExpense>({
    month: '',
    amount: 0,
    description: ''
  });

  const addExpense = () => {
    if (newExpense.month && newExpense.amount > 0) {
      const updatedExpenses = [...expenses, { ...newExpense, id: Date.now().toString() }];
      onExpensesChange(updatedExpenses);
      setNewExpense({ month: '', amount: 0, description: '' });
    }
  };

  const removeExpense = (index: number) => {
    const updatedExpenses = expenses.filter((_, i) => i !== index);
    onExpensesChange(updatedExpenses);
  };

  const updateExpense = (index: number, field: keyof MonthlyExpense, value: string | number) => {
    const updatedExpenses = expenses.map((expense, i) => 
      i === index ? { ...expense, [field]: value } : expense
    );
    onExpensesChange(updatedExpenses);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'USD': return '$';
      case 'HNL': return 'L';
      case 'EUR': return '€';
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(currency);
  const exchangeRates = getCurrentExchangeRates();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Desglose de Gastos Mensuales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exchange Rate Information */}
        <div className="bg-muted border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 text-sm">Tipos de Cambio Oficiales</h4>
              <p className="text-xs text-primary mt-1">Banco Central de Honduras - Actualizado: {exchangeRates.lastUpdated}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-card rounded p-3 border border-blue-100">
              <div className="font-medium text-blue-900">USD → HNL</div>
              <div className="text-lg font-bold text-primary">L {formatNumber(exchangeRates.usdToHnl)}</div>
              <div className="text-xs text-primary">1 Dólar = {formatNumber(exchangeRates.usdToHnl)} Lempiras</div>
            </div>
            <div className="bg-card rounded p-3 border border-blue-100">
              <div className="font-medium text-blue-900">EUR → HNL</div>
              <div className="text-lg font-bold text-primary">L {formatNumber(exchangeRates.eurToHnl)}</div>
              <div className="text-xs text-primary">1 Euro = {formatNumber(exchangeRates.eurToHnl)} Lempiras</div>
            </div>
          </div>
        </div>

        {/* Add new expense */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted rounded-lg">
          <div>
            <Label htmlFor="new-month">Mes</Label>
            <Input
              id="new-month"
              type="month"
              value={newExpense.month}
              onChange={(e) => setNewExpense({ ...newExpense, month: e.target.value })}
              placeholder={getCurrentMonth()}
            />
          </div>
          <div>
            <Label htmlFor="new-amount">Monto ({currencySymbol})</Label>
            <Input
              id="new-amount"
              type="number"
              value={newExpense.amount || ''}
              onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="new-description">Descripción (opcional)</Label>
            <Input
              id="new-description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="Descripción del gasto"
            />
          </div>
          <div className="flex items-end">
            <Button 
              type="button" 
              onClick={addExpense}
              className="w-full"
              disabled={!newExpense.month || newExpense.amount <= 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>

        {/* Expenses list */}
        {expenses.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm font-semibold text-muted-foreground px-2">
              <div>Mes</div>
              <div>Monto</div>
              <div>Descripción</div>
              <div>Acciones</div>
            </div>
            
            {expenses.map((expense, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-card border rounded-lg">
                <div>
                  <Input
                    type="month"
                    value={expense.month}
                    onChange={(e) => updateExpense(index, 'month', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    value={expense.amount}
                    onChange={(e) => updateExpense(index, 'amount', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Input
                    value={expense.description || ''}
                    onChange={(e) => updateExpense(index, 'description', e.target.value)}
                    placeholder="Descripción"
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeExpense(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        {expenses.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total de Gastos Mensuales:</span>
              <span className="text-primary">{formatCurrency(totalExpenses, currency)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyExpensesManager;
