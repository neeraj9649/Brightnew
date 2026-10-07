-- Staff workspace: richer follow-up tasks (priority, in-progress state and an
-- optional direct customer link for enquiries that have no booking yet).
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled'));
ALTER TABLE tasks
    ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('high', 'medium', 'low')),
    ADD COLUMN customer_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_customer_id ON tasks(customer_id);
