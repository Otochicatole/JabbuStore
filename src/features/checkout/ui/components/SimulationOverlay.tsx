import React from 'react';
import { Loader2 } from 'lucide-react';

interface SimulationOverlayProps {
  selectedMethodName: string;
  simulationStep: number;
}

export function SimulationOverlay({ selectedMethodName, simulationStep }: SimulationOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="bg-[#0c0a15] border border-white/5 p-10 rounded-3xl max-w-md w-full mx-6 text-center shadow-2xl relative overflow-hidden">
        
        {/* Background glowing sphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-accent/5 filter blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          
          <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />

          <h3 className="text-lg font-black uppercase tracking-wider text-white">Simulador de Transacción</h3>
          
          {/* Progress Steps */}
          <div className="space-y-4 text-left max-w-xs mx-auto text-xs">
            <div className={`flex items-center gap-3 transition-colors ${simulationStep >= 1 ? 'text-white' : 'text-white/20'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${simulationStep > 1 ? 'bg-emerald-400' : simulationStep === 1 ? 'bg-accent animate-pulse' : 'bg-white/10'}`} />
              <span className="font-bold uppercase tracking-wider">Conectando con {selectedMethodName}...</span>
            </div>
            
            <div className={`flex items-center gap-3 transition-colors ${simulationStep >= 2 ? 'text-white' : 'text-white/20'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${simulationStep > 2 ? 'bg-emerald-400' : simulationStep === 2 ? 'bg-accent animate-pulse' : 'bg-white/10'}`} />
              <span className="font-bold uppercase tracking-wider">Validando stock, precios y destinatario...</span>
            </div>

            <div className={`flex items-center gap-3 transition-colors ${simulationStep >= 3 ? 'text-white' : 'text-white/20'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${simulationStep > 3 ? 'bg-emerald-400' : simulationStep === 3 ? 'bg-accent animate-pulse' : 'bg-white/10'}`} />
              <span className="font-bold uppercase tracking-wider">Completando firma y persistiendo orden...</span>
            </div>
          </div>

          <p className="text-[10px] text-[#84849b] font-bold uppercase tracking-widest leading-relaxed">
            Por favor no cierres esta pestaña. <br /> Simulador Sandbox en progreso.
          </p>
        </div>

      </div>
    </div>
  );
}
export default SimulationOverlay;
