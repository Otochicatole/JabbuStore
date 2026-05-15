"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";

export default function AdminBotsPage() {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBots = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/admin/marketplace/bots", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBots(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const createBot = async () => {
    const name = prompt("Nombre del Bot:");
    const steamId = prompt("SteamID64:");
    const tradeUrl = prompt("URL de Intercambio (opcional):");
    
    if (name && steamId) {
      await fetch("http://localhost:3001/api/admin/marketplace/bots", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}` 
        },
        body: JSON.stringify({ name, steamId, tradeUrl })
      });
      fetchBots();
    }
  };

  const deactivateBot = async (id: string) => {
    if (confirm("¿Seguro que quieres desactivar este bot?")) {
      await fetch(`http://localhost:3001/api/admin/marketplace/bots/${id}/deactivate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
      });
      fetchBots();
    }
  };

  return (
    <div className="p-8 bg-[#0b0818] min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black">Bots de Steam</h1>
        <button 
          onClick={createBot}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 transition-colors rounded text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Agregar Bot
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <motion.div 
              key={bot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-white/10 rounded-xl p-6 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {bot.name}
                    <span className={`w-2 h-2 rounded-full ${bot.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-1">ID: {bot.steamId}</p>
                </div>
                <button onClick={() => deactivateBot(bot.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className="uppercase font-bold text-accent">{bot.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacidad:</span>
                  <span>{bot.currentItems} / {bot.maxItems}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
