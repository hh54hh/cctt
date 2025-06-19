import { supabase } from "./supabase";
import { Member, Course, DietPlan } from "./types";

export interface MemberCourse {
  id: string;
  member_id: string;
  course_id: string;
  course_name: string;
  assigned_date: string;
  created_at: string;
}

export interface MemberDietPlan {
  id: string;
  member_id: string;
  diet_plan_id: string;
  diet_plan_name: string;
  assigned_date: string;
  created_at: string;
}

export interface MemberWithRelationships extends Member {
  member_courses?: MemberCourse[];
  member_diet_plans?: MemberDietPlan[];
}

// Get member with all courses and diet plans
export async function getMemberWithRelationships(
  memberId: string,
): Promise<MemberWithRelationships | null> {
  try {
    console.log("🔍 Getting member with relationships:", memberId);

    // Get member basic info
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .single();

    if (memberError) {
      console.error("Error getting member:", memberError);
      return null;
    }

    if (!member) {
      console.log("Member not found:", memberId);
      return null;
    }

    // Get member courses
    const { data: memberCourses, error: coursesError } = await supabase
      .from("member_courses")
      .select("*")
      .eq("member_id", memberId)
      .order("assigned_date", { ascending: false });

    if (coursesError) {
      console.error("Error getting member courses:", coursesError);
    }

    // Get member diet plans
    const { data: memberDietPlans, error: dietPlansError } = await supabase
      .from("member_diet_plans")
      .select("*")
      .eq("member_id", memberId)
      .order("assigned_date", { ascending: false });

    if (dietPlansError) {
      console.error("Error getting member diet plans:", dietPlansError);
    }

    const result: MemberWithRelationships = {
      ...member,
      member_courses: memberCourses || [],
      member_diet_plans: memberDietPlans || [],
      // Convert relationship data back to arrays for compatibility
      courseGroups: (memberCourses || []).map((mc) => ({
        id: mc.course_id,
        name: mc.course_name,
      })),
      dietPlanGroups: (memberDietPlans || []).map((mdp) => ({
        id: mdp.diet_plan_id,
        name: mdp.diet_plan_name,
      })),
    };

    console.log("✅ Member with relationships loaded:", {
      memberId,
      coursesCount: memberCourses?.length || 0,
      dietPlansCount: memberDietPlans?.length || 0,
    });

    return result;
  } catch (error) {
    console.error("Error in getMemberWithRelationships:", error);
    return null;
  }
}

// Assign course to member
export async function assignCourseToMember(
  memberId: string,
  courseId: string,
  courseName: string,
): Promise<boolean> {
  try {
    console.log("📚 Assigning course to member:", {
      memberId,
      courseId,
      courseName,
    });

    const { error } = await supabase.from("member_courses").upsert(
      {
        member_id: memberId,
        course_id: courseId,
        course_name: courseName,
        assigned_date: new Date().toISOString(),
      },
      {
        onConflict: "member_id,course_id",
      },
    );

    if (error) {
      console.error("Error assigning course to member:", error);
      return false;
    }

    console.log("✅ Course assigned successfully");
    return true;
  } catch (error) {
    console.error("Error in assignCourseToMember:", error);
    return false;
  }
}

// Assign diet plan to member
export async function assignDietPlanToMember(
  memberId: string,
  dietPlanId: string,
  dietPlanName: string,
): Promise<boolean> {
  try {
    console.log("🥗 Assigning diet plan to member:", {
      memberId,
      dietPlanId,
      dietPlanName,
    });

    const { error } = await supabase.from("member_diet_plans").upsert(
      {
        member_id: memberId,
        diet_plan_id: dietPlanId,
        diet_plan_name: dietPlanName,
        assigned_date: new Date().toISOString(),
      },
      {
        onConflict: "member_id,diet_plan_id",
      },
    );

    if (error) {
      console.error("Error assigning diet plan to member:", error);
      return false;
    }

    console.log("✅ Diet plan assigned successfully");
    return true;
  } catch (error) {
    console.error("Error in assignDietPlanToMember:", error);
    return false;
  }
}

// Remove course from member
export async function removeCourseFromMember(
  memberId: string,
  courseId: string,
): Promise<boolean> {
  try {
    console.log("🗑️ Removing course from member:", { memberId, courseId });

    const { error } = await supabase
      .from("member_courses")
      .delete()
      .eq("member_id", memberId)
      .eq("course_id", courseId);

    if (error) {
      console.error("Error removing course from member:", error);
      return false;
    }

    console.log("✅ Course removed successfully");
    return true;
  } catch (error) {
    console.error("Error in removeCourseFromMember:", error);
    return false;
  }
}

// Remove diet plan from member
export async function removeDietPlanFromMember(
  memberId: string,
  dietPlanId: string,
): Promise<boolean> {
  try {
    console.log("🗑️ Removing diet plan from member:", { memberId, dietPlanId });

    const { error } = await supabase
      .from("member_diet_plans")
      .delete()
      .eq("member_id", memberId)
      .eq("diet_plan_id", dietPlanId);

    if (error) {
      console.error("Error removing diet plan from member:", error);
      return false;
    }

    console.log("✅ Diet plan removed successfully");
    return true;
  } catch (error) {
    console.error("Error in removeDietPlanFromMember:", error);
    return false;
  }
}

