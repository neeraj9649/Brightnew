import React, { createContext, useContext, useCallback } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CrmContext = createContext();

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (context === undefined) {
    throw new Error("useCrm must be used within a CrmProvider");
  }
  return context;
};

const mapNoteDTO = (dto) => ({
  id: dto.id,
  bookingId: dto.booking_id,
  authorId: dto.author_id,
  note: dto.note,
  noteType: dto.note_type || "communication",
  createdAt: new Date(dto.created_at),
});

const mapExpenseDTO = (dto) => ({
  id: dto.id,
  bookingId: dto.booking_id,
  category: dto.category,
  amount: dto.amount,
  vendor: dto.vendor,
  description: dto.description,
  startDate: dto.start_date ? new Date(dto.start_date) : null,
  endDate: dto.end_date ? new Date(dto.end_date) : null,
  fileId: dto.file_id,
  createdAt: new Date(dto.created_at),
});

const mapDocumentDTO = (dto) => ({
  id: dto.id,
  bookingId: dto.booking_id,
  kind: dto.kind,
  fileId: dto.file_id,
  label: dto.label,
  createdAt: new Date(dto.created_at),
});

const mapQuotationDTO = (dto) => ({
  id: dto.id,
  bookingId: dto.booking_id,
  fileId: dto.file_id,
  uploadedBy: dto.uploaded_by,
  createdAt: new Date(dto.created_at),
});

const mapTaskDTO = (dto) => ({
  id: dto.id,
  bookingId: dto.booking_id,
  assignedTo: dto.assigned_to,
  title: dto.title,
  description: dto.description,
  dueAt: dto.due_at ? new Date(dto.due_at) : null,
  status: dto.status,
  createdBy: dto.created_by,
  createdAt: new Date(dto.created_at),
  completedAt: dto.completed_at ? new Date(dto.completed_at) : null,
});

