import { useState } from "react";
import { createPortal } from "react-dom";
import { X, WifiOff, AlertCircle, Save, XCircle } from "lucide-react";

const TicketModal = ({
  ticket,
  closeModal,
  saveTicketChanges,
  isConnected,
}) => {

  const [subject, setSubject] = useState(ticket.subject);

  const [status, setStatus] = useState(ticket.status);

  const [notes, setNotes] = useState(ticket.notes || "");

  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = async () => {
    if (!isConnected || isSaving) {
      setErrorMessage("Connection Lost: Reconnecting...");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const updatedTicket = {
      ...ticket,
      subject,
      status,
      notes,
      updatedAt: "Just now",
    };

    const result = await saveTicketChanges(updatedTicket);

    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(
        result.lockedBy
          ? `Ticket is locked by ${result.lockedBy}.`
          : result.message || "Unable to save this ticket."
      );
    }
  };

  return createPortal(
    <div className="modal-overlay">

      <div className="ticket-modal">

        <div className="modal-header">

          <h2>Edit Ticket</h2>

          <button
            className="close-modal-btn"
            onClick={closeModal}
            aria-label="Close editor and release lock"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

        </div>

        <div className="modal-content">

          {!isConnected && (
            <div className="modal-warning">
              <WifiOff size={15} style={{ marginRight: 8, verticalAlign: "middle" }} />
              Connection Lost: Reconnecting...
            </div>
          )}

          {errorMessage && (
            <div className="modal-error">
              <AlertCircle size={15} style={{ marginRight: 8, verticalAlign: "middle" }} />
              {errorMessage}
            </div>
          )}

          <div className="form-group">

            <label>Customer</label>

            <input
              type="text"
              value={ticket.customer}
              readOnly
            />

          </div>

          <div className="form-group">

            <label>Subject</label>

            <input
              type="text"
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
            />

          </div>

          <div className="form-group">

            <label>Status</label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >
              <option>Open</option>
              <option>Pending</option>
              <option>Resolved</option>
            </select>

          </div>

          <div className="form-group">

            <label>Internal Notes</label>

            <textarea
              rows="5"
              placeholder="Add ticket notes..."
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
            ></textarea>

          </div>

        </div>

        <div className="modal-footer">

          <button
            className="secondary-btn"
            onClick={closeModal}
          >
            <XCircle size={15} style={{ marginRight: 6 }} />
            Close
          </button>

          <button
            className="primary-btn"
            onClick={handleSave}
            disabled={isSaving || !isConnected}
          >
            <Save size={15} style={{ marginRight: 6 }} />
            {isSaving ? "Saving" : "Save Changes"}
          </button>

        </div>

      </div>

    </div>,
    document.body
  );
};

export default TicketModal;
