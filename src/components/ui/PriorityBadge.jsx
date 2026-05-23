function PriorityBadge({
  priority,
}) {

  return (
    <span
      className={`priority ${priority.toLowerCase()}`}
    >
      {priority}
    </span>
  );
}

export default PriorityBadge;