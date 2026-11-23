-- More airports for the flight booking form (From / To suggestions), added to the list from 0035.
-- Same format as 0035: 3-letter IATA code + city name, shown in the portal as "Name (CODE)".
-- sort_order continues after the last 0035 row (London, 52).
-- Idempotent: rows are only added (ON CONFLICT DO NOTHING keeps any later edit to a row).
-- Nothing is updated or deleted.

INSERT INTO airports (code, name, sort_order) VALUES
    ('LYP', 'Faisalabad', 53),
    ('IXC', 'Chandigarh', 54),
    ('FJR', 'Fujairah', 55),
    ('STV', 'Surat', 56),
    ('GOP', 'Gorakhpur', 57),
    ('PAT', 'Patna', 58),
    ('BBI', 'Bhubaneswar', 59),
    ('CJB', 'Coimbatore', 60),
    ('IDR', 'Indore', 61),
    ('DED', 'Dehradun', 62),
    ('AYJ', 'Ayodhya', 63),
    ('NMI', 'Navi Mumbai', 64),
    ('KTM', 'Kathmandu', 65)
ON CONFLICT (code) DO NOTHING;
