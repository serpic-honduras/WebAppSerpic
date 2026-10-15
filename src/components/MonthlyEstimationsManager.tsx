import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calculator } from "lucide-react";
import { MonthlyEstimation } from "@/types/monthlyEstimation";
import { formatNumber } from "@/utils/currencyUtils";

interface MonthlyEstimationsManagerProps {
  estimations: MonthlyEstimation[];
  onEstimationsChange: (estimations: MonthlyEstimation[]) => void;
}

const MonthlyEstimationsManager = ({ estimations, onEstimationsChange }: MonthlyEstimationsManagerProps) => {
  const [localEstimations, setLocalEstimations] = useState<MonthlyEstimation[]>(estimations);

  useEffect(() => {
    setLocalEstimations(estimations);
  }, [estimations]);

  const addEstimation = () => {
    const newEstimation: MonthlyEstimation = {
      month: '',
      montoBruto: 0,
      devolucionAnticipo: 0,
      retencionCalidad: 0,
      otrasDeduciones: 0,
      totalNetoRecibido: 0,
      status: 'En Conciliación'
    };
    
    const updatedEstimations = [...localEstimations, newEstimation];
    setLocalEstimations(updatedEstimations);
    onEstimationsChange(updatedEstimations);
  };

  const removeEstimation = (index: number) => {
    const updatedEstimations = localEstimations.filter((_, i) => i !== index);
    setLocalEstimations(updatedEstimations);
    onEstimationsChange(updatedEstimations);
  };

  const updateEstimation = (index: number, field: keyof MonthlyEstimation, value: string | number) => {
    const updatedEstimations = localEstimations.map((estimation, i) => {
      if (i === index) {
        const updatedEstimation = { ...estimation, [field]: value };
        
        // Auto-calculate total neto recibido
        if (field !== 'totalNetoRecibido' && field !== 'month' && field !== 'status') {
          const montoBruto = field === 'montoBruto' ? Number(value) : updatedEstimation.montoBruto;
          const devolucionAnticipo = field === 'devolucionAnticipo' ? Number(value) : updatedEstimation.devolucionAnticipo;
          const retencionCalidad = field === 'retencionCalidad' ? Number(value) : updatedEstimation.retencionCalidad;
          const otrasDeduciones = field === 'otrasDeduciones' ? Number(value) : updatedEstimation.otrasDeduciones;
          
          updatedEstimation.totalNetoRecibido = montoBruto - devolucionAnticipo - retencionCalidad - otrasDeduciones;
        }
        
        return updatedEstimation;
      }
      return estimation;
    });
    
    setLocalEstimations(updatedEstimations);
    onEstimationsChange(updatedEstimations);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En Conciliación':
        return 'bg-yellow-100 text-yellow-800';
      case 'En Revisión':
        return 'bg-blue-100 text-blue-800';
      case 'En Subsanación':
        return 'bg-orange-100 text-orange-800';
      case 'Aprobada':
        return 'bg-green-100 text-green-800';
      case 'Pagada':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getTotalMontoBruto = () => {
    return localEstimations.reduce((sum, estimation) => sum + estimation.montoBruto, 0);
  };

  const getTotalDevolucionAnticipo = () => {
    return localEstimations.reduce((sum, estimation) => sum + estimation.devolucionAnticipo, 0);
  };

  const getTotalRetencionCalidad = () => {
    return localEstimations.reduce((sum, estimation) => sum + estimation.retencionCalidad, 0);
  };

  const getTotalOtrasDeduciones = () => {
    return localEstimations.reduce((sum, estimation) => sum + estimation.otrasDeduciones, 0);
  };

  const getTotalNetoRecibido = () => {
    return localEstimations.reduce((sum, estimation) => sum + estimation.totalNetoRecibido, 0);
  };

  const formatCurrency = (amount: number) => {
    return formatNumber(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Estimaciones de Obra (Mensual)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {localEstimations.map((estimation, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="font-medium">Estimación #{index + 1}</h4>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(estimation.status)}`}>
                  {estimation.status}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeEstimation(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`month-${index}`}>Periodo</Label>
                <Input
                  id={`month-${index}`}
                  type="month"
                  value={estimation.month}
                  onChange={(e) => updateEstimation(index, 'month', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor={`status-${index}`}>Estado</Label>
                <Select 
                  value={estimation.status} 
                  onValueChange={(value) => updateEstimation(index, 'status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En Conciliación">En Conciliación</SelectItem>
                    <SelectItem value="En Revisión">En Revisión</SelectItem>
                    <SelectItem value="En Subsanación">En Subsanación</SelectItem>
                    <SelectItem value="Aprobada">Aprobada</SelectItem>
                    <SelectItem value="Pagada">Pagada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor={`monto-bruto-${index}`}>Monto Bruto (L)</Label>
                <Input
                  id={`monto-bruto-${index}`}
                  type="number"
                  step="0.01"
                  value={estimation.montoBruto}
                  onChange={(e) => updateEstimation(index, 'montoBruto', Number(e.target.value))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor={`devolucion-anticipo-${index}`}>Devolución de Anticipo (L)</Label>
                <Input
                  id={`devolucion-anticipo-${index}`}
                  type="number"
                  step="0.01"
                  value={estimation.devolucionAnticipo}
                  onChange={(e) => updateEstimation(index, 'devolucionAnticipo', Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor={`retencion-calidad-${index}`}>Retención de Calidad (L)</Label>
                <Input
                  id={`retencion-calidad-${index}`}
                  type="number"
                  step="0.01"
                  value={estimation.retencionCalidad}
                  onChange={(e) => updateEstimation(index, 'retencionCalidad', Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor={`otras-deducciones-${index}`}>Otras Deducciones (L)</Label>
                <Input
                  id={`otras-deducciones-${index}`}
                  type="number"
                  step="0.01"
                  value={estimation.otrasDeduciones}
                  onChange={(e) => updateEstimation(index, 'otrasDeduciones', Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor={`total-neto-${index}`}>Total Neto Recibido (L)</Label>
                <Input
                  id={`total-neto-${index}`}
                  type="text"
                  value={formatNumber(estimation.totalNetoRecibido)}
                  className="bg-muted font-medium"
                  readOnly
                />
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={addEstimation}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Estimación Mensual
          </Button>
          
          {localEstimations.length > 0 && (
            <div className="space-y-4">
              {/* Individual Totals */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-foreground mb-3">Totales por Categoría</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <div className="text-sm font-medium text-green-800">Total Monto Bruto</div>
                    <div className="text-lg font-bold text-green-900">
                      L {formatCurrency(getTotalMontoBruto())}
                    </div>
                  </div>
                  
                  <div className="bg-red-100 p-3 rounded-lg">
                    <div className="text-sm font-medium text-red-800">Total Devolución Anticipo</div>
                    <div className="text-lg font-bold text-red-900">
                      L {formatCurrency(getTotalDevolucionAnticipo())}
                    </div>
                  </div>
                  
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <div className="text-sm font-medium text-orange-800">Total Retención Calidad</div>
                    <div className="text-lg font-bold text-orange-900">
                      L {formatCurrency(getTotalRetencionCalidad())}
                    </div>
                  </div>
                  
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <div className="text-sm font-medium text-purple-800">Total Otras Deducciones</div>
                    <div className="text-lg font-bold text-purple-900">
                      L {formatCurrency(getTotalOtrasDeduciones())}
                    </div>
                  </div>
                  
                  <div className="bg-blue-100 p-3 rounded-lg md:col-span-2">
                    <div className="text-sm font-medium text-blue-800">Total Neto Recibido</div>
                    <div className="text-xl font-bold text-blue-900">
                      L {formatCurrency(getTotalNetoRecibido())}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyEstimationsManager;
