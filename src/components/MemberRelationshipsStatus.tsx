import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { checkRelationshipTables } from "../lib/memberRelationships";
import { getMembers } from "../lib/storage-new";
import { CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

export default function MemberRelationshipsStatus() {
  const [status, setStatus] = useState<{
    tablesExist: boolean | null;
    memberCount: number;
    membersWithIssues: number;
    message: string;
  }>({
    tablesExist: null,
    memberCount: 0,
    membersWithIssues: 0,
    message: "جاري الفحص...",
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      // Check if relationship tables exist
      const tablesResult = await checkRelationshipTables();

      // Get members count and check for issues
      const members = await getMembers();
      const membersWithIssues = members.filter((member) => {
        const hasCoursesButNoProperFormat =
          member.courseGroups &&
          member.courseGroups.length > 0 &&
          !Array.isArray(member.courseGroups);

        const hasDietPlansButNoProperFormat =
          member.dietPlanGroups &&
          member.dietPlanGroups.length > 0 &&
          !Array.isArray(member.dietPlanGroups);

        return hasCoursesButNoProperFormat || hasDietPlansButNoProperFormat;
      }).length;

      setStatus({
        tablesExist: tablesResult.exists,
        memberCount: members.length,
        membersWithIssues,
        message: tablesResult.message,
      });
    } catch (error) {
      setStatus({
        tablesExist: false,
        memberCount: 0,
        membersWithIssues: 0,
        message: `خطأ في الفحص: ${error}`,
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        {status.tablesExist === null && (
          <Badge variant="secondary">جاري الفحص...</Badge>
        )}
        {status.tablesExist === true && status.membersWithIssues === 0 && (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            جداول العلاقات جاهزة
          </Badge>
        )}
        {(status.tablesExist === false || status.membersWithIssues > 0) && (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            يتطلب إصلاح
          </Badge>
        )}
      </div>

      <div className="text-xs text-gray-600">
        {status.memberCount} عضو
        {status.membersWithIssues > 0 &&
          ` · ${status.membersWithIssues} بحاجة إصلاح`}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={checkStatus}
        disabled={isChecking}
        className="h-6 px-2"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
