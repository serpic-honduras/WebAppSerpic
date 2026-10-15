
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, FileText, Edit } from "lucide-react";
import { Addendum, ChangeOrder } from "@/types/project";

interface AddendumChangeOrderManagerProps {
  addendums: Addendum[];
  changeOrders: ChangeOrder[];
  onAddendumsChange: (addendums: Addendum[]) => void;
  onChangeOrdersChange: (changeOrders: ChangeOrder[]) => void;
  currency: 'USD' | 'HNL' | 'EUR';
}

const AddendumChangeOrderManager = ({ 
  addendums, 
  changeOrders, 
  onAddendumsChange, 
  onChangeOrdersChange,
  currency 
}: AddendumChangeOrderManagerProps) => {
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'HNL': return 'L';
      default: return '$';
    }
  };

  const addAddendum = () => {
    const newAddendum: Addendum = {
      id: `addendum-${Date.now()}`,
      title: '',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'Draft'
    };
    onAddendumsChange([...addendums, newAddendum]);
  };

  const removeAddendum = (id: string) => {
    onAddendumsChange(addendums.filter(item => item.id !== id));
  };

  const updateAddendum = (id: string, field: keyof Addendum, value: any) => {
    onAddendumsChange(addendums.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addChangeOrder = () => {
    const newChangeOrder: ChangeOrder = {
      id: `change-order-${Date.now()}`,
      title: '',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'Draft'
    };
    onChangeOrdersChange([...changeOrders, newChangeOrder]);
  };

  const removeChangeOrder = (id: string) => {
    onChangeOrdersChange(changeOrders.filter(item => item.id !== id));
  };

  const updateChangeOrder = (id: string, field: keyof ChangeOrder, value: any) => {
    onChangeOrdersChange(changeOrders.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Adendas y Órdenes de Cambio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="addendums" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="addendums">Adendas al Contrato</TabsTrigger>
            <TabsTrigger value="changeOrders">Órdenes de Cambio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="addendums" className="space-y-4">
            {addendums.map((addendum, index) => (
              <div key={addendum.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Adenda #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAddendum(addendum.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`addendum-title-${index}`}>Título</Label>
                    <Input
                      id={`addendum-title-${index}`}
                      value={addendum.title}
                      onChange={(e) => updateAddendum(addendum.id, 'title', e.target.value)}
                      placeholder="Título de la adenda"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`addendum-date-${index}`}>Fecha</Label>
                    <Input
                      id={`addendum-date-${index}`}
                      type="date"
                      value={addendum.date}
                      onChange={(e) => updateAddendum(addendum.id, 'date', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`addendum-amount-${index}`}>Monto ({getCurrencySymbol(currency)})</Label>
                    <Input
                      id={`addendum-amount-${index}`}
                      type="number"
                      step="0.01"
                      value={addendum.amount || 0}
                      onChange={(e) => updateAddendum(addendum.id, 'amount', Number(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`addendum-status-${index}`}>Estado</Label>
                    <Select 
                      value={addendum.status} 
                      onValueChange={(value) => updateAddendum(addendum.id, 'status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Borrador</SelectItem>
                        <SelectItem value="Pending">Pendiente</SelectItem>
                        <SelectItem value="Approved">Aprobado</SelectItem>
                        <SelectItem value="Rejected">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor={`addendum-description-${index}`}>Descripción</Label>
                    <Textarea
                      id={`addendum-description-${index}`}
                      value={addendum.description}
                      onChange={(e) => updateAddendum(addendum.id, 'description', e.target.value)}
                      placeholder="Descripción detallada de la adenda"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addAddendum}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Adenda
            </Button>
          </TabsContent>
          
          <TabsContent value="changeOrders" className="space-y-4">
            {changeOrders.map((changeOrder, index) => (
              <div key={changeOrder.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Orden de Cambio #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeChangeOrder(changeOrder.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`change-order-title-${index}`}>Título</Label>
                    <Input
                      id={`change-order-title-${index}`}
                      value={changeOrder.title}
                      onChange={(e) => updateChangeOrder(changeOrder.id, 'title', e.target.value)}
                      placeholder="Título de la orden de cambio"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`change-order-date-${index}`}>Fecha</Label>
                    <Input
                      id={`change-order-date-${index}`}
                      type="date"
                      value={changeOrder.date}
                      onChange={(e) => updateChangeOrder(changeOrder.id, 'date', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`change-order-amount-${index}`}>Monto ({getCurrencySymbol(currency)})</Label>
                    <Input
                      id={`change-order-amount-${index}`}
                      type="number"
                      step="0.01"
                      value={changeOrder.amount}
                      onChange={(e) => updateChangeOrder(changeOrder.id, 'amount', Number(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`change-order-status-${index}`}>Estado</Label>
                    <Select 
                      value={changeOrder.status} 
                      onValueChange={(value) => updateChangeOrder(changeOrder.id, 'status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Borrador</SelectItem>
                        <SelectItem value="Pending">Pendiente</SelectItem>
                        <SelectItem value="Approved">Aprobado</SelectItem>
                        <SelectItem value="Rejected">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor={`change-order-description-${index}`}>Descripción</Label>
                    <Textarea
                      id={`change-order-description-${index}`}
                      value={changeOrder.description}
                      onChange={(e) => updateChangeOrder(changeOrder.id, 'description', e.target.value)}
                      placeholder="Descripción detallada de la orden de cambio"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addChangeOrder}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Orden de Cambio
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AddendumChangeOrderManager;
