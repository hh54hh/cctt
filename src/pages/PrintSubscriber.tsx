import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSubscriberWithGroups } from "@/lib/database-offline";
import { SubscriberWithGroups } from "@/lib/types-new";
import CompactPrintCard from "@/components/CompactPrintCard";

export default function PrintSubscriber() {
  const { id } = useParams();
  const [subscriber, setSubscriber] = useState<SubscriberWithGroups | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscriber = async () => {
      if (!id) {
        setError("معرف المشترك مفقود");
        setLoading(false);
        return;
      }

      try {
        const data = await getSubscriberWithGroups(id);
        if (!data) {
          setError("لم يتم العثور على المشترك");
        } else {
          setSubscriber(data);
          // Auto print after load
          setTimeout(() => {
            window.print();
          }, 1000);
        }
      } catch (err) {
        console.error("Error loading subscriber:", err);
        setError("خطأ في تحميل بيانات المشترك");
      } finally {
        setLoading(false);
      }
    };

    loadSubscriber();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "Arial, sans-serif",
          direction: "rtl",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "5px solid #f3f3f3",
              borderTop: "5px solid #f97316",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          ></div>
          <p>جاري تحميل بيانات المشترك...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "Arial, sans-serif",
          direction: "rtl",
          textAlign: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "48px",
              color: "#ef4444",
              marginBottom: "20px",
            }}
          >
            ⚠️
          </div>
          <h2 style={{ color: "#ef4444", marginBottom: "10px" }}>خطأ</h2>
          <p style={{ color: "#666" }}>{error}</p>
          <button
            onClick={() => window.close()}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#f97316",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    );
  }

  if (!subscriber) {
    return null;
  }

  return <CompactPrintCard subscriber={subscriber} />;
}
