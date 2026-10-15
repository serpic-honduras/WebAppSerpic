
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const AuthPage = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const { signIn } = useSecureAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);

      if (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor verifica tu email antes de iniciar sesión';
        }

        toast({
          title: "Error de inicio de sesión",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión exitosamente"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Algo salió mal. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-serpic-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/logo-transparent.png" 
            alt="SERPIC Logo" 
            className="h-16 w-auto mx-auto mb-4" 
          />
          <p className="text-muted-foreground">Sistema de Control y Seguimiento de Proyectos</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="text-center bg-card">
            <CardTitle className="text-foreground">Iniciar Sesión</CardTitle>
          </CardHeader>

          <CardContent className="bg-card">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-muted-foreground">Email</Label>
                <Input 
                  id="login-email" 
                  type="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  required 
                  placeholder="tu@email.com" 
                  className="border-border focus:border-ring focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Input 
                    id="login-password" 
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    required 
                    placeholder="••••••••" 
                    className="pr-10 border-border focus:border-ring focus:ring-ring"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
