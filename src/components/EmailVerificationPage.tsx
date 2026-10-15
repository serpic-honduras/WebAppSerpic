
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/hooks/useSecureAuth';

interface EmailVerificationPageProps {
  onVerificationComplete: () => void;
}

const EmailVerificationPage = ({ onVerificationComplete }: EmailVerificationPageProps) => {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useSecureAuth();

  // Use the authenticated user's email
  const userEmail = user?.email || '';

  useEffect(() => {
    // If user doesn't have an email, something is wrong with authentication
    if (!userEmail) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo obtener el email del usuario",
        variant: "destructive"
      });
    }
  }, [userEmail, toast]);

  const sendVerificationCode = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "Email de usuario no disponible",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-code', {
        body: { email: userEmail }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Código enviado",
        description: "Revisa tu email para el código de verificación"
      });
      setStep('verify');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al enviar el código",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast({
        title: "Error",
        description: "El código debe tener 6 dígitos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: { 
          email: userEmail,
          code: code.trim()
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        // Store verification status in sessionStorage
        sessionStorage.setItem('email_verified', 'true');
        sessionStorage.setItem('verified_email', userEmail);
        
        toast({
          title: "Verificación exitosa",
          description: "Email verificado correctamente"
        });
        onVerificationComplete();
      } else {
        throw new Error('Código inválido o expirado');
      }
    } catch (error: any) {
      toast({
        title: "Error de verificación",
        description: error.message || "Código inválido o expirado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    setCode('');
    sendVerificationCode();
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-serpic-gradient flex items-center justify-center p-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Error de Autenticación</CardTitle>
            <CardDescription>
              No se pudo obtener la información del usuario
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-serpic-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/logo-transparent.png" 
            alt="SERPIC Logo" 
            className="h-16 w-auto mx-auto mb-4" 
          />
          <h1 className="text-2xl font-bold text-foreground mb-2">Verificación de Seguridad</h1>
          <p className="text-muted-foreground">Acceso seguro al sistema SERPIC</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="text-center bg-card">
            <CardTitle className="text-foreground">
              {step === 'request' ? 'Verificación de Email' : 'Verificar Código'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 'request' 
                ? `Se enviará un código de verificación a: ${userEmail}`
                : 'Ingresa el código de 6 dígitos enviado a tu email'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-card">
            {step === 'request' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email registrado</Label>
                  <div className="p-3 bg-muted border border-border rounded-md text-sm text-muted-foreground">
                    {userEmail}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Solo se puede enviar el código al email registrado en tu cuenta
                  </p>
                </div>
                <Button 
                  onClick={sendVerificationCode} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-muted-foreground">Código de Verificación</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={code}
                      onChange={setCode}
                      maxLength={6}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Código enviado a: <strong>{userEmail}</strong>
                  </p>
                </div>
                <Button 
                  onClick={verifyCode} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                  disabled={loading || code.length !== 6}
                >
                  {loading ? 'Verificando...' : 'Verificar Código'}
                </Button>
                <div className="text-center space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={handleResendCode}
                    disabled={loading}
                    className="w-full border-border text-muted-foreground hover:bg-muted"
                  >
                    Reenviar Código
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setStep('request')}
                    disabled={loading}
                    className="w-full text-sm text-muted-foreground hover:bg-muted"
                  >
                    Volver
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
