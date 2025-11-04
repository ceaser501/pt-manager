import { Users, Calendar, MessageSquare, Dumbbell } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: "members", label: "회원 관리", icon: Users },
    { id: "workout", label: "운동일지 작성", icon: Dumbbell },
    { id: "history", label: "운동일지 조회", icon: Calendar },
    { id: "ai", label: "AI 상담", icon: MessageSquare },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <div className="sidebar-title-main">PT Manager</div>
            <div className="sidebar-title-sub">이윤창 트레이너의</div>
            <div className="sidebar-title-sub">맞춤형 회원 관리 시스템</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="text-slate-400 text-xs text-center">
          © 2025 이윤창 트레이너의 PT Manager
        </div>
      </div>
    </div>
  );
}
