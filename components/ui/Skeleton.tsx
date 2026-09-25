"use client";

export function Skeleton({ width = "100%", height = 16, borderRadius = 6, style = {} }: {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style,
    }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

export function QuestionCardSkeleton() {
  return (
    <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
      <Skeleton height={20} width="65%" style={{ marginBottom: 10 }} />
      <Skeleton height={14} width="90%" style={{ marginBottom: 6 }} />
      <Skeleton height={14} width="75%" style={{ marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <Skeleton height={22} width={60} borderRadius={99} />
        <Skeleton height={22} width={60} borderRadius={99} />
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div style={{ background: "white", borderRadius: 10, border: "1px solid #e5e7eb", padding: "14px 16px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Skeleton width={26} height={26} borderRadius={99} />
        <Skeleton width={80} height={13} />
        <Skeleton width={50} height={12} />
      </div>
      <Skeleton height={14} width="90%" style={{ marginBottom: 6 }} />
      <Skeleton height={14} width="70%" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28 }}>
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <Skeleton width={72} height={72} borderRadius={99} />
        <div style={{ flex: 1 }}>
          <Skeleton height={22} width="40%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="60%" style={{ marginBottom: 6 }} />
          <Skeleton height={13} width="30%" />
        </div>
      </div>
      <Skeleton height={1} style={{ marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 24 }}>
        <Skeleton height={40} width={60} />
        <Skeleton height={40} width={60} />
      </div>
    </div>
  );
}
