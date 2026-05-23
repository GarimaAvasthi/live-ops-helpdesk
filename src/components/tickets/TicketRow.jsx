import { useState } from "react";
import { Lock, Pencil } from "lucide-react";

import TicketModal from "./TicketModal";

const getAvatarGradient = (name = "") => {
  const colors = [
    ["#3b82f6", "#1d4ed8"], // Blue
    ["#10b981", "#047857"], // Green
    ["#f59e0b", "#b45309"], // Amber
    ["#ef4444", "#b91c1c"], // Red
    ["#8b5cf6", "#6d28d9"], // Purple
    ["#ec4899", "#be185d"], // Pink
    ["#14b8a6", "#0f766e"], // Teal
    ["#f97316", "#c2410c"], // Orange
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return `linear-gradient(135deg, ${colors[index][0]}, ${colors[index][1]})`;
};

const TicketRow = ({
  ticket,
  lockTicket,
  unlockTicket,
  saveTicketChanges,
  currentSocketId,
  isConnected,
  isFresh,
}) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [lockError, setLockError] = useState("");

  const isLockedByCurrentClient =
    ticket.locked &&
    ticket.lockedById === currentSocketId;

  const isLockedByOtherUser =
    ticket.locked &&
    !isLockedByCurrentClient;

  const handleEditClick = async () => {
    if (isLockedByOtherUser || isLocking || !isConnected) {
      return;
    }

    setLockError("");
    setIsLocking(true);

    const result = isLockedByCurrentClient
      ? { ok: true }
      : await lockTicket(ticket.id);

    setIsLocking(false);

    if (!result.ok) {
      setLockError(
        result.lockedBy
          ? `Locked by ${result.lockedBy}`
          : result.message || "This ticket could not be locked."
      );
      return;
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveAndRelease = async (updatedTicket) => {
    const result = await saveTicketChanges(updatedTicket);

    if (!result.ok) {
      return result;
    }

    setIsModalOpen(false);

    return result;
  };

  const editDisabled =
    isLockedByOtherUser ||
    isLocking ||
    !isConnected;

  return (
    <>
      <div
        className={`ticket-row ${
          isLockedByOtherUser ? "locked-by-other locked" : ""
        } ${
          isLockedByCurrentClient ? "locked-by-me locked" : ""
        } ${
          isFresh ? "ticket-row-fresh" : ""
        }`}
      >

        <div className="ticket-cell requester">

          <div className="avatar" style={{ background: getAvatarGradient(ticket.customer) }}>
            {ticket.customer.charAt(0)}
          </div>

          <div>

            <h4>{ticket.customer}</h4>

            {ticket.locked && (
              <div className="lock-text">

                <Lock
                  size={12}
                  strokeWidth={2.5}
                  className="lock-icon"
                  style={{ marginRight: "4px" }}
                />

                <span>
                  Locked by {ticket.lockedBy}{isLockedByCurrentClient ? " (You)" : ""}
                </span>

              </div>
            )}

            {lockError && (
              <div className="lock-error">
                {lockError}
              </div>
            )}

          </div>

        </div>

        <div className="ticket-cell subject-cell">
          {ticket.subject}
        </div>

        <div className="ticket-cell status-cell">

          <span
            className={`status ${ticket.status.toLowerCase()}`}
          >
            {ticket.status}
          </span>

        </div>

        <div className="ticket-cell priority-cell">

          <span
            className={`priority ${ticket.priority.toLowerCase()}`}
          >
            {ticket.priority}
          </span>

        </div>

        <div className="ticket-cell assignee-cell">
          {ticket.assignee}
        </div>

        <div className="ticket-cell updated-cell">
          {ticket.updatedAt}
        </div>

        <div className="ticket-cell actions-cell">

          <button
            className="edit-btn"
            disabled={editDisabled}
            onClick={handleEditClick}
            title={
              isLockedByOtherUser
                ? `${ticket.lockedBy} is editing this ticket`
                : "Edit ticket"
            }
          >
            <Pencil size={14} strokeWidth={2.2} />
            {isLocking ? "Locking" : "Edit"}
          </button>

        </div>

      </div>

      {isModalOpen && (

        <TicketModal
          ticket={ticket}
          closeModal={handleCloseModal}
          saveTicketChanges={handleSaveAndRelease}
          isConnected={isConnected}
        />

      )}

    </>
  );
};

export default TicketRow;
