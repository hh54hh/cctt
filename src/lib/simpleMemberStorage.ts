import { Member, Course, DietPlan } from "./types";
import { supabase } from "./supabase";

// Simple, reliable member storage without complex dependencies
export async function saveSimpleMember(member: Member): Promise<void> {
  try {
    console.log("💾 Simple save for member:", member.name);

    // 1. Prepare member data for Supabase (direct approach)
    const memberForSupabase = {
      id: member.id,
      name: member.name,
      phone: member.phone || "",
      age: member.age,
      height: member.height,
      weight: member.weight,
      gender: member.gender,
      subscription_start:
        member.subscriptionStart?.toISOString() || new Date().toISOString(),
      subscription_end:
        member.subscriptionEnd?.toISOString() || new Date().toISOString(),
      created_at: member.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Store course and diet plan data as simple JSON
      course_groups: JSON.stringify(member.courseGroups || []),
      diet_plan_groups: JSON.stringify(member.dietPlanGroups || []),
      courses: "{}", // Clear legacy fields
      diet_plans: "{}", // Clear legacy fields
    };

    // 2. Save directly to Supabase
    const { error } = await supabase.from("members").upsert(memberForSupabase, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error("❌ Supabase save error:", error);
      throw error;
    }

    console.log("✅ Member saved successfully to Supabase");
  } catch (error) {
    console.error("❌ Error in saveSimpleMember:", error);
    throw error;
  }
}

// Simple member loading
export async function getSimpleMembers(): Promise<Member[]> {
  try {
    console.log("📋 Loading members (simple)");

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error loading members:", error);
      return [];
    }

    // Convert back to Member objects
    const members: Member[] = (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone || "",
      age: item.age,
      height: item.height,
      weight: item.weight,
      gender: item.gender,
      subscriptionStart: new Date(item.subscription_start),
      subscriptionEnd: new Date(item.subscription_end),
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      courses: [], // Legacy field
      dietPlans: [], // Legacy field
      courseGroups: parseJSON(item.course_groups, []),
      dietPlanGroups: parseJSON(item.diet_plan_groups, []),
    }));

    console.log("✅ Loaded members:", members.length);
    return members;
  } catch (error) {
    console.error("❌ Error in getSimpleMembers:", error);
    return [];
  }
}

// Simple member by ID
export async function getSimpleMemberById(id: string): Promise<Member | null> {
  try {
    console.log("🔍 Loading member by ID (simple):", id);

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Error loading member by ID:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Convert back to Member object
    const member: Member = {
      id: data.id,
      name: data.name,
      phone: data.phone || "",
      age: data.age,
      height: data.height,
      weight: data.weight,
      gender: data.gender,
      subscriptionStart: new Date(data.subscription_start),
      subscriptionEnd: new Date(data.subscription_end),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      courses: [], // Legacy field
      dietPlans: [], // Legacy field
      courseGroups: parseJSON(data.course_groups, []),
      dietPlanGroups: parseJSON(data.diet_plan_groups, []),
    };

    console.log("✅ Loaded member:", member.name);
    return member;
  } catch (error) {
    console.error("❌ Error in getSimpleMemberById:", error);
    return null;
  }
}

// Helper function to safely parse JSON
function parseJSON(jsonString: string, defaultValue: any = null) {
  try {
    if (
      !jsonString ||
      jsonString === "null" ||
      jsonString === "{}" ||
      jsonString === "[]"
    ) {
      return defaultValue;
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn("⚠️ JSON parse error:", error);
    return defaultValue;
  }
}

// Emergency function to clear all problematic processes
export function emergencyStop() {
  console.log("🚨 EMERGENCY STOP - Clearing all intervals and timeouts");

  // Clear all intervals and timeouts
  for (let i = 1; i < 1000; i++) {
    try {
      clearInterval(i);
      clearTimeout(i);
    } catch (e) {
      // Ignore errors
    }
  }

  // Force garbage collection if available
  if ((window as any).gc) {
    (window as any).gc();
  }

  console.log("✅ Emergency stop completed");
}

// Test if Supabase connection works
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    console.log("🔌 Testing Supabase connection...");

    const { error } = await supabase.from("members").select("id").limit(1);

    if (error) {
      console.error("❌ Supabase connection test failed:", error);
      return false;
    }

    console.log("✅ Supabase connection working");
    return true;
  } catch (error) {
    console.error("❌ Supabase connection test error:", error);
    return false;
  }
}
