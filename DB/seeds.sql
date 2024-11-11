-- Insert departments first
INSERT INTO department (name) VALUES 
    ('Engineering'),
    ('Sales'),
    ('Finance'),
    ('Legal');

-- Insert roles after departments
INSERT INTO role (title, salary, department_id) VALUES
    ('Lead Engineer', 150000, 1),         -- Engineering manager role first
    ('Software Engineer', 120000, 1),      -- Regular engineering role
    ('Sales Manager', 100000, 2),         -- Sales manager role first
    ('Sales Representative', 80000, 2),    -- Regular sales role
    ('Finance Manager', 125000, 3),        -- Finance manager role
    ('Legal Counsel', 190000, 4);          -- Legal role

-- Insert employees after roles (managers first)
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES
    ('John', 'Doe', 1, NULL),              -- Lead Engineer (manager)
    ('Mike', 'Wilson', 3, NULL),           -- Sales Manager
    ('Tom', 'Allen', 5, NULL),             -- Finance Manager
    ('Lisa', 'Johnson', 6, NULL),          -- Legal Counsel
    ('Jane', 'Smith', 2, 1),               -- Software Engineer (reports to John)
    ('Sarah', 'Brown', 4, 2);              -- Sales Rep (reports to Mike)