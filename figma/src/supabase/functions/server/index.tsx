import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", cors());
app.use("*", logger(console.log));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// 회원 등록
app.post("/make-server-23d57c5c/members", async (c) => {
  try {
    const body = await c.req.json();
    const { name, age, gender, phone, goal, notes } = body;
    
    if (!name) {
      return c.json({ error: "이름은 필수입니다" }, 400);
    }

    const id = crypto.randomUUID();
    const member = {
      id,
      name,
      age: age || null,
      gender: gender || null,
      phone: phone || null,
      goal: goal || null,
      notes: notes || null,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`member:${id}`, member);
    
    console.log(`Member created: ${id}`);
    return c.json({ member });
  } catch (error) {
    console.log(`Error creating member: ${error}`);
    return c.json({ error: "회원 등록 중 오류가 발생했습니다" }, 500);
  }
});

// 회원 목록 조회
app.get("/make-server-23d57c5c/members", async (c) => {
  try {
    const members = await kv.getByPrefix("member:");
    const sortedMembers = members.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return c.json({ members: sortedMembers });
  } catch (error) {
    console.log(`Error fetching members: ${error}`);
    return c.json({ error: "회원 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// 회원 정보 조회
app.get("/make-server-23d57c5c/members/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const member = await kv.get(`member:${id}`);
    
    if (!member) {
      return c.json({ error: "회원을 찾을 수 없습니다" }, 404);
    }
    
    return c.json({ member });
  } catch (error) {
    console.log(`Error fetching member: ${error}`);
    return c.json({ error: "회원 정보 조회 중 오류가 발생했습니다" }, 500);
  }
});

// 회원 정보 수정
app.put("/make-server-23d57c5c/members/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingMember = await kv.get(`member:${id}`);
    if (!existingMember) {
      return c.json({ error: "회원을 찾을 수 없습니다" }, 404);
    }

    const updatedMember = {
      ...existingMember,
      ...body,
      id, // ID는 변경 불가
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`member:${id}`, updatedMember);
    
    console.log(`Member updated: ${id}`);
    return c.json({ member: updatedMember });
  } catch (error) {
    console.log(`Error updating member: ${error}`);
    return c.json({ error: "회원 정보 수정 중 오류가 발생했습니다" }, 500);
  }
});

// 회원 삭제
app.delete("/make-server-23d57c5c/members/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existingMember = await kv.get(`member:${id}`);
    if (!existingMember) {
      return c.json({ error: "회원을 찾을 수 없습니다" }, 404);
    }

    await kv.del(`member:${id}`);
    
    // 해당 회원의 모든 운동일지도 삭제
    const workouts = await kv.getByPrefix(`workout:${id}:`);
    for (const workout of workouts) {
      await kv.del(`workout:${id}:${workout.date}`);
    }
    
    console.log(`Member deleted: ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting member: ${error}`);
    return c.json({ error: "회원 삭제 중 오류가 발생했습니다" }, 500);
  }
});

// 운동일지 등록
app.post("/make-server-23d57c5c/workouts", async (c) => {
  try {
    const body = await c.req.json();
    const { memberId, date, workoutText, parsedData } = body;
    
    if (!memberId || !date) {
      return c.json({ error: "회원 ID와 날짜는 필수입니다" }, 400);
    }

    const member = await kv.get(`member:${memberId}`);
    if (!member) {
      return c.json({ error: "회원을 찾을 수 없습니다" }, 404);
    }

    const workout = {
      memberId,
      date,
      workoutText: workoutText || "",
      parsedData: parsedData || null,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`workout:${memberId}:${date}`, workout);
    
    console.log(`Workout created for member ${memberId} on ${date}`);
    return c.json({ workout });
  } catch (error) {
    console.log(`Error creating workout: ${error}`);
    return c.json({ error: "운동일지 등록 중 오류가 발생했습니다" }, 500);
  }
});

// 회원의 운동일지 목록 조회
app.get("/make-server-23d57c5c/workouts/:memberId", async (c) => {
  try {
    const memberId = c.req.param("memberId");
    const workouts = await kv.getByPrefix(`workout:${memberId}:`);
    
    const sortedWorkouts = workouts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return c.json({ workouts: sortedWorkouts });
  } catch (error) {
    console.log(`Error fetching workouts: ${error}`);
    return c.json({ error: "운동일지 조회 중 오류가 발생했습니다" }, 500);
  }
});

// 특정 날짜의 운동일지 조회
app.get("/make-server-23d57c5c/workouts/:memberId/:date", async (c) => {
  try {
    const memberId = c.req.param("memberId");
    const date = c.req.param("date");
    
    const workout = await kv.get(`workout:${memberId}:${date}`);
    
    if (!workout) {
      return c.json({ error: "운동일지를 찾을 수 없습니다" }, 404);
    }
    
    return c.json({ workout });
  } catch (error) {
    console.log(`Error fetching workout: ${error}`);
    return c.json({ error: "운동일지 조회 중 오류가 발생했습니다" }, 500);
  }
});

