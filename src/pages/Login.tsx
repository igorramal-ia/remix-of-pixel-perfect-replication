import { useState } from "react";
import { MapPin, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left - Brand */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dark items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-brand flex items-center justify-center shadow-elevated">
            <MapPin className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-display font-bold text-primary-foreground">
            Digital Favela
          </h1>
          <p className="text-lg text-primary-foreground/70">
            Sistema de Gestão de Inventário OOH
          </p>
          <div className="pt-8 grid grid-cols-3 gap-4">
            {[
              { value: "847", label: "Pontos" },
              { value: "12", label: "Comunidades" },
              { value: "8", label: "Campanhas" },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-xl bg-primary-foreground/5 backdrop-blur-sm">
                <p className="text-2xl font-display font-bold text-primary-foreground">{stat.value}</p>
                <p className="text-xs text-primary-foreground/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">Digital Favela</h1>
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Entrar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse o sistema de gestão OOH
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg gradient-brand text-primary-foreground text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
            >
              Entrar
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Digital Favela © 2026 — Sistema de uso interno
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
