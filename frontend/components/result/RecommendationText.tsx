interface RecommendationTextProps {
  text: string;
  sublabel?: string;
}

export function RecommendationText({ text, sublabel }: RecommendationTextProps) {
  return (
    <div className="text-center px-4">
      <p className="text-sm text-text leading-relaxed">{text}</p>
      {sublabel && (
        <p className="text-xs text-text-muted mt-1">{sublabel}</p>
      )}
    </div>
  );
}