// Update member with courses and diet plans
export async function updateMemberWithRelationships(
  member: Member,
  courseIds: string[],
  dietPlanIds: string[],
): Promise<boolean> {
  try {
    console.log("🔄 Updating member with relationships:", {
      memberId: member.id,
      coursesCount: courseIds.length,
      dietPlansCount: dietPlanIds.length,
    });

    // Start transaction-like operations
    const promises: Promise<any>[] = [];

    // 1. Update member basic info
    promises.push(
      supabase
        .from("members")
        .update({
          name: member.name,
          phone: member.phone,
          age: member.age,
          height: member.height,
          weight: member.weight,
          gender: member.gender,
          subscription_start: member.subscriptionStart,
          subscription_end: member.subscriptionEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", member.id),
    );

    // 2. Clear existing relationships
    promises.push(
      supabase.from("member_courses").delete().eq("member_id", member.id),
    );

    promises.push(
      supabase.from("member_diet_plans").delete().eq("member_id", member.id),
    );

    // Wait for deletions to complete
    await Promise.all(promises);

    // 3. Add new courses
    if (courseIds.length > 0) {
      // Get course names
      const { data: courses } = await supabase
        .from("courses")
        .select("id, name")
        .in("id", courseIds);

      const courseMap = new Map(courses?.map((c) => [c.id, c.name]) || []);

      const coursesToInsert = courseIds.map((courseId) => ({
        member_id: member.id,
        course_id: courseId,
        course_name: courseMap.get(courseId) || courseId,
        assigned_date: new Date().toISOString(),
      }));

      const { error: coursesError } = await supabase
        .from("member_courses")
        .insert(coursesToInsert);

      if (coursesError) {
        console.error("Error inserting member courses:", coursesError);
        throw coursesError;
      }
    }

    // 4. Add new diet plans
    if (dietPlanIds.length > 0) {
      // Get diet plan names
      const { data: dietPlans } = await supabase
        .from("diet_plans")
        .select("id, name")
        .in("id", dietPlanIds);

      const dietPlanMap = new Map(dietPlans?.map((d) => [d.id, d.name]) || []);

      const dietPlansToInsert = dietPlanIds.map((dietPlanId) => ({
        member_id: member.id,
        diet_plan_id: dietPlanId,
        diet_plan_name: dietPlanMap.get(dietPlanId) || dietPlanId,
        assigned_date: new Date().toISOString(),
      }));

      const { error: dietPlansError } = await supabase
        .from("member_diet_plans")
        .insert(dietPlansToInsert);

      if (dietPlansError) {
        console.error("Error inserting member diet plans:", dietPlansError);
        throw dietPlansError;
      }
    }

    console.log("✅ Member updated with relationships successfully");
    return true;
  } catch (error) {
    console.error("Error in updateMemberWithRelationships:", error);
    return false;
  }
}

// Get all members with their relationships (for listing)
export async function getAllMembersWithRelationships(): Promise<
  MemberWithRelationships[]
> {
  try {
    console.log("📋 Getting all members with relationships");

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (membersError) {
      console.error("Error getting members:", membersError);
      return [];
    }

    if (!members || members.length === 0) {
      return [];
    }

    const memberIds = members.map((m) => m.id);

    // Get all member courses
    const { data: memberCourses } = await supabase
      .from("member_courses")
      .select("*")
      .in("member_id", memberIds);

    // Get all member diet plans
    const { data: memberDietPlans } = await supabase
      .from("member_diet_plans")
      .select("*")
      .in("member_id", memberIds);

    // Group by member_id
    const coursesMap = new Map<string, MemberCourse[]>();
    const dietPlansMap = new Map<string, MemberDietPlan[]>();

    (memberCourses || []).forEach((mc) => {
      if (!coursesMap.has(mc.member_id)) {
        coursesMap.set(mc.member_id, []);
      }
      coursesMap.get(mc.member_id)!.push(mc);
    });

    (memberDietPlans || []).forEach((mdp) => {
      if (!dietPlansMap.has(mdp.member_id)) {
        dietPlansMap.set(mdp.member_id, []);
      }
      dietPlansMap.get(mdp.member_id)!.push(mdp);
    });

    // Combine data
    const result = members.map((member) => {
      const memberCourses = coursesMap.get(member.id) || [];
      const memberDietPlans = dietPlansMap.get(member.id) || [];

      return {
        ...member,
        member_courses: memberCourses,
        member_diet_plans: memberDietPlans,
        courseGroups: memberCourses.map((mc) => ({
          id: mc.course_id,
          name: mc.course_name,
        })),
        dietPlanGroups: memberDietPlans.map((mdp) => ({
          id: mdp.diet_plan_id,
          name: mdp.diet_plan_name,
        })),
      };
    });

    console.log("✅ All members with relationships loaded:", {
      membersCount: result.length,
      totalCourses: memberCourses?.length || 0,
      totalDietPlans: memberDietPlans?.length || 0,
    });

    return result;
  } catch (error) {
    console.error("Error in getAllMembersWithRelationships:", error);
    return [];
  }
}

// Check if relationship tables exist
export async function checkRelationshipTables(): Promise<{
  exists: boolean;
  message: string;
}> {
  try {
    const { data, error } = await supabase
      .from("member_courses")
      .select("id")
      .limit(1);

    if (error && error.code === "42P01") {
      return {
        exists: false,
        message:
          "جداول العلاقات غير موجودة. يجب تنفيذ MEMBER_RELATIONSHIP_TABLES_FIX.sql",
      };
    }

    const { data: data2, error: error2 } = await supabase
      .from("member_diet_plans")
      .select("id")
      .limit(1);

    if (error2 && error2.code === "42P01") {
      return {
        exists: false,
        message:
          "جدول العلاقات للأنظمة الغذائية غير موجود. يجب تنفيذ MEMBER_RELATIONSHIP_TABLES_FIX.sql",
      };
    }

    return {
      exists: true,
      message: "جداول العلاقات موجودة وجاهزة للاستخدام",
    };
  } catch (error) {
    return {
      exists: false,
      message: `خطأ في فحص جداول العلاقات: ${error}`,
    };
  }
}
