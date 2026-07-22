type MacroPaginationDotsProps = {
  count: number;
  active: number;
};

export function MacroPaginationDots({ count, active }: MacroPaginationDotsProps) {
  return (
    <div aria-hidden="true" className="macro-dots">
      {Array.from({ length: count }, (_, index) => (
        <span className={`macro-dot${index === active ? " active" : ""}`} key={index} />
      ))}
    </div>
  );
}