// All /crm/* routes require the "employee" or "admin" role -- every function
// here is a no-op for a plain customer.
export const CrmProvider = ({ children }) => {
  const { isStaff } = useAuth();

  const addNote = useCallback(
    async (bookingId, note, noteType = "communication") => {
      if (!isStaff) return null;
      try {
        const dto = await api.post("/crm/notes", {
          booking_id: bookingId,
          note,
          note_type: noteType,
        });
        toast.success("Note added");
        return mapNoteDTO(dto);
      } catch (error) {
        toast.error(error.message || "Failed to add note");
        return null;
      }
    },
    [isStaff],
  );

  const listNotes = useCallback(
    async (bookingId) => {
      if (!isStaff) return [];
      try {
        const dtos = await api.get(`/crm/bookings/${bookingId}/notes`);
        return dtos.map(mapNoteDTO);
      } catch (error) {
        toast.error(error.message || "Failed to load notes");
        return [];
      }
    },
    [isStaff],
  );

  const addQuotation = useCallback(
    async (bookingId, fileId) => {
      if (!isStaff) return null;
      try {
        const dto = await api.post("/crm/quotations", {
          booking_id: bookingId,
          file_id: fileId,
        });
        toast.success("Quotation attached");
        return mapQuotationDTO(dto);
      } catch (error) {
        toast.error(error.message || "Failed to attach quotation");
        return null;
      }
    },
    [isStaff],
  );

  const listQuotations = useCallback(
    async (bookingId) => {
      if (!isStaff) return [];
      try {
        const dtos = await api.get(`/crm/bookings/${bookingId}/quotations`);
        return dtos.map(mapQuotationDTO);
      } catch (error) {
        toast.error(error.message || "Failed to load quotations");
        return [];
      }
    },
    [isStaff],
  );

  const createTask = useCallback(
    async ({ bookingId, assignedTo, title, description, dueAt }) => {
      if (!isStaff) return null;
      try {
        const dto = await api.post("/crm/tasks", {
          booking_id: bookingId || undefined,
          assigned_to: assignedTo,
          title,
          description: description || undefined,
          due_at: dueAt || undefined,
        });
        toast.success("Task created");
        return mapTaskDTO(dto);
      } catch (error) {
        toast.error(error.message || "Failed to create task");
        return null;
      }
    },
    [isStaff],
  );

  const listMyTasks = useCallback(async () => {
    if (!isStaff) return [];
    try {
      const dtos = await api.get("/crm/tasks/me");
      return dtos.map(mapTaskDTO);
    } catch (error) {
      toast.error(error.message || "Failed to load tasks");
      return [];
    }
  }, [isStaff]);

  const listTasksForBooking = useCallback(
    async (bookingId) => {
      if (!isStaff) return [];
      try {
        const dtos = await api.get(`/crm/bookings/${bookingId}/tasks`);
        return dtos.map(mapTaskDTO);
      } catch (error) {
        toast.error(error.message || "Failed to load tasks");
        return [];
      }
    },
    [isStaff],
  );

  const completeTask = useCallback(
    async (taskId) => {
      if (!isStaff) return null;
      try {
        const dto = await api.patch(`/crm/tasks/${taskId}/complete`);
        toast.success("Task completed");
        return mapTaskDTO(dto);
      } catch (error) {
        toast.error(error.message || "Failed to complete task");
        return null;
      }
    },
    [isStaff],
  );

  const cancelTask = useCallback(
    async (taskId) => {
      if (!isStaff) return null;
      try {
        const dto = await api.patch(`/crm/tasks/${taskId}/cancel`);
        toast.success("Task cancelled");
        return mapTaskDTO(dto);
      } catch (error) {
        toast.error(error.message || "Failed to cancel task");
        return null;
      }
    },
    [isStaff],
  );

  /* ---------------- Expenses (= schedule legs + PnL cost lines) ------- */
  const listExpenses = useCallback(
    async (bookingId) => {
      if (!isStaff) return [];
      try {
        const dtos = await api.get(`/crm/bookings/${bookingId}/expenses`);
        return dtos.map(mapExpenseDTO);
      } catch (error) {
        toast.error(error.message || "Failed to load expenses");
        return [];
      }
    },
    [isStaff],
  );

  const addExpense = useCallback(
    async (expense) => {
      if (!isStaff) return null;
      try {
        const dto = await api.post("/crm/expenses", {
          booking_id: expense.bookingId,
          category: expense.category,
          amount: Number(expense.amount),
          vendor: expense.vendor || undefined,
          description: expense.description || undefined,
          start_date: expense.startDate || undefined,
          end_date: expense.endDate || undefined,
          file_id: expense.fileId || undefined,
        });
        toast.success("Expense added");
        return mapExpenseDTO(dto);
      } catch (error) {
        toast.error(error.message || "Failed to add expense");
        return null;
      }
    },
    [isStaff],
  );

  const deleteExpense = useCallback(
    async (id) => {
      if (!isStaff) return false;
      try {
        await api.delete(`/crm/expenses/${id}`);
        toast.success("Expense removed");
        return true;
      } catch (error) {
        toast.error(error.message || "Failed to remove expense");
        return false;
      }
    },
    [isStaff],
  );

  /* ---------------- Documents (tickets/vouchers/invoices/...) --------- */
  const listDocuments = useCallback(
    async (bookingId) => {
      if (!isStaff) return [];
      try {
        const dtos = await api.get(`/crm/bookings/${bookingId}/documents`);
        return dtos.map(mapDocumentDTO);
      } catch (error) {
        toast.error(error.message || "Failed to load documents");
        return [];
      }
    },
    [isStaff],
  );

  const addDocument = useCallback(
    async ({ bookingId, kind, fileId, label }) => {
      if (!isStaff) return null;
      try {
        const dto = await api.post("/crm/documents", {
          booking_id: bookingId,
          kind,
          file_id: fileId,
          label: label || undefined,
        });
        toast.success("Document attached");
        return mapDocumentDTO(dto);
      } catch (error) {
        toast.error(error.message || "Failed to attach document");
        return null;
      }
    },
    [isStaff],
  );

  const deleteDocument = useCallback(
    async (id) => {
      if (!isStaff) return false;
      try {
        await api.delete(`/crm/documents/${id}`);
        toast.success("Document removed");
        return true;
      } catch (error) {
        toast.error(error.message || "Failed to remove document");
        return false;
      }
    },
    [isStaff],
  );

  const getUserWingsHistory = useCallback(
    async (userId) => {
      if (!isStaff) return [];
      try {
        const dtos = await api.get(`/admin/rewards/users/${userId}`);
        return dtos.map((d) => ({
          id: d.id,
          points: d.points,
          reason: d.reason,
          description: d.description,
          createdAt: new Date(d.created_at),
        }));
      } catch (error) {
        toast.error(error.message || "Failed to load Wings history");
        return [];
      }
    },
    [isStaff],
  );

  const contextValue = {
    addNote,
    listNotes,
    addQuotation,
    listQuotations,
    createTask,
    listMyTasks,
    listTasksForBooking,
    completeTask,
    cancelTask,
    listExpenses,
    addExpense,
    deleteExpense,
    listDocuments,
    addDocument,
    deleteDocument,
    getUserWingsHistory,
  };

  return (
    <CrmContext.Provider value={contextValue}>{children}</CrmContext.Provider>
  );
};
