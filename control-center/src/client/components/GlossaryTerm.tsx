import { useState, useRef, useEffect } from "react";
import { GLOSSARY } from "@shared/glossary";

interface Props {
  term: string;
  children?: React.ReactNode;
  showUnit?: boolean;
}

export function GlossaryTerm({ term, children, showUnit }: Props) {
  const entry = GLOSSARY[term.toLowerCase()];
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("above");
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition(rect.top < 200 ? "below" : "above");
    }
  }, [show]);

  if (!entry) {
    return <>{children ?? term}</>;
  }

  return (
    <span
      ref={ref}
      className="glossary-term"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      role="term"
      aria-describedby={show ? `glossary-${term}` : undefined}
    >
      {children ?? entry.term}
      {showUnit && entry.unit && (
        <span className="glossary-unit"> ({entry.unit})</span>
      )}

      {show && (
        <div
          id={`glossary-${term}`}
          className={`glossary-tooltip glossary-tooltip--${position}`}
          role="tooltip"
        >
          <div className="glossary-tooltip__plain">{entry.plain}</div>

          {entry.technical && (
            <details className="glossary-tooltip__technical">
              <summary>Technical detail</summary>
              <p>{entry.technical}</p>
            </details>
          )}

          {entry.matters && (
            <div className="glossary-tooltip__matters">
              {entry.matters}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