// 운동일지 수정
app.put("/make-server-23d57c5c/workouts/:memberId/:date", async (c) => {
  try {
    const memberId = c.req.param("memberId");
    const date = c.req.param("date");
    const body = await c.req.json();
    
    const existingWorkout = await kv.get(`workout:${memberId}:${date}`);
    if (!existingWorkout) {
      return c.json({ error: "운동일지를 찾을 수 없습니다" }, 404);
    }

    const updatedWorkout = {
      memberId,
      date,
      workoutText: body.workoutText || existingWorkout.workoutText,
      parsedData: body.parsedData || existingWorkout.parsedData,
      createdAt: existingWorkout.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`workout:${memberId}:${date}`, updatedWorkout);
    
    console.log(`Workout updated for member ${memberId} on ${date}`);
    return c.json({ workout: updatedWorkout });
  } catch (error) {
    console.log(`Error updating workout: ${error}`);
    return c.json({ error: "운동일지 수정 중 오류가 발생했습니다" }, 500);
  }
});

// 운동일지 삭제
app.delete("/make-server-23d57c5c/workouts/:memberId/:date", async (c) => {
  try {
    const memberId = c.req.param("memberId");
    const date = c.req.param("date");
    
    const existingWorkout = await kv.get(`workout:${memberId}:${date}`);
    if (!existingWorkout) {
      return c.json({ error: "운동일지를 찾을 수 없습니다" }, 404);
    }

    await kv.del(`workout:${memberId}:${date}`);
    
    console.log(`Workout deleted for member ${memberId} on ${date}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting workout: ${error}`);
    return c.json({ error: "운동일지 삭제 중 오류가 발생했습니다" }, 500);
  }
});

// AI 상담
app.post("/make-server-23d57c5c/ai-consult", async (c) => {
  try {
    const body = await c.req.json();
    const { memberId, message } = body;
    
    if (!memberId || !message) {
      return c.json({ error: "회원 ID와 메시지는 필수입니다" }, 400);
    }

    // 회원 정보 조회
    const member = await kv.get(`member:${memberId}`);
    if (!member) {
      return c.json({ error: "회원을 찾을 수 없습니다" }, 404);
    }

    // 운동일지 조회
    const workouts = await kv.getByPrefix(`workout:${memberId}:`);
    
    // AI API 호출 (OpenAI 예시)
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openAIKey) {
      return c.json({ 
        error: "AI 상담 기능을 사용하려면 OpenAI API 키가 필요합니다",
        response: "죄송합니다. 현재 AI 상담 기능이 설정되지 않았습니다. 관리자에게 문의해주세요."
      }, 500);
    }

    // 회원 정보와 운동일지를 기반으로 컨텍스트 생성
    const context = `
회원 정보:
- 이름: ${member.name}
- 나이: ${member.age || '정보 없음'}
- 성별: ${member.gender || '정보 없음'}
- 운동 목표: ${member.goal || '정보 없음'}
- 특이사항: ${member.notes || '없음'}

최근 운동일지 (최근 5개):
${workouts.slice(0, 5).map(w => `
날짜: ${w.date}
${w.workoutText || '운동 기록 없음'}
`).join('\n---\n')}
    `.trim();

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "당신은 전문 퍼스널 트레이너입니다. 회원의 정보와 운동일지를 바탕으로 친절하고 전문적인 상담을 제공합니다. 운동 조언, 식단 조언, 동기 부여 등을 제공하며, 항상 긍정적이고 격려하는 톤으로 대화합니다."
          },
          {
            role: "user",
            content: `${context}\n\n회원 질문: ${message}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.log(`OpenAI API error: ${errorText}`);
      return c.json({ 
        error: "AI 응답 생성 중 오류가 발생했습니다",
        response: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      }, 500);
    }

    const aiData = await openAIResponse.json();
    const aiResponse = aiData.choices[0]?.message?.content || "응답을 생성할 수 없습니다.";

    // 대화 내역 저장
    const chatId = `chat:${memberId}:${Date.now()}`;
    await kv.set(chatId, {
      memberId,
      timestamp: new Date().toISOString(),
      userMessage: message,
      aiResponse,
    });

    console.log(`AI consultation completed for member ${memberId}`);
    return c.json({ response: aiResponse });
  } catch (error) {
    console.log(`Error in AI consultation: ${error}`);
    return c.json({ 
      error: "AI 상담 중 오류가 발생했습니다",
      response: "죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    }, 500);
  }
});

// 회원의 상담 내역 조회
app.get("/make-server-23d57c5c/chats/:memberId", async (c) => {
  try {
    const memberId = c.req.param("memberId");
    const chats = await kv.getByPrefix(`chat:${memberId}:`);
    
    const sortedChats = chats.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return c.json({ chats: sortedChats });
  } catch (error) {
    console.log(`Error fetching chats: ${error}`);
    return c.json({ error: "상담 내역 조회 중 오류가 발생했습니다" }, 500);
  }
});

Deno.serve(app.fetch);
