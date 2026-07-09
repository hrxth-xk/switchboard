type MacroPaginationDotsProps = {
  count: number;
  active: number;
};

export function MacroPaginationDots({ count, active }: MacroPaginationDotsProps) {
  return (
    <div className="macro-dots" role="tablist" aria-label="Dashboard period">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          role="tab"
          aria-selected={index === active}
          aria-label={["Daily", "Weekly", "Monthly"][index]}
          className={`macro-dot${index === active ? " active" : ""}`}
        />
      ))}
    </div>
  );
}
