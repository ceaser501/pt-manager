import { useState, useEffect } from "react";
import { Save, Eye, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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

export function WorkoutLog() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [workoutText, setWorkoutText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

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
      alert("회원 목록을 불러오는 중 오류가 발생했습니다");
    }
  };

  const parseExerciseLine = (line: string): ParsedExercise => {
    // 예: "1. 숄더 프레스 (15kg x 12회, 25kg x 12회, 35kg x 12회, 40kg x 12회) - 4세트"
    const exerciseName = line.replace(/^\d+\.\s*/, "").split("(")[0].trim();
    const sets: ExerciseSet[] = [];

    // 괄호 안의 내용 추출: (15kg x 12회, 25kg x 12회, ...)
    const match = line.match(/\((.*?)\)/);
    if (match) {
      const setsText = match[1];
      // 각 세트를 파싱: "15kg x 12회" 형태
      const setMatches = setsText.matchAll(/(\d+(?:\.\d+)?)\s*kg\s*x\s*(\d+)\s*회/g);

      for (const setMatch of setMatches) {
        sets.push({
          weight: parseFloat(setMatch[1]),
          reps: parseInt(setMatch[2]),
        });
      }
    }

    return {
      name: exerciseName,
      sets,
      originalText: line,
    };
  };

  const parseWorkoutText = (text: string): ParsedWorkout => {
    const lines = text.split("\n");
    const parsed: ParsedWorkout = {
      exercises: [],
    };

    let currentSection = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 특이사항
      if (trimmed.startsWith("☑️") || trimmed.startsWith("✅")) {
        parsed.specialNotes = trimmed.replace(/^[☑️✅]\s*/, "");
      }
      // 오늘의 운동 섹션
      else if (trimmed.includes("📌") && trimmed.includes("운동")) {
        currentSection = "exercises";
      }
      // 코멘트 섹션
      else if (trimmed.includes("💬") && trimmed.includes("코멘트")) {
        currentSection = "comment";
      }
      // 링크 섹션
      else if (trimmed.includes("📍") && trimmed.includes("링크")) {
        currentSection = "stretching";
      }
      // 운동 항목 (숫자로 시작)
      else if (currentSection === "exercises" && /^\d+\./.test(trimmed)) {
        parsed.exercises.push(parseExerciseLine(trimmed));
      }
      // 코멘트 내용
      else if (currentSection === "comment") {
        parsed.comment = parsed.comment
          ? `${parsed.comment}\n${trimmed}`
          : trimmed;
      }
      // 스��레칭 내용
      else if (currentSection === "stretching") {
        parsed.stretching = parsed.stretching
          ? `${parsed.stretching}\n${trimmed}`
          : trimmed;
      }
    }

    return parsed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMember) {
      alert("회원을 선택해주세요");
      return;
    }

    if (!date) {
      alert("날짜를 선택해주세요");
      return;
    }

    if (!workoutText.trim()) {
      alert("운동일지 내용을 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      const parsedData = parseWorkoutText(workoutText);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-23d57c5c/workouts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            memberId: selectedMember,
            date,
            workoutText,
            parsedData,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "운동일지를 저장할 수 없습니다");
      }

      alert("운동일지가 성공적으로 저장되었습니다");

      // 폼 초기화
      setWorkoutText("");
      setDate(new Date().toISOString().split("T")[0]);
      setShowPreview(false);
    } catch (error) {
      console.error("Error saving workout:", error);
      alert(
        error instanceof Error
          ? error.message
          : "운동일지를 저장하는 중 오류가 발생했습니다"
      );
    } finally {
      setLoading(false);
    }
  };

  const parsedData = workoutText ? parseWorkoutText(workoutText) : null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">운동일지 작성</h1>
        <p className="text-slate-600">
          카카오톡 메시지를 그대로 복사해서 붙여넣으세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 입력 영역 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="member">회원 선택 *</Label>
                  <Select
                    value={selectedMember}
                    onValueChange={setSelectedMember}
                  >
                    <SelectTrigger>
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

                <div>
                  <Label htmlFor="date">날짜 *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-slate-500" />
                <Label htmlFor="workoutText" className="mb-0">
                  운동일지 내용 *
                </Label>
              </div>
              <Textarea
                id="workoutText"
                value={workoutText}
                onChange={(e) => setWorkoutText(e.target.value)}
                placeholder="25년 10월 27일, 월요일

☑️ 아침에 일어나니, 팔꿈치 안쪽 불편감 발생

📌오늘의 운동
1. 숄더 프레스 (15kg x 12회, 25kg x 12회, 35kg x 12회, 40kg x 12회) - 4세트
2. 시티드 밀리터리 프레스 (30kg x 12회) - 4세트
3. 케이블 사레레 (5kg x 12회) - 4세트

💬 코멘트
어깨 힘이 많이 좋아지셨습니다.
어깨가 좋아지면 분명 다른 상체 부위들도 좋아지기 마련입니다.

📍 링크
누워서 하는 동작
https://youtube.com/shorts/9IZbGzT_mLc

서서하는 동작
https://youtube.com/shorts/w0zdj_Ey1-Y"
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 카카오톡 메시지를 그대로 복사해서 붙여넣으세요
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setWorkoutText("");
                  setDate(new Date().toISOString().split("T")[0]);
                  setShowPreview(false);
                }}
                disabled={loading}
              >
                초기화
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!workoutText.trim()}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? "미리보기 숨기기" : "미리보기"}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "저장 중..." : "운동일지 저장"}
              </Button>
            </div>
          </div>

          {/* 미리보기 영역 */}
          <div
            className={`${
              showPreview || parsedData ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6 sticky top-8">
              <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                미리보기
              </h3>

              {parsedData ? (
                <div className="space-y-4">
                  {parsedData.specialNotes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">☑️</span>
                        <div>
                          <h4 className="text-amber-900 mb-1">특이사항</h4>
                          <p className="text-amber-800 text-sm">
                            {parsedData.specialNotes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {parsedData.exercises.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="text-slate-900 mb-3 flex items-center gap-2">
                        <span>📌</span>
                        오늘의 운동
                      </h4>
                      <div className="space-y-4">
                        {parsedData.exercises.map((exercise, index) => (
                          <div key={index} className="bg-slate-50 rounded-lg p-3">
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
                                      className="border-b border-slate-200 last:border-0 bg-white"
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
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedData.comment && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <h4 className="text-emerald-900 mb-2 flex items-center gap-2">
                        <span>💬</span>
                        코멘트
                      </h4>
                      <p className="text-emerald-800 text-sm whitespace-pre-wrap">
                        {parsedData.comment}
                      </p>
                    </div>
                  )}

                  {parsedData.stretching && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-blue-900 mb-2 flex items-center gap-2">
                        <span>📍</span>
                        링크
                      </h4>
                      <div className="text-blue-800 text-sm whitespace-pre-wrap space-y-1">
                        {parsedData.stretching.split("\n").map((line, i) => {
                          if (line.startsWith("http")) {
                            return (
                              <a
                                key={i}
                                href={line}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline block"
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
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>운동일지 내용을 입력하면</p>
                  <p>미리보기가 표시됩니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
