import { useEffect, useRef } from "react";

export default function Toast({ message, type = "success", onHide }) {
  const ref = useRef();
  useEffect(() => {
    if (!message) return;
    const el = ref.current;
    el.classList.add("show");
    if (type === "error") el.classList.add("error");
    else el.classList.remove("error");
    const t = setTimeout(() => { el.classList.remove("show"); onHide?.(); }, 3000);
    return () => clearTimeout(t);
  }, [message]);
  return <div className="toast" ref={ref}>{message}</div>;
}
