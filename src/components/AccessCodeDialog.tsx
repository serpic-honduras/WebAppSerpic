
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { Mail, Lock, Clock } from 'lucide-react';
import { devError } from '@/utils/secureLogger';

interface AccessCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  projectName: string;
  action: 'view' | 'edit';
}

const AccessCodeDialog = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId, 
  projectName, 
  action 
}: AccessCodeDialogProps) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const { user } = useSecureAuth();
  const { toast } = useToast();

  const sendAccessCode = async () => {
    if (!user) return;

    setSendingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-access-code', {
        body: {
          projectId,
          action
        }
      });

      if (error) throw error;

      toast({
        title: "Código enviado",
        description: "Revisa tu email para obtener el código de acceso"
      });
    } catch (error) {
      devError('Error sending access code:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el código de acceso",
        variant: "destructive"
      });
    } finally {
      setSendingCode(false);
    }
  };

  const verifyAccessCode = async () => {
    if (!user || !accessCode.trim()) return;

    setLoading(true);
    try {
      // Check if the access code is valid and not expired
      const { data, error } = await supabase
        .from('project_access_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .eq('access_code', accessCode.trim())
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: "Código inválido",
          description: "El código ingresado es incorrecto o ha expirado",
          variant: "destructive"
        });
        return;
      }

      // Mark the code as used
      await supabase
        .from('project_access_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', data.id);

      toast({
        title: "Acceso concedido",
        description: `Ahora puedes ${action === 'edit' ? 'editar' : 'ver'} el proyecto`
      });

      onSuccess();
    } catch (error) {
      devError('Error verifying access code:', error);
      toast({
        title: "Error",
        description: "Error al verificar el código de acceso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAccessCode('');
    onClose();
  };

  const actionText = action === 'edit' ? 'editar' : 'ver';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-foreground">
            <Lock className="h-5 w-5 text-primary" />
            <span>Verificación de Seguridad</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Para {actionText} el proyecto "{projectName}", necesitas ingresar un código de acceso
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg border border-border">
            <div className="flex items-center space-x-2 text-primary mb-2">
              <Mail className="h-4 w-4" />
              <span className="font-medium">Paso 1: Solicitar código</span>
            </div>
            <p className="text-sm text-primary mb-3">
              Enviaremos un código de 6 dígitos a tu email: {user?.email}
            </p>
            <Button 
              onClick={sendAccessCode} 
              disabled={sendingCode}
              className="w-full"
              variant="outline"
            >
              {sendingCode ? 'Enviando...' : 'Enviar código a mi email'}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span className="font-medium">Paso 2: Ingresar código</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="access-code" className="text-muted-foreground">Código de acceso (6 dígitos)</Label>
              <Input
                id="access-code"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-lg font-mono tracking-wider border-border focus:border-ring focus:ring-ring"
                maxLength={6}
              />
            </div>
            
            <div className="flex items-center space-x-2 text-amber-600 text-sm">
              <Clock className="h-4 w-4" />
              <span>El código expira en 15 minutos</span>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1 border-border text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button 
              onClick={verifyAccessCode} 
              disabled={loading || accessCode.length !== 6}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? 'Verificando...' : 'Verificar código'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessCodeDialog;
