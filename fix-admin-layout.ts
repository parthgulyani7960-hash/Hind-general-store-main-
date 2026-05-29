import * as fs from 'fs';
let content = fs.readFileSync('src/components/admin/AdminDashboardLayout.tsx', 'utf8');

const importStatements = `import React, { useState, useEffect } from 'react';
import { Menu, Activity } from 'lucide-react';
import { fetchWithHandling } from '../../lib/api';
import { getAuthHeaders } from '../../lib/utils';`;

content = content.replace(/import React from 'react';\nimport { Menu } from 'lucide-react';/s, importStatements);

const widgetCode = `
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'critical' | 'offline'>('offline');
  
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const data = await fetchWithHandling<any>('/api/admin/health-indicator', { headers: getAuthHeaders() });
        if (mounted && data) {
          setHealthStatus(data.status || 'offline');
        }
      } catch (err) {
        if (mounted) setHealthStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const healthColors = {
    healthy: 'bg-emerald-50 border-emerald-100 text-emerald-700 marker:bg-emerald-500',
    warning: 'bg-amber-50 border-amber-100 text-amber-700 marker:bg-amber-500',
    critical: 'bg-red-50 border-red-100 text-red-700 marker:bg-red-500',
    offline: 'bg-stone-50 border-stone-100 text-stone-500 marker:bg-stone-500',
  };
  const healthColorStr = healthColors[healthStatus];
`;

content = content.replace(/export default function AdminDashboardLayout\(\{[^}]*\}\: AdminDashboardLayoutProps\) \{/, `export default function AdminDashboardLayout({ 
  children, activeTab, setActiveTab, user, logout, adminTheme, 
  sidebarOpen, setSidebarOpen, getDisplayLabel, stats, extraHeader
}: AdminDashboardLayoutProps) {
${widgetCode}`);

const widgetJSX = `
          <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
            {extraHeader}
            <div className={\`flex items-center space-x-2 px-3 py-1.5 md:py-2 rounded-2xl border shadow-sm \${healthColorStr}\`}>
              <Activity size={12} className="hidden sm:block" />
              <div className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                <span className={\`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 marker:bg-current bg-current\`}></span>
                <span className={\`relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 marker:bg-current bg-current\`}></span>
              </div>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                {healthStatus}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3 bg-emerald-50 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-emerald-100 shadow-sm shrink-0">
              <div className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[9px] md:text-[10px] font-black text-emerald-700 uppercase tracking-widest whitespace-nowrap">
                {stats?.activeUsers || 0} Online
              </span>
            </div>
          </div>
`;

content = content.replace(/<div className="flex-1 flex justify-center px-4 max-w-2xl mx-auto">.*?<\/header>/s, widgetJSX + '\n        </header>');

fs.writeFileSync('src/components/admin/AdminDashboardLayout.tsx', content);
console.log('Fixed AdminDashboardLayout');
