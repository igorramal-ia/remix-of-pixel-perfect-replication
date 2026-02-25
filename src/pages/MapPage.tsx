import { MapPin } from "lucide-react";

const MapPage = () => (
  <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
    <div className="animate-fade-in">
      <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Mapa</h1>
      <p className="text-muted-foreground mt-1">Visualização geográfica do inventário</p>
    </div>
    <div className="bg-card rounded-xl border border-border shadow-card h-[calc(100vh-200px)] flex items-center justify-center animate-fade-in">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl gradient-brand flex items-center justify-center">
          <MapPin className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="font-display font-semibold text-foreground">Google Maps em breve</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          A integração com Google Maps será ativada após a configuração do backend com Lovable Cloud.
        </p>
      </div>
    </div>
  </div>
);

export default MapPage;
