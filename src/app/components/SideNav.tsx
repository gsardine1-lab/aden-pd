import {
  BarChart2,
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Home,
  Layers,
  LineChart,
  Settings,
  TrendingUp,
} from 'lucide-react';

interface SideNavProps {
  wireframe?: boolean;
}

const navItems = [
  { icon: Home, label: '首页', active: false },
  { icon: LineChart, label: '行情', active: false },
  { icon: BookOpen, label: '询价', active: false },
  { icon: Layers, label: '订单', active: false },
  { icon: BarChart2, label: '持仓', active: true },
  { icon: TrendingUp, label: '洞察', active: false },
  { icon: Calendar, label: '日历', active: false },
  { icon: Bell, label: '提醒', active: false },
  { icon: Settings, label: '设置', active: false },
];

export function SideNav({ wireframe = false }: SideNavProps) {
  if (wireframe) {
    return (
      <aside className="w-[60px] flex-shrink-0 bg-[#F0F0F0] border-r border-[#CCCCCC] flex flex-col items-center pt-4 gap-1">
        <div className="w-8 h-8 rounded bg-[#CCCCCC] mb-4" />
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`w-full flex flex-col items-center py-3 gap-1 cursor-pointer ${
              item.active
                ? 'bg-[#E0E0E0] border-r-2 border-[#666666]'
                : 'hover:bg-[#E8E8E8]'
            }`}
          >
            <div className={`w-5 h-5 rounded-sm ${item.active ? 'bg-[#666666]' : 'bg-[#AAAAAA]'}`} />
            <span className="text-[9px] text-[#888888]">{item.label}</span>
          </div>
        ))}
      </aside>
    );
  }

  return (
    <aside className="w-[64px] flex-shrink-0 bg-[#001529] flex flex-col items-center pt-4 gap-0.5">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1677FF] to-[#0050B3] flex items-center justify-center mb-4 shadow-lg">
        <ChevronRight className="text-white" size={18} />
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`w-full flex flex-col items-center py-2.5 gap-0.5 cursor-pointer transition-colors relative ${
              item.active
                ? 'bg-[#1677FF]/20 text-[#1677FF]'
                : 'text-[#8C9BAB] hover:text-white hover:bg-white/5'
            }`}
          >
            {item.active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#1677FF] rounded-r" />
            )}
            <Icon size={18} strokeWidth={item.active ? 2.5 : 1.8} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </div>
        );
      })}
    </aside>
  );
}
