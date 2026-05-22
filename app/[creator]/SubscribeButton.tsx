"use client";

interface Props {
  creatorProfileId: string;
  handle: string;
  price: number | null;
  isSubscribed: boolean;
}

export default function SubscribeButton({ creatorProfileId, handle, price, isSubscribed }: Props) {
  if (isSubscribed) {
    return (
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "var(--accent)",
        padding: "10px 18px",
        border: "1px solid var(--accent-border)",
        borderRadius: "var(--r-pill)",
        background: "var(--accent-soft)",
      }}>
        ✓ Subscribed
      </div>
    );
  }

  const label = price
    ? `Subscribe · $${Number(price).toFixed(0)}/mo`
    : "Subscribe";

  function handleClick() {
    // CCBill integration point — route to /api/subscribe with creator info
    window.location.href = `/api/subscribe?creator_profile_id=${creatorProfileId}&handle=${handle}`;
  }

  return (
    <button onClick={handleClick} className="btn btn--primary">
      {label}
    </button>
  );
}
