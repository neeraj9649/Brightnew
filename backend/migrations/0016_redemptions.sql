-- Reward Redemption Program: an admin-editable catalog of rewards, and the
-- customer redemption requests against it. Wings (the loyalty balance, stored
-- as users.tokens) are reserved at request time and refunded on reject/cancel
-- -- the debit/refund themselves ride the existing reward_transactions ledger.

CREATE TABLE reward_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    description TEXT,
    category VARCHAR(60),
    wings_cost INT NOT NULL CHECK (wings_cost > 0),
    image_file_id VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_item_id UUID NOT NULL REFERENCES reward_items(id),
    -- snapshot name/cost so later catalog edits don't rewrite past requests
    item_name VARCHAR(120) NOT NULL,
    wings_cost INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN (
        'requested', 'approved', 'voucher_issued', 'delivered', 'rejected', 'cancelled'
    )),
    voucher_code VARCHAR(40),
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_redemptions_user ON redemptions(user_id, created_at DESC);
CREATE INDEX idx_redemptions_status ON redemptions(status, created_at DESC);

-- Seed the example rewards (admin can edit costs / add / hide later).
INSERT INTO reward_items (name, description, category, wings_cost) VALUES
    ('Dhow Cruise Experience', 'Traditional dhow dinner cruise with views of the marina.', 'Experiences', 500),
    ('Desert Safari Package', 'Dune bashing, camel ride, BBQ dinner and live shows.', 'Experiences', 800),
    ('Attraction Tickets', 'Entry tickets to top attractions and theme parks.', 'Tickets', 300),
    ('Air Tickets', 'Redeem Wings towards a domestic or international air ticket.', 'Travel', 5000),
    ('Holiday Package', 'A curated holiday package to a destination of your choice.', 'Travel', 10000),
    ('Membership Upgrade', 'Upgrade your Bright Wings membership tier.', 'Membership', 2000),
    ('Exclusive Travel Benefits', 'Lounge access, priority support and partner perks.', 'Benefits', 1500);
