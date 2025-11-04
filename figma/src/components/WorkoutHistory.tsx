import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface Member {
  id: string;
  name: string;
}

interface ExerciseSet {
  weight: number;
  reps: number;
}

interface ParsedExercise {
  name: string;
  sets: ExerciseSet[];
  originalText: string;
}

interface ParsedWorkout {
  specialNotes?: string;
  exercises: ParsedExercise[];
  comment?: string;
  stretching?: string;
}

interface Workout {
  memberId: string;
  date: string;
  workoutText: string;
  parsedData?: ParsedWorkout;
  createdAt: string;
}

export function WorkoutHistory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      fetchWorkouts();
    }
  }, [selectedMember]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-23d57c5c/members`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("회원 목록을 가져올 수 없습니다");
      }

      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchWorkouts = async () => {
    if (!selectedMember) return;

    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-23d57c5c/workouts/${selectedMember}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("운동일지를 가져올 수 없습니다");
      }

      const data = await response.json();
      setWorkouts(data.workouts || []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      alert("운동일지를 불러오는 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const hasWorkout = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayStr}`;
    return workouts.some((w) => w.date === dateStr);
  };

  const getWorkout = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayStr}`;
    return workouts.find((w) => w.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const days = getDaysInMonth(currentMonth);
  const selectedWorkout = selectedDate
    ? getWorkout(parseInt(selectedDate.split("-")[2]))
    : null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">운동일지 조회</h1>
        <p className="text-slate-600">회원의 운동 기록을 확인합니다</p>
      </div>

      <div className="mb-6">
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger className="max-w-xs bg-white">
            <SelectValue placeholder="회원을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMember && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-slate-900">
                {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
                <div
                  key={day}
                  className={`text-center text-sm py-2 ${
                    i === 0
                      ? "text-red-500"
                      : i === 6
                      ? "text-blue-500"
                      : "text-slate-600"
                  }`}
                >
                  {day}
                </div>
              ))}
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} />;
                }

                const year = currentMonth.getFullYear();
                const month = String(currentMonth.getMonth() + 1).padStart(
                  2,
                  "0"
                );
                const dayStr = String(day).padStart(2, "0");
                const dateStr = `${year}-${month}-${dayStr}`;
                const hasLog = hasWorkout(day);
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      if (hasLog) {
                        setSelectedDate(dateStr);
                      }
                    }}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center text-sm transition-all
                      ${
                        hasLog
                          ? isSelected
                            ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          : "text-slate-400 hover:bg-slate-50"
                      }
                    `}
                    disabled={!hasLog}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-4 h-4 bg-emerald-100 border border-emerald-200 rounded" />
                <span>운동일지 있음</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 max-h-[600px] overflow-y-auto">
            {selectedWorkout ? (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <CalendarIcon className="w-5 h-5 text-slate-500" />
                  <h3 className="text-slate-900">{selectedWorkout.date}</h3>
                </div>

                {selectedWorkout.parsedData ? (
                  <div className="space-y-4">
                    {selectedWorkout.parsedData.specialNotes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">☑️</span>
                          <div>
                            <h4 className="text-amber-900 mb-1">특이사항</h4>
                            <p className="text-amber-800 text-sm">
                              {selectedWorkout.parsedData.specialNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedWorkout.parsedData.exercises.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h4 className="text-slate-900 mb-3 flex items-center gap-2">
                          <span>📌</span>
                          오늘의 운동
                        </h4>
                        <div className="space-y-4">
                          {selectedWorkout.parsedData.exercises.map(
                            (exercise, index) => (
                              <div key={index} className="bg-white rounded-lg p-3 border border-slate-200">
                                <h5 className="text-slate-900 mb-2">
                                  {index + 1}. {exercise.name}
                                </h5>
                                {exercise.sets.length > 0 ? (
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                        <th className="py-2 px-3 rounded-tl-md text-center">
                                          세트
                                        </th>
                                        <th className="py-2 px-3 text-center">
                                          무게 (kg)
                                        </th>
                                        <th className="py-2 px-3 rounded-tr-md text-center">
                                          횟수 (회)
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {exercise.sets.map((set, setIndex) => (
                                        <tr
                                          key={setIndex}
                                          className="border-b border-slate-200 last:border-0"
                                        >
                                          <td className="py-2 px-3 text-center text-slate-700">
                                            {setIndex + 1}
                                          </td>
                                          <td className="py-2 px-3 text-center text-slate-700">
                                            {set.weight}
                                          </td>
                                          <td className="py-2 px-3 text-center text-slate-700">
                                            {set.reps}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="text-slate-500 text-sm">
                                    {exercise.originalText}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {selectedWorkout.parsedData.comment && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <h4 className="text-emerald-900 mb-2 flex items-center gap-2">
                          <span>💬</span>
                          코멘트
                        </h4>
                        <p className="text-emerald-800 text-sm whitespace-pre-wrap">
                          {selectedWorkout.parsedData.comment}
                        </p>
                      </div>
                    )}

                    {selectedWorkout.parsedData.stretching && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-blue-900 mb-2 flex items-center gap-2">
                          <span>📍</span>
                          링크
                        </h4>
                        <div className="text-blue-800 text-sm whitespace-pre-wrap space-y-1">
                          {selectedWorkout.parsedData.stretching
                            .split("\n")
                            .map((line, i) => {
                              if (line.startsWith("http")) {
                                return (
                                  <a
                                    key={i}
                                    href={line}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline block break-all"
                                  >
                                    {line}
                                  </a>
                                );
                              }
                              return <div key={i}>{line}</div>;
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // 파싱 데이터가 없는 경우 원본 텍스트 표시
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                      {selectedWorkout.workoutText}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>날짜를 선택하여 운동일지를 확인하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedMember && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-slate-500">회원을 선택해주세요</p>
        </div>
      )}

      {selectedMember && loading && (
        <div className="text-center py-12 text-slate-500">로딩 중...</div>
      )}
    </div>
  );
}
