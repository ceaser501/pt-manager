import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { MemberManagement } from "./components/MemberManagement";
import { WorkoutLog } from "./components/WorkoutLog";
import { WorkoutHistory } from "./components/WorkoutHistory";
import { AIAssistant } from "./components/AIAssistant";

export default function App() {
  const [currentTab, setCurrentTab] = useState("members");

  const renderContent = () => {
    switch (currentTab) {
      case "members":
        return <MemberManagement />;
      case "workout":
        return <WorkoutLog />;
      case "history":
        return <WorkoutHistory />;
      case "ai":
        return <AIAssistant />;
      default:
        return <MemberManagement />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="flex-1 overflow-auto">{renderContent()}</main>
    </div>
  );
}
